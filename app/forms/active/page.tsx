import { redirect } from "next/navigation";
import { getActiveForm } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default async function ActiveFormRedirect() {
  const form = await getActiveForm();

  if (form?.form_id) {
    redirect(`/forms/${form.form_id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="text-4xl mb-4">🗓️</div>
        <h1 className="text-2xl font-bold mb-2">No hay formularios activos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Actualmente no tenemos ningún formulario habilitado para responder.
          Por favor vuelve más tarde.
        </p>
      </div>
    </div>
  );
}
