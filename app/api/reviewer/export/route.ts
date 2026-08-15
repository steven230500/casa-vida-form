import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { forms, questions, responses, answers } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { reviewerRoles } from "@/lib/auth";

function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("filename" in obj && "path" in obj) {
      return String(obj.filename);
    }
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
  }
  return String(value);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !reviewerRoles.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("form_id");
  if (!formId) {
    return NextResponse.json({ error: "Falta form_id" }, { status: 400 });
  }

  const db = getDb();

  const [form] = await db
    .select({ title: forms.title })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1);

  if (!form) {
    return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });
  }

  const formQuestions = await db
    .select({ id: questions.id, label: questions.label })
    .from(questions)
    .where(eq(questions.form_id, formId))
    .orderBy(asc(questions.order));

  const formResponses = await db
    .select({
      id: responses.id,
      anonymous: responses.anonymous,
      respondent_name: responses.respondent_name,
      respondent_email: responses.respondent_email,
      status: responses.status,
      need_1on1: responses.need_1on1,
      created_at: responses.created_at,
    })
    .from(responses)
    .where(eq(responses.form_id, formId))
    .orderBy(asc(responses.created_at));

  const allAnswers = await db
    .select({
      response_id: answers.response_id,
      question_id: answers.question_id,
      value: answers.value,
    })
    .from(answers)
    .innerJoin(responses, eq(answers.response_id, responses.id))
    .where(eq(responses.form_id, formId));

  const answersByResponse = new Map<string, Map<string, unknown>>();
  for (const a of allAnswers) {
    if (!answersByResponse.has(a.response_id)) {
      answersByResponse.set(a.response_id, new Map());
    }
    answersByResponse.get(a.response_id)!.set(a.question_id, a.value);
  }

  const metaHeaders = [
    "Fecha",
    "Nombre",
    "Correo",
    "Anónimo",
    "Estado",
    "Necesita 1 a 1",
  ];
  const headers = [...metaHeaders, ...formQuestions.map((q) => q.label)];

  const rows = formResponses.map((r) => {
    const answerMap = answersByResponse.get(r.id) || new Map();
    const meta = [
      r.created_at.toISOString(),
      r.anonymous ? "" : r.respondent_name || "",
      r.anonymous ? "" : r.respondent_email || "",
      r.anonymous ? "Sí" : "No",
      r.status,
      r.need_1on1 ? "Sí" : "No",
    ];
    const questionValues = formQuestions.map((q) =>
      formatAnswerValue(answerMap.get(q.id)),
    );
    return [...meta, ...questionValues];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  const filename = `${form.title.replace(/[^a-zA-Z0-9]+/g, "-")}.csv`;

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
