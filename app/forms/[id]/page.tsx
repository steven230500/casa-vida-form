import { getActiveFormById } from "@/lib/forms";
import FormComponent from "./FormComponent";

export const dynamic = "force-dynamic";

export default async function FormPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Formulario no disponible</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Este formulario ya no se encuentra activo o el enlace es incorrecto.
          </p>
        </div>
      </div>
    );
  }

  const form = await getActiveFormById(id);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Formulario no disponible</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Este formulario ya no se encuentra activo o el enlace es incorrecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black py-12">
      <FormComponent
        form={{
          formId: form.form_id,
          title: form.title,
          description: form.description ?? "",
          blocks: form.blocks,
        }}
      />
    </main>
  );
}
