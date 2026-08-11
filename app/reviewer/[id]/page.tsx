import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { getDb } from "@/lib/db";
import { responses, forms, answers, questions, formBlocks, users } from "@/lib/db/schema";
import StatusDropdown from "./StatusDropdown";

export const dynamic = "force-dynamic";

export default async function ResponseDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  const db = getDb();

  const [response] = await db
    .select({
      id: responses.id,
      anonymous: responses.anonymous,
      respondent_name: responses.respondent_name,
      respondent_email: responses.respondent_email,
      need_1on1: responses.need_1on1,
      preferred_date: responses.preferred_date,
      preferred_time: responses.preferred_time,
      status: responses.status,
      created_at: responses.created_at,
      reviewed_at: responses.reviewed_at,
      form_title: forms.title,
      reviewer_name: users.full_name,
    })
    .from(responses)
    .leftJoin(forms, eq(responses.form_id, forms.id))
    .leftJoin(users, eq(responses.reviewed_by, users.id))
    .where(eq(responses.id, id))
    .limit(1);

  if (!response) {
    notFound();
  }

  const answerRows = await db
    .select({
      id: answers.id,
      value: answers.value,
      question_label: questions.label,
      question_type: questions.type,
      block_title: formBlocks.title,
    })
    .from(answers)
    .leftJoin(questions, eq(answers.question_id, questions.id))
    .leftJoin(formBlocks, eq(questions.block_id, formBlocks.id))
    .where(eq(answers.response_id, id));

  // Group answers by question block
  const groupedAnswers = answerRows.reduce((acc: Record<string, typeof answerRows>, ans) => {
    const blockTitle = ans.block_title || "General";
    if (!acc[blockTitle]) acc[blockTitle] = [];
    acc[blockTitle].push(ans);
    return acc;
  }, {});

  const renderValue = (value: any, type: string | null) => {
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
        <StatusDropdown responseId={response.id} currentStatus={response.status} />
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
                  Submitted: {format(response.created_at, "PPP 'at' p")}
                </span>
              </div>
              {response.reviewed_at && response.reviewer_name && (
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center space-x-2">
                  <span>
                    ✓ Last reviewed by {response.reviewer_name} on{" "}
                    {format(response.reviewed_at, "MMM d, h:mm a")}
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
                <div className="font-medium">{response.form_title}</div>
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
          {Object.entries(groupedAnswers).map(([blockTitle, blockAnswers]) => (
            <div key={blockTitle}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 flex items-center space-x-2">
                <span className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-xs">
                  Section
                </span>
                <span>{blockTitle}</span>
              </h2>
              <ul className="space-y-6">
                {blockAnswers.map((ans) => (
                  <li
                    key={ans.id}
                    className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4"
                  >
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {ans.question_label}
                    </p>
                    <div className="text-gray-700 dark:text-gray-300">
                      {renderValue(ans.value, ans.question_type)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

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
