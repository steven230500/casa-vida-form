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
  formRequireRespondentName,
  slug,
  onSlugChange,
}: {
  formId: string;
  formTitle: string;
  formDescription: string | null;
  formIsActive: boolean;
  formRequireRespondentName: boolean;
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
    formData.append(
      "require_respondent_name",
      String(formRequireRespondentName),
    );
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
    <div className="rounded-t-[2.5rem] rounded-b-2xl border border-foreground/10 bg-muted p-8">
      <h2 className="text-lg font-semibold">Enlace para compartir</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Úsalo en un código QR impreso o escríbelo en una tarjeta NFC.
      </p>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <canvas
          ref={canvasRef}
          className="rounded-md border border-foreground/10"
        />

        <div className="flex flex-1 flex-col gap-3">
          {editing ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-foreground/15 bg-background px-3 text-sm text-muted-foreground">
                  /f/
                </span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="block w-full rounded-r-md border border-foreground/15 bg-background px-3 py-2 text-sm font-mono outline-none focus:border-foreground/40"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveSlug}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-4 py-1.5 text-sm font-medium hover:bg-background"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-foreground/15 bg-background px-3 py-2">
              <code className="flex-1 truncate text-sm text-foreground/80">
                {url || "…"}
              </code>
              <button
                type="button"
                onClick={openEdit}
                aria-label="Editar enlace"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-background"
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
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-background"
            >
              <Download className="w-4 h-4" /> Descargar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
