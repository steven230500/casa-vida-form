"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download } from "lucide-react";

export default function ShareLinkCard({ slug }: { slug: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

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

  if (!slug) {
    return (
      <div className="bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Enlace para compartir
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Guarda el formulario para generar su enlace corto y código QR.
        </p>
      </div>
    );
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
          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <code className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
              {url || "…"}
            </code>
          </div>
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
