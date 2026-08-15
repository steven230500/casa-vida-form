import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOADS_ROOT, isSafeSegment } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (segments.length !== 2 || !segments.every(isSafeSegment)) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const absolutePath = path.join(UPLOADS_ROOT, ...segments);
  const ext = path.extname(absolutePath).toLowerCase();

  try {
    const data = await readFile(absolutePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
