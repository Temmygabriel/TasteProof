interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const windows = new Map<string, RateLimitEntry>();

function clientIdentity(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return firstForwarded || realIp || "unknown";
}

/**
 * Best-effort per-process fixed-window limiter.
 * Serverless instances do not share memory, so this is not a distributed quota service.
 */
export function rateLimit(
  request: Request,
  scope: string,
  maxRequests: number,
  windowMs: number
): RateLimitDecision {
  const now = Date.now();
  const key = scope + ":" + clientIdentity(request);
  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }
  entry.count += 1;

  if (windows.size > 2000) {
    for (const [storedKey, storedValue] of windows) {
      if (storedValue.resetAt <= now) windows.delete(storedKey);
      if (windows.size <= 1500) break;
    }
  }

  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
  };
}
