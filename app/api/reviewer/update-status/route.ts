import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { responses, responseStatusValues } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { reviewerRoles } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !reviewerRoles.includes(session.role)) {
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

    if (!responseStatusValues.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();
    const [data] = await db
      .update(responses)
      .set({
        status,
        reviewed_by: session.userId,
        reviewed_at: new Date(),
      })
      .where(eq(responses.id, response_id))
      .returning({ id: responses.id });

    if (!data) {
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
