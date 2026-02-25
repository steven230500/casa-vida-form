import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit, ToggleLeft, ToggleRight, Calendar } from "lucide-react";

export default async function AdminFormsPage() {
  const supabase = await createClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formularios</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestiona y crea nuevos formularios dinámicos
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Formulario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms?.map((form) => (
          <div
            key={form.id}
            className="group relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    form.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {form.is_active ? "Activo" : "Inactivo"}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(form.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link
                  href={`/admin/forms/${form.id}`}
                  className="focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {form.title}
                </Link>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {form.description || "Sin descripción"}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
              <Edit className="w-4 h-4 mr-2" />
              Editar Formulario
            </div>
          </div>
        ))}

        {forms?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
            <p>No hay formularios creados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
