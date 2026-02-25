import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import FormEditorClient from "./FormEditorClient";

export default async function FormEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const isNew = id === "new";
  const supabase = await createClient();

  let form = null;
  let blocks = [];
  let questions = [];

  if (!isNew) {
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .select("*")
      .eq("id", id)
      .single();

    if (formError || !formData) {
      return notFound();
    }
    form = formData;

    const { data: blocksData } = await supabase
      .from("form_blocks")
      .select("*")
      .eq("form_id", id)
      .order("order", { ascending: true });

    blocks = blocksData || [];

    const { data: questionsData } = await supabase
      .from("questions")
      .select("*")
      .eq("form_id", id)
      .order("order", { ascending: true });

    questions = questionsData || [];
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
        initialQuestions={questions}
        isNew={isNew}
      />
    </div>
  );
}
