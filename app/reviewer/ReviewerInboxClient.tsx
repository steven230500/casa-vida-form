"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Search } from "lucide-react";

type Row = {
  id: string;
  form_id: string;
  anonymous: boolean;
  respondent_name: string | null;
  respondent_email: string | null;
  need_1on1: boolean;
  status: string;
  created_at: string;
  form_title: string | null;
};

const statusLabels: Record<string, string> = {
  new: "Nuevo",
  reviewed: "Revisado",
  followup_pending: "Necesita seguimiento",
  closed: "Cerrado",
};

function getStatusBadge(status: string) {
  const label = statusLabels[status];
  if (!label) return null;
  return (
    <span
      className={`px-2.5 py-0.5 text-[11px] rounded-full font-medium uppercase tracking-wide ${
        status === "new"
          ? "bg-beige text-beige-foreground"
          : "bg-background text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

export default function ReviewerInboxClient({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const total = rows.length;
  const newCount = rows.filter((r) => r.status === "new").length;
  const needs1on1Count = rows.filter((r) => r.need_1on1).length;
  const pendingFollowups = rows.filter(
    (r) => r.status === "followup_pending",
  ).length;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${r.respondent_name || ""} ${r.respondent_email || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, statusFilter]);

  const groupedResponses = useMemo(() => {
    const groups: Record<string, { form_id: string; rows: Row[] }> = {};
    filteredRows.forEach((res) => {
      const formTitle = res.form_title || "Formulario sin título";
      if (!groups[formTitle]) {
        groups[formTitle] = { form_id: res.form_id, rows: [] };
      }
      groups[formTitle].rows.push(res);
    });
    return groups;
  }, [filteredRows]);

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Respuestas totales
          </div>
          <div className="text-3xl font-semibold">{total}</div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Nuevas
          </div>
          <div className="text-3xl font-semibold">{newCount}</div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Necesitan seguimiento
          </div>
          <div className="text-3xl font-semibold">{pendingFollowups}</div>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-muted p-6">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Pidieron 1 a 1
          </div>
          <div className="text-3xl font-semibold">{needs1on1Count}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full rounded-md border border-foreground/15 bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-foreground/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped Responses */}
      <div className="space-y-6">
        {Object.keys(groupedResponses).length === 0 ? (
          <div className="rounded-2xl border border-foreground/10 bg-muted p-8 text-center text-muted-foreground">
            {rows.length === 0
              ? "No hay respuestas todavía."
              : "Ninguna respuesta coincide con la búsqueda."}
          </div>
        ) : (
          Object.entries(groupedResponses).map(
            ([formTitle, { form_id, rows: formResponses }]) => (
              <div
                key={formTitle}
                className="rounded-2xl border border-foreground/10 bg-muted overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-foreground/10 flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>{formTitle}</span>
                    <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                      {formResponses.length}
                    </span>
                  </h2>
                  <a
                    href={`/api/reviewer/export?form_id=${form_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar CSV
                  </a>
                </div>
                <ul className="divide-y divide-foreground/10">
                  {formResponses.map((res) => (
                    <li
                      key={res.id}
                      className="hover:bg-background/60 transition-colors"
                    >
                      <Link
                        href={`/reviewer/${res.id}`}
                        className="block px-6 py-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-beige flex items-center justify-center text-beige-foreground font-semibold shrink-0">
                              {res.anonymous
                                ? "A"
                                : (
                                    res.respondent_name?.charAt(0) || "?"
                                  ).toUpperCase()}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">
                                  {res.anonymous
                                    ? "Usuario anónimo"
                                    : res.respondent_name || "Sin nombre"}
                                </span>
                                {getStatusBadge(res.status)}
                                {res.need_1on1 && (
                                  <span className="px-2 py-0.5 border border-foreground/15 text-[10px] rounded-full uppercase tracking-wider font-semibold">
                                    1 a 1
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center space-x-2">
                                <span>
                                  {format(
                                    new Date(res.created_at),
                                    "d MMM yyyy, h:mm a",
                                    { locale: es },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-muted-foreground">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
