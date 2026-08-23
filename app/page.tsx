import { FormWizard } from "@/components/form/form-wizard";
import { getActiveForm } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default async function Page() {
  const form = await getActiveForm();

  if (!form) {
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

  return (
    <FormWizard
      formId={form.form_id}
      formTitle={form.title}
      formDescription={form.description ?? ""}
      requireRespondentName={form.requireRespondentName}
      blocks={form.blocks}
    />
  );
}
