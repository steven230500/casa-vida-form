import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth Check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { response_id, status } = body;

    if (!response_id || !status) {
      return NextResponse.json(
        { error: "Missing response_id or status" },
        { status: 400 },
      );
    }

    const validStatuses = ["new", "reviewed", "followup_pending", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Because we use the standard cookie client (not admin client),
    // Supabase RLS policies will automatically block the UPDATE
    // if the user's role is not admin, reviewer, pastor, or leader.
    const { data, error } = await supabase
      .from("responses")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", response_id)
      .select("id")
      .single();

    if (error) {
      console.error("Error updating status:", error);
      // Determine if it was an RLS violation (usually row not found or 403 like error)
      return NextResponse.json(
        { error: "Failed to update or unauthorized" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, response_id: data.id });
  } catch (error) {
    console.error("Unexpected API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
