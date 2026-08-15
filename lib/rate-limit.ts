// Simple in-memory sliding-window rate limiter, per process.
// Good enough for a single-instance deployment; resets on restart.
const buckets = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (bucket.count >= max) return true;

  bucket.count += 1;
  return false;
}

export function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}
