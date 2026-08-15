import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { isRateLimited, requestIp } from "@/lib/rate-limit";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  buildUploadPath,
} from "@/lib/uploads";

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (isRateLimited(ip, { max: 20, windowMs: 60 * 1000 })) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Intenta de nuevo en un momento." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const draftId = formData.get("draft_id");

  if (!(file instanceof File) || typeof draftId !== "string" || !draftId) {
    return NextResponse.json(
      { error: "Falta el archivo o draft_id" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa imagen o PDF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 8MB." },
      { status: 400 },
    );
  }

  const { relativePath, dir, absolutePath } = buildUploadPath(
    draftId,
    file.name,
  );

  try {
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, bytes);
  } catch (error) {
    console.error("Error saving upload:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el archivo" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    path: `/api/uploads/${relativePath}`,
    filename: file.name,
    size: file.size,
    mimetype: file.type,
  });
}
