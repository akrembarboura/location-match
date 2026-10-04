import { MemoryStore } from "./store";
import { MongoStore } from "./mongo-store";
import type { RateLimitPolicy, RateLimitResult, RateLimitStore } from "./types";
import { NextResponse } from "next/server";

// Use MongoStore in production/dev, MemoryStore only if specified or for tests
// In Vitest, we might want to use MemoryStore or let it use MongoDB Memory Server
let store: RateLimitStore;

if (process.env.NODE_ENV === "test") {
  store = new MemoryStore();
} else {
  store = new MongoStore();
}

export async function rateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const { limit, windowMs } = policy;
  
  try {
    const { count, reset } = await store.increment(key, windowMs);
    const success = count <= limit;
    return {
      success,
      limit,
      remaining: Math.max(0, limit - count),
      reset,
    };
  } catch {
    // Fail-closed for sensitive endpoints in production/test, Fail-open in development
    const isSensitive = policy.name.startsWith("AUTH_") || policy.name === "ADMIN_API";
    const failClosed = isSensitive && process.env.NODE_ENV !== "development";
    const logMessage = failClosed
      ? "Rate limit store unavailable; blocking request:"
      : "Rate limit store unavailable; allowing request:";
    console.warn(logMessage, policy.name);
    return {
      success: !failClosed,
      limit,
      remaining: 0,
      reset: Date.now() + windowMs,
    };
  }
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
    { 
      status: 429, 
      headers: {
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      }
    }
  );
}

// Ensure tests can overwrite the store if they want
export function _setStoreForTesting(newStore: RateLimitStore) {
  store = newStore;
}
