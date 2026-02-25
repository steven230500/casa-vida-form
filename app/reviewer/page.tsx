import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";

export default async function ReviewerDashboard() {
  const supabase = await createClient();

  // Fetch all responses, joining forms and profiles (for reviewer assignment)
  // Ordered by newest first
  const { data: responses, error } = await supabase
    .from("responses")
    .select(
      `
      id,
      anonymous,
      respondent_name,
      respondent_email,
      need_1on1,
      status,
      created_at,
      forms (title),
      profiles!responses_reviewed_by_fkey (full_name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching responses:", error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading responses. Please check console.
      </div>
    );
  }

  // Calculate quick stats
  const total = responses?.length || 0;
  const newCount = responses?.filter((r) => r.status === "new").length || 0;
  const needs1on1Count = responses?.filter((r) => r.need_1on1).length || 0;
  const pendingFollowups =
    responses?.filter((r) => r.status === "followup_pending").length || 0;

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

      {/* Inbox List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold">Inbox</h2>
          {/* Add basic filtering UI here later if needed */}
        </div>

        {responses?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No responses yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {responses?.map((res) => (
              <li
                key={res.id}
                className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <Link href={`/reviewer/${res.id}`} className="block px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar / Initials */}
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
                          <span className="truncate max-w-[200px] sm:max-w-xs">
                            {Array.isArray(res.forms)
                              ? (res.forms[0] as any)?.title
                              : (res.forms as any)?.title}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {format(
                              parseISO(res.created_at),
                              "MMM d, yyyy h:mm a",
                            )}
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
        )}
      </div>
    </div>
  );
}
