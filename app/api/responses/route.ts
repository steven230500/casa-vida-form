import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Simple in-memory rate limiting (Note: in production use Vercel KV or Upstash Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 5; // max 5 submissions
const WINDOW_MS = 60 * 1000; // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (now - record.lastReset > WINDOW_MS) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true; // Rate limited
  }

  record.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      form_id,
      draft_id, // Client generated UUID to avoid double submits
      anonymous,
      respondent_name,
      respondent_email,
      need_1on1,
      preferred_date,
      preferred_time,
      answers, // Array of { question_id, value, type? }
    } = body;

    if (!form_id || !draft_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing form_id, draft_id, or answers array" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Validate Form is Active
    const { data: form, error: formError } = await supabaseAdmin
      .from("forms")
      .select("is_active, start_at, end_at")
      .eq("id", form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.is_active) {
      return NextResponse.json(
        { error: "This form is no longer active" },
        { status: 403 },
      );
    }

    const now = new Date();
    if (form.start_at && new Date(form.start_at) > now) {
      return NextResponse.json(
        { error: "Form is not yet open" },
        { status: 403 },
      );
    }
    if (form.end_at && new Date(form.end_at) < now) {
      return NextResponse.json({ error: "Form has expired" }, { status: 403 });
    }

    // 2. Anti-duplication check using draft_id
    const { data: existingResponse } = await supabaseAdmin
      .from("responses")
      .select("id")
      .eq("draft_id", draft_id)
      .maybeSingle();

    if (existingResponse) {
      return NextResponse.json(
        {
          success: true,
          message: "Response already submitted successfully",
          response_id: existingResponse.id,
        },
        { status: 200 }, // Return success so client can proceed to success screen
      );
    }

    // 3. Custom Validations (e.g., points100 must sum to 100)
    for (const ans of answers) {
      // Assuming the client optionally sends the type, or we could fetch question definitions here.
      // For performance, we trust the client's payload structure but enforce the rule:
      if (ans.type === "points100") {
        const sum = Object.values(ans.value as Record<string, number>).reduce(
          (acc, val) => acc + Number(val),
          0,
        );
        if (sum !== 100) {
          return NextResponse.json(
            {
              error: `Points must sum to 100 for question ${ans.question_id}. Current sum: ${sum}`,
            },
            { status: 400 },
          );
        }
      }
    }

    // 4. Insert the main Response record
    const { data: response, error: responseError } = await supabaseAdmin
      .from("responses")
      .insert({
        form_id,
        draft_id,
        anonymous: anonymous ?? false,
        respondent_name,
        respondent_email,
        need_1on1: need_1on1 ?? false,
        preferred_date,
        preferred_time,
        status: "new",
      })
      .select("id")
      .single();

    if (responseError) {
      // Check if it's a unique constraint violation on draft_id that fired concurrently
      if (responseError.code === "23505") {
        return NextResponse.json(
          { error: "Duplicate submission detected" },
          { status: 409 },
        );
      }
      console.error("Error inserting response:", responseError);
      return NextResponse.json(
        { error: "Database error while saving response" },
        { status: 500 },
      );
    }

    const responseId = response.id;

    // 5. Prepare the answers array for bulk insert
    const formattedAnswers = answers.map((ans: any) => ({
      response_id: responseId,
      question_id: ans.question_id,
      value: ans.value,
    }));

    // 6. Insert all answers
    const { error: answersError } = await supabaseAdmin
      .from("answers")
      .insert(formattedAnswers);

    if (answersError) {
      console.error("Error inserting answers:", answersError);
      return NextResponse.json(
        { error: "Failed to save some answers" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Response submitted successfully",
        response_id: responseId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
