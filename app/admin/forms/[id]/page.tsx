import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { forms, formBlocks, questions } from "@/lib/db/schema";
import FormEditorClient from "./FormEditorClient";

export const dynamic = "force-dynamic";

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const db = getDb();

  let form = null;
  let blocks: (typeof formBlocks.$inferSelect)[] = [];
  let formQuestions: (typeof questions.$inferSelect)[] = [];

  if (!isNew) {
    const [formData] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);

    if (!formData) {
      return notFound();
    }
    form = formData;

    [blocks, formQuestions] = await Promise.all([
      db
        .select()
        .from(formBlocks)
        .where(eq(formBlocks.form_id, id))
        .orderBy(asc(formBlocks.order)),
      db
        .select()
        .from(questions)
        .where(eq(questions.form_id, id))
        .orderBy(asc(questions.order)),
    ]);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? "Crear Nuevo Formulario" : "Editar Formulario"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Diseña las secciones, preguntas y reglas de este formulario dinámico.
        </p>
      </div>

      <FormEditorClient
        initialForm={form}
        initialBlocks={blocks}
        initialQuestions={formQuestions}
        isNew={isNew}
      />
    </div>
  );
}
