import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, Edit, Calendar } from "lucide-react";
import { getDb } from "@/lib/db";
import { forms } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminFormsPage() {
  const db = getDb();
  const formRows = await db.select().from(forms).orderBy(desc(forms.created_at));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Formularios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y crea nuevos formularios dinámicos
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" />
          Crear Formulario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formRows.map((form) => (
          <div
            key={form.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-foreground/10 bg-muted p-6 transition-colors hover:bg-muted/70"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                    form.is_active
                      ? "bg-beige text-beige-foreground"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {form.is_active ? "Activo" : "Inactivo"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(form.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1 transition-colors">
                <Link
                  href={`/admin/forms/${form.id}`}
                  className="focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {form.title}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {form.description || "Sin descripción"}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-foreground/10 flex items-center text-sm font-medium">
              <Edit className="w-4 h-4 mr-2" />
              Editar Formulario
            </div>
          </div>
        ))}

        {formRows.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted rounded-2xl border border-dashed border-foreground/15">
            <p>No hay formularios creados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
