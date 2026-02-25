import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import StatusDropdown from "./StatusDropdown";

export default async function ResponseDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient();

  // Fetch the full response details including nested answers and question metadata
  const { data: response, error } = await supabase
    .from("responses")
    .select(
      `
      id,
      anonymous,
      respondent_name,
      respondent_email,
      need_1on1,
      preferred_date,
      preferred_time,
      status,
      created_at,
      reviewed_at,
      forms ( title, description ),
      profiles!responses_reviewed_by_fkey ( full_name ),
      answers (
        id,
        value,
        questions (
          id,
          label,
          type,
          form_blocks ( title )
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !response) {
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching response detail:", error);
    }
    notFound();
  }

  // Group answers by question block
  const groupedAnswers = response.answers.reduce((acc: any, ans: any) => {
    // Determine the block title safely, handling array or object forms of form_blocks
    const blocksData = ans.questions?.form_blocks;
    const blockTitle = Array.isArray(blocksData)
      ? blocksData[0]?.title
      : blocksData?.title || "General";

    if (!acc[blockTitle]) acc[blockTitle] = [];
    acc[blockTitle].push(ans);
    return acc;
  }, {});

  const renderValue = (value: any, type: string) => {
    if (!value)
      return <span className="text-gray-400 italic">No answer provided</span>;

    if (type === "points100") {
      return (
        <ul className="list-disc list-inside space-y-1 mt-2">
          {Object.entries(value).map(([key, val]) => (
            <li key={key}>
              <span className="font-medium">{key}:</span> {String(val)} pts
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object") {
      return (
        <pre className="bg-gray-100 dark:bg-zinc-800 p-2 rounded text-sm mt-2">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <p className="mt-2 whitespace-pre-wrap">{String(value)}</p>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/reviewer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium flex items-center"
        >
          &larr; Back to Inbox
        </Link>
        <StatusDropdown
          responseId={response.id}
          currentStatus={response.status}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {/* Profile Card Header */}
        <div className="p-6 md:p-8 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {response.anonymous
                  ? "Anonymous Submission"
                  : response.respondent_name || "Unnamed User"}
              </h1>
              {response.respondent_email && (
                <div className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <span>✉️</span>
                  <a
                    href={`mailto:${response.respondent_email}`}
                    className="hover:underline"
                  >
                    {response.respondent_email}
                  </a>
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-4 flex items-center space-x-2">
                <span>
                  Submitted: {format(parseISO(response.created_at), "PPP at p")}
                </span>
              </div>
              {response.reviewed_at && response.profiles && (
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center space-x-2">
                  <span>
                    ✓ Last reviewed by{" "}
                    {Array.isArray(response.profiles)
                      ? (response.profiles[0] as any)?.full_name
                      : (response.profiles as any)?.full_name}{" "}
                    on {format(parseISO(response.reviewed_at), "MMM d, h:mm a")}
                  </span>
                </div>
              )}
            </div>

            {/* Form & 1on1 context */}
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm w-full md:w-auto md:min-w-[250px] space-y-3 border border-gray-100 dark:border-zinc-700">
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Form
                </div>
                <div className="font-medium">
                  {Array.isArray(response.forms)
                    ? (response.forms[0] as any)?.title
                    : (response.forms as any)?.title}
                </div>
              </div>
              {response.need_1on1 && (
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-700">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                    <span>Requested 1-on-1</span>
                  </div>
                  {(response.preferred_date || response.preferred_time) && (
                    <div className="text-sm mt-1">
                      Prefers: {response.preferred_date || "Any day"} at{" "}
                      {response.preferred_time || "any time"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answers Body */}
        <div className="p-6 md:p-8 space-y-10">
          {Object.entries(groupedAnswers).map(
            ([blockTitle, answers]: [string, any]) => (
              <div key={blockTitle}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 flex items-center space-x-2">
                  <span className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-xs">
                    Section
                  </span>
                  <span>{blockTitle}</span>
                </h2>
                <ul className="space-y-6">
                  {answers.map((ans: any) => (
                    <li
                      key={ans.id}
                      className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4"
                    >
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {ans.questions?.label}
                      </p>
                      <div className="text-gray-700 dark:text-gray-300">
                        {renderValue(ans.value, ans.questions?.type)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}

          {Object.keys(groupedAnswers).length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No questions were answered in this submission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
