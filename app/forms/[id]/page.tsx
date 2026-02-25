import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormComponent from "./FormComponent";

// Next.js config for caching limits or revalidation if you wish,
// though we usually keep this dynamic if forms change frequently:
export const revalidate = 60; // Cache for 60 seconds

export default async function FormPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  // UUID validation check
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch the joined data from our specific VIEW
  // Since we use the View, it already filters by is_active = true and current dates.
  // If it's not active, it will naturally return 0 rows.
  const { data: form, error } = await supabase
    .from("public_forms_questions")
    .select("*")
    .eq("form_id", id)
    .single();

  if (error || !form) {
    if (error && error.code !== "PGRST116") {
      // Ignore "Row not found" error code
      console.error("Error fetching form view:", error);
    }
    // Return a friendly "Form inaccessible" page instead of a hard 404
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
      <FormComponent form={form} />
    </main>
  );
}
