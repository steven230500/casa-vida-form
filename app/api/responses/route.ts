import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { forms, responses, answers, questions } from "@/lib/db/schema";
import { findOrCreatePerson } from "@/lib/people";
import { sendResponseConfirmation } from "@/lib/resend";
import { isRateLimited, requestIp } from "@/lib/rate-limit";

// Lets a form feed structured CRM fields (not just name/email) without any
// per-form configuration: word a question so its auto-generated key starts
// with one of these prefixes (the key is visible in the question list in
// the editor) and its answer flows into that field on the linked person.
const CRM_FIELD_KEY_PREFIXES: [string, "phone" | "birthdate" | "neighborhood" | "caregiverName"][] = [
  ["telefono", "phone"],
  ["celular", "phone"],
  ["fecha_de_nacimiento", "birthdate"],
  ["fecha_nacimiento", "birthdate"],
  ["cumpleanos", "birthdate"],
  ["barrio", "neighborhood"],
  ["cuidador", "caregiverName"],
];

async function extractCrmFields(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  submittedAnswers: { question_id: string; value: unknown }[],
) {
  const questionIds = submittedAnswers.map((a) => a.question_id);
  if (questionIds.length === 0) return {};

  const qs = await tx
    .select({ id: questions.id, key: questions.key })
    .from(questions)
    .where(inArray(questions.id, questionIds));

  const keyById = new Map(qs.map((q) => [q.id, q.key]));
  const fields: Partial<Record<"phone" | "birthdate" | "neighborhood" | "caregiverName", string>> = {};

  for (const ans of submittedAnswers) {
    const key = keyById.get(ans.question_id);
    if (!key || typeof ans.value !== "string" || !ans.value.trim()) continue;
    const match = CRM_FIELD_KEY_PREFIXES.find(([prefix]) => key.startsWith(prefix));
    if (match) fields[match[1]] = ans.value.trim();
  }

  return fields;
}

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting Check
    const ip = requestIp(request);
    if (isRateLimited(ip, { max: 5, windowMs: 60 * 1000 })) {
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
      answers: submittedAnswers, // Array of { question_id, value, type? }
      website, // Honeypot: hidden field real users never see or fill
    } = body;

    if (
      !form_id ||
      !draft_id ||
      !submittedAnswers ||
      !Array.isArray(submittedAnswers)
    ) {
      return NextResponse.json(
        { error: "Missing form_id, draft_id, or answers array" },
        { status: 400 },
      );
    }

    // Honeypot tripped: pretend success so the bot doesn't adapt, but save nothing.
    if (website) {
      return NextResponse.json(
        {
          success: true,
          message: "Response submitted successfully",
          response_id: draft_id,
        },
        { status: 201 },
      );
    }

    const db = getDb();

    // 1. Validate Form is Active
    const [form] = await db
      .select({
        title: forms.title,
        is_active: forms.is_active,
        start_at: forms.start_at,
        end_at: forms.end_at,
      })
      .from(forms)
      .where(eq(forms.id, form_id))
      .limit(1);

    if (!form) {
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
    const [existingResponse] = await db
      .select({ id: responses.id })
      .from(responses)
      .where(eq(responses.draft_id, draft_id))
      .limit(1);

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
    for (const ans of submittedAnswers) {
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

    // 4. Insert the main Response record, 5. Insert all answers
    let responseId: string;
    try {
      responseId = await db.transaction(async (tx) => {
        const crmFields = await extractCrmFields(tx, submittedAnswers);
        const personId = await findOrCreatePerson(tx, {
          anonymous: anonymous ?? false,
          name: respondent_name,
          email: respondent_email,
          ...crmFields,
        });

        const [response] = await tx
          .insert(responses)
          .values({
            form_id,
            draft_id,
            anonymous: anonymous ?? false,
            respondent_name,
            respondent_email,
            person_id: personId,
            need_1on1: need_1on1 ?? false,
            preferred_date,
            preferred_time,
            status: "new",
          })
          .returning({ id: responses.id });

        await tx.insert(answers).values(
          submittedAnswers.map((ans: any) => ({
            response_id: response.id,
            question_id: ans.question_id,
            value: ans.value,
          })),
        );

        return response.id;
      });
    } catch (error) {
      // Unique constraint violation on draft_id firing concurrently
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "Duplicate submission detected" },
          { status: 409 },
        );
      }
      console.error("Error inserting response:", error);
      return NextResponse.json(
        { error: "Database error while saving response" },
        { status: 500 },
      );
    }

    // Best-effort confirmation email - never fail the submission over it.
    if (respondent_email) {
      sendResponseConfirmation({
        to: respondent_email,
        formTitle: form.title,
      }).catch((error) => {
        console.error("Error sending confirmation email:", error);
      });
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
