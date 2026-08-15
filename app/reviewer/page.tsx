import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { responses, forms } from "@/lib/db/schema";
import ReviewerInboxClient from "./ReviewerInboxClient";

export const dynamic = "force-dynamic";

export default async function ReviewerDashboard() {
  const db = getDb();

  const rows = await db
    .select({
      id: responses.id,
      form_id: responses.form_id,
      anonymous: responses.anonymous,
      respondent_name: responses.respondent_name,
      respondent_email: responses.respondent_email,
      need_1on1: responses.need_1on1,
      status: responses.status,
      created_at: responses.created_at,
      form_title: forms.title,
    })
    .from(responses)
    .leftJoin(forms, eq(responses.form_id, forms.id))
    .orderBy(desc(responses.created_at));

  return (
    <ReviewerInboxClient
      rows={rows.map((r) => ({
        ...r,
        created_at: r.created_at.toISOString(),
      }))}
    />
  );
}
