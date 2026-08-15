import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getDb } from "@/lib/db";
import { responses, forms } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function ReviewerDashboard() {
  const db = getDb();

  const rows = await db
    .select({
      id: responses.id,
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

  // Group responses by form title
  const groupedResponses: Record<string, typeof rows> = {};
  rows.forEach((res) => {
    const formTitle = res.form_title || "Unknown Form";
    if (!groupedResponses[formTitle]) {
      groupedResponses[formTitle] = [];
    }
    groupedResponses[formTitle].push(res);
  });

  // Calculate quick stats
  const total = rows.length;
  const newCount = rows.filter((r) => r.status === "new").length;
  const needs1on1Count = rows.filter((r) => r.need_1on1).length;
  const pendingFollowups = rows.filter(
    (r) => r.status === "followup_pending",
  ).length;

  const statusLabels: Record<string, string> = {
    new: "Nuevo",
    reviewed: "Revisado",
    followup_pending: "Necesita seguimiento",
    closed: "Cerrado",
  };

  const getStatusBadge = (status: string) => {
    const label = statusLabels[status];
    if (!label) return null;
    return (
      <span
        className={`px-2.5 py-0.5 text-[11px] rounded-full font-medium uppercase tracking-wide ${
          status === "new"
            ? "bg-beige text-beige-foreground"
            : "bg-background text-muted-foreground"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Respuestas totales
          </div>
          <div className="text-3xl font-semibold">{total}</div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Nuevas
          </div>
          <div className="text-3xl font-semibold">{newCount}</div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Necesitan seguimiento
          </div>
          <div className="text-3xl font-semibold">{pendingFollowups}</div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Pidieron 1 a 1
          </div>
          <div className="text-3xl font-semibold">{needs1on1Count}</div>
        </div>
      </div>

      {/* Grouped Responses */}
      <div className="space-y-6">
        {Object.keys(groupedResponses).length === 0 ? (
          <div className="rounded-2xl border border-foreground/10 bg-muted p-8 text-center text-muted-foreground">
            No hay respuestas todavía.
          </div>
        ) : (
          Object.entries(groupedResponses).map(([formTitle, formResponses]) => (
            <div
              key={formTitle}
              className="rounded-2xl border border-foreground/10 bg-muted overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-foreground/10 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span>{formTitle}</span>
                  <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                    {formResponses.length}
                  </span>
                </h2>
              </div>
              <ul className="divide-y divide-foreground/10">
                {formResponses.map((res) => (
                  <li
                    key={res.id}
                    className="hover:bg-background/60 transition-colors"
                  >
                    <Link
                      href={`/reviewer/${res.id}`}
                      className="block px-6 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-beige flex items-center justify-center text-beige-foreground font-semibold shrink-0">
                            {res.anonymous
                              ? "A"
                              : (
                                  res.respondent_name?.charAt(0) || "?"
                                ).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                {res.anonymous
                                  ? "Usuario anónimo"
                                  : res.respondent_name || "Sin nombre"}
                              </span>
                              {getStatusBadge(res.status)}
                              {res.need_1on1 && (
                                <span className="px-2 py-0.5 border border-foreground/15 text-[10px] rounded-full uppercase tracking-wider font-semibold">
                                  1 a 1
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center space-x-2">
                              <span>
                                {format(res.created_at, "d MMM yyyy, h:mm a", {
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-muted-foreground">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
