import { NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  limit?: number; // max requests
  windowMs?: number; // duration window in milliseconds
}

/**
 * Memory-efficient sliding token bucket rate limiter for API routes.
 *
 * Usage in API route:
 * const rateLimitResult = checkRateLimit(req, { limit: 5, windowMs: 60000 });
 * if (rateLimitResult) return rateLimitResult;
 */
export function checkRateLimit(
  req: Request,
  options: RateLimitOptions = {}
): NextResponse | null {
  const limit = options.limit || 10;
  const windowMs = options.windowMs || 60000;

  // Extract IP or client identifier
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const path = new URL(req.url).pathname;
  const key = `${ip}:${path}`;
  const now = Date.now();

  if (!store[key]) {
    store[key] = {
      tokens: limit - 1,
      lastRefill: now,
    };
    return null;
  }

  const record = store[key];
  const elapsed = now - record.lastRefill;

  if (elapsed >= windowMs) {
    record.tokens = limit - 1;
    record.lastRefill = now;
    return null;
  }

  if (record.tokens <= 0) {
    const retryAfter = Math.ceil((windowMs - elapsed) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Trop de tentatives. Veuillez réessayer dans ${retryAfter} seconde(s).`,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  record.tokens -= 1;
  return null;
}

// Cleanup stale keys periodically to prevent memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (now - store[key].lastRefill > 300000) {
        delete store[key];
      }
    }
  }, 60000);
}

