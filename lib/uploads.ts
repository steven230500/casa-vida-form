import { randomUUID } from "crypto";
import path from "path";

// Persistent volume mounted at this path in production (see docker-compose.yml).
// Falls back to a repo-local folder for local dev, gitignored.
export const UPLOADS_ROOT = process.env.UPLOADS_DIR || path.join(process.cwd(), ".uploads");

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export function buildUploadPath(draftId: string, originalFilename: string) {
  const safeName = sanitizeFilename(originalFilename);
  const dirSegment = sanitizeFilename(draftId);
  const fileSegment = `${randomUUID()}-${safeName}`;
  return {
    relativePath: `${dirSegment}/${fileSegment}`,
    dir: path.join(UPLOADS_ROOT, dirSegment),
    absolutePath: path.join(UPLOADS_ROOT, dirSegment, fileSegment),
  };
}

// Rejects any segment that isn't a plain filename component (blocks path traversal).
export function isSafeSegment(segment: string): boolean {
  return segment.length > 0 && !segment.includes("..") && !segment.includes("/") && !segment.includes("\\");
}
