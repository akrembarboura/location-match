import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit, _setStoreForTesting, rateLimitResponse } from "@/server/rate-limit";
import { MemoryStore } from "@/server/rate-limit/store";
import { POLICIES } from "@/server/rate-limit/policies";

describe("Rate Limiter Core", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    _setStoreForTesting(store);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests below the limit", async () => {
    const result = await rateLimit("key1", { name: "TEST", limit: 2, windowMs: 1000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("blocks requests exceeding the limit", async () => {
    await rateLimit("key1", { name: "TEST", limit: 2, windowMs: 1000 });
    await rateLimit("key1", { name: "TEST", limit: 2, windowMs: 1000 });
    const result = await rateLimit("key1", { name: "TEST", limit: 2, windowMs: 1000 });
    
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets counter after window expires", async () => {
    await rateLimit("key1", { name: "TEST", limit: 1, windowMs: 1000 });
    
    let result = await rateLimit("key1", { name: "TEST", limit: 1, windowMs: 1000 });
    expect(result.success).toBe(false);

    vi.advanceTimersByTime(1001);
    
    result = await rateLimit("key1", { name: "TEST", limit: 1, windowMs: 1000 });
    expect(result.success).toBe(true);
  });

  it("keeps different keys independent", async () => {
    await rateLimit("key1", { name: "TEST", limit: 1, windowMs: 1000 });
    
    const result = await rateLimit("key2", { name: "TEST", limit: 1, windowMs: 1000 });
    expect(result.success).toBe(true);
  });

  it("fails closed for auth policies on store failure", async () => {
    _setStoreForTesting({
      increment: () => Promise.reject(new Error("Store down")),
    });

    const result = await rateLimit("key1", { name: "AUTH_LOGIN", limit: 10, windowMs: 1000 });
    expect(result.success).toBe(false);
  });

  it("uses a dedicated upload limit and fails closed when its store is unavailable", async () => {
    expect(POLICIES.OWNER_UPLOAD).toMatchObject({
      name: "OWNER_UPLOAD",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    _setStoreForTesting({
      increment: () => Promise.reject(new Error("Store down")),
    });

    const result = await rateLimit(
      "rate-limit:OWNER_UPLOAD:user-1",
      POLICIES.OWNER_UPLOAD
    );
    expect(result.success).toBe(false);
  });

  it("fails open for public policies on store failure", async () => {
    _setStoreForTesting({
      increment: () => Promise.reject(new Error("Store down")),
    });

    const result = await rateLimit("key1", { name: "SEARCH", limit: 10, windowMs: 1000 });
    expect(result.success).toBe(true);
  });

  it("formats 429 response correctly", () => {
    const result = rateLimitResponse({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 5000,
    });
    
    expect(result.status).toBe(429);
    expect(result.headers.get("Retry-After")).toBe("5");
    expect(result.headers.get("X-RateLimit-Limit")).toBe("10");
  });
});
