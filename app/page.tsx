import { FormWizard } from "@/components/form/form-wizard";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  // Find the currently active form using our public view
  // The 'blocks' column contains the nested JSON structure of blocks and their questions
  const { data: form } = await supabase
    .from("public_forms_questions")
    .select("form_id, title, description, blocks")
    .limit(1)
    .maybeSingle();

  if (!form?.form_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center p-8 rounded-2xl shadow-sm border border-border">
          <div className="text-4xl mb-4">🗓️</div>
          <h1 className="text-2xl font-bold mb-2">
            No hay formularios activos
          </h1>
          <p className="text-muted-foreground">
            Actualmente no tenemos ningún formulario habilitado para responder.
            Por favor vuelve más tarde.
          </p>
        </div>
      </div>
    );
  }

  // Pass the raw blocks array directly to the wizard to drive dynamic rendering
  return (
    <FormWizard
      formId={form.form_id}
      formTitle={form.title}
      formDescription={form.description}
      blocks={form.blocks || []}
    />
  );
}
