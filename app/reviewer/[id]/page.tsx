import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
      return (
        <span className="text-muted-foreground italic">Sin respuesta</span>
      );

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
        <pre className="bg-background p-2 rounded text-sm mt-2">
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
          className="text-foreground font-medium flex items-center hover:opacity-70"
        >
          &larr; Volver a la bandeja
        </Link>
        <StatusDropdown responseId={response.id} currentStatus={response.status} />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-muted overflow-hidden">
        {/* Profile Card Header */}
        <div className="p-6 md:p-8 bg-beige/40 border-b border-foreground/10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                {response.anonymous
                  ? "Envío anónimo"
                  : response.respondent_name || "Sin nombre"}
              </h1>
              {response.respondent_email && (
                <div className="text-muted-foreground flex items-center space-x-2">
                  <span>✉️</span>
                  <a
                    href={`mailto:${response.respondent_email}`}
                    className="hover:underline"
                  >
                    {response.respondent_email}
                  </a>
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-4 flex items-center space-x-2">
                <span>
                  Enviado:{" "}
                  {format(response.created_at, "PPP 'a las' p", {
                    locale: es,
                  })}
                </span>
              </div>
              {response.reviewed_at && response.reviewer_name && (
                <div className="text-sm text-muted-foreground mt-1 flex items-center space-x-2">
                  <span>
                    ✓ Revisado por {response.reviewer_name} el{" "}
                    {format(response.reviewed_at, "d MMM, h:mm a", {
                      locale: es,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Form & 1on1 context */}
            <div className="bg-background p-4 rounded-xl w-full md:w-auto md:min-w-[250px] space-y-3 border border-foreground/10">
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Formulario
                </div>
                <div className="font-medium">{response.form_title}</div>
              </div>
              {response.need_1on1 && (
                <div className="pt-2 border-t border-foreground/10">
                  <div className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-1">
                    <span>Pidió 1 a 1</span>
                  </div>
                  {(response.preferred_date || response.preferred_time) && (
                    <div className="text-sm mt-1">
                      Prefiere: {response.preferred_date || "Cualquier día"} a
                      las {response.preferred_time || "cualquier hora"}
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
              <h2 className="text-lg font-semibold mb-4 border-b border-foreground/10 pb-2 flex items-center space-x-2">
                <span className="bg-background text-muted-foreground px-2 py-0.5 rounded text-xs">
                  Sección
                </span>
                <span>{blockTitle}</span>
              </h2>
              <ul className="space-y-6">
                {blockAnswers.map((ans) => (
                  <li key={ans.id} className="bg-background rounded-xl p-4">
                    <p className="font-semibold">{ans.question_label}</p>
                    <div className="text-foreground/80">
                      {renderValue(ans.value, ans.question_type)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {Object.keys(groupedAnswers).length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No se respondió ninguna pregunta en este envío.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
