"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, Pencil, X } from "lucide-react";
import { updateForm } from "@/app/admin/actions";

export default function ShareLinkCard({
  formId,
  formTitle,
  formDescription,
  formIsActive,
  slug,
  onSlugChange,
}: {
  formId: string;
  formTitle: string;
  formDescription: string | null;
  formIsActive: boolean;
  slug: string | null;
  onSlugChange: (slug: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [slugInput, setSlugInput] = useState(slug || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = slug && origin ? `${origin}/f/${slug}` : "";

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 1 }).catch(
      (err) => console.error("Error generating QR code:", err),
    );
  }, [url]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can still select the link manually
    }
  }

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function openEdit() {
    setSlugInput(slug || "");
    setError(null);
    setEditing(true);
  }

  async function saveSlug() {
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", formTitle);
    formData.append("description", formDescription || "");
    formData.append("is_active", String(formIsActive));
    formData.append("slug", slugInput);
    const result = await updateForm(formId, formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    if (result.data?.slug) onSlugChange(result.data.slug);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Enlace para compartir
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Úsalo en un código QR impreso o escríbelo en una tarjeta NFC.
      </p>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <canvas
          ref={canvasRef}
          className="rounded-md border border-gray-200 dark:border-zinc-700"
        />

        <div className="flex flex-1 flex-col gap-3">
          {editing ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-400">
                  /f/
                </span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="block w-full rounded-r-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 sm:text-sm p-2 font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveSlug}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <code className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                {url || "…"}
              </code>
              <button
                type="button"
                onClick={openEdit}
                aria-label="Editar enlace"
                className="shrink-0 text-gray-400 hover:text-blue-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar enlace
                </>
              )}
            </button>
            <button
              type="button"
              onClick={downloadQr}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-800"
            >
              <Download className="w-4 h-4" /> Descargar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
