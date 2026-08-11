import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
            New
          </span>
        );
      case "reviewed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            Reviewed
          </span>
        );
      case "followup_pending":
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
            Needs Follow-up
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="text-gray-500 text-sm font-medium mb-1">
            Total Responses
          </div>
          <div className="text-3xl font-bold">{total}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900">
          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
            New
          </div>
          <div className="text-3xl font-bold">{newCount}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900 relative">
          <div className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">
            Needs Follow-up
          </div>
          <div className="text-3xl font-bold">{pendingFollowups}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900">
          <div className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">
            Requested 1-on-1
          </div>
          <div className="text-3xl font-bold">{needs1on1Count}</div>
        </div>
      </div>

      {/* Grouped Responses */}
      <div className="space-y-6">
        {Object.keys(groupedResponses).length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 text-center text-gray-500">
            No responses yet.
          </div>
        ) : (
          Object.entries(groupedResponses).map(([formTitle, formResponses]) => (
            <div
              key={formTitle}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">
                    {formTitle}
                  </span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {formResponses.length}
                  </span>
                </h2>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                {formResponses.map((res) => (
                  <li
                    key={res.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <Link
                      href={`/reviewer/${res.id}`}
                      className="block px-6 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shrink-0">
                            {res.anonymous
                              ? "A"
                              : (
                                  res.respondent_name?.charAt(0) || "?"
                                ).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {res.anonymous
                                  ? "Anonymous User"
                                  : res.respondent_name || "Unnamed User"}
                              </span>
                              {getStatusBadge(res.status)}
                              {res.need_1on1 && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] rounded-full uppercase tracking-wider font-bold">
                                  1-on-1
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                              <span>
                                {format(res.created_at, "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-gray-400">
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
