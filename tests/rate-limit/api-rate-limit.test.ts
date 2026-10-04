import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";
import { _setStoreForTesting } from "@/server/rate-limit";
import { MemoryStore } from "@/server/rate-limit/store";

describe("API Integration Rate Limiting", () => {
  beforeEach(() => {
    // Reset rate limiter for each test
    _setStoreForTesting(new MemoryStore());
  });

  it("rate limits repeated login attempts", async () => {
    const payload = JSON.stringify({ email: "rl@example.com", password: "password123" });

    // Login limit is 10
    for (let i = 0; i < 10; i++) {
      const req = new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: payload,
        headers: { "x-forwarded-for": "10.0.0.1" },
      });
      const res = await loginPost(req);
      // Validations or 401s don't matter, we just care if it doesn't 429 yet
      expect(res.status).not.toBe(429);
    }

    // 11th request should be 429
    const req11 = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: payload,
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const res11 = await loginPost(req11);
    expect(res11.status).toBe(429);
    const data = await res11.json();
    expect(data.error.code).toBe("RATE_LIMITED");
  });

  it("rate limits repeated register attempts", async () => {
    // Register limit is 5
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: `rl${i}@example.com`, password: "password123" }),
        headers: { "x-forwarded-for": "10.0.0.2" },
      });
      const res = await registerPost(req);
      expect(res.status).not.toBe(429);
    }

    // 6th request should be 429
    const req6 = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "rl6@example.com", password: "password123" }),
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    const res6 = await registerPost(req6);
    expect(res6.status).toBe(429);
  });
});
