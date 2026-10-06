import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  getClientIp: vi.fn(),
  generateRateLimitKey: vi.fn(),
  rateLimit: vi.fn(),
  rateLimitResponse: vi.fn(),
}));

vi.mock("@/server/utils/client-ip", () => ({
  getClientIp: mocks.getClientIp,
}));

vi.mock("@/server/rate-limit/key", () => ({
  generateRateLimitKey: mocks.generateRateLimitKey,
}));

vi.mock("@/server/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
  rateLimitResponse: mocks.rateLimitResponse,
}));

import { publicRateLimit } from "@/server/rate-limit/public";
import type { RateLimitPolicy } from "@/server/rate-limit/types";

describe("publicRateLimit", () => {
  const policy: RateLimitPolicy = {
    name: "PUBLIC_API",
    limit: 120,
    windowMs: 60_000,
  };

  beforeEach(() => {
    mocks.getClientIp.mockReset().mockReturnValue("192.0.2.1");
    mocks.generateRateLimitKey.mockReset().mockReturnValue("rate-limit:PUBLIC_API:192.0.2.1");
    mocks.rateLimit.mockReset().mockResolvedValue({
      success: true,
      limit: 120,
      remaining: 119,
      reset: Date.now() + 60_000,
    });
    mocks.rateLimitResponse.mockReset().mockReturnValue(
      NextResponse.json({ error: "Too many requests" }, { status: 429 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when the request is within the limit", async () => {
    const response = await publicRateLimit(
      new NextRequest("http://localhost/api/properties"),
      policy
    );

    expect(response).toBeNull();
    expect(mocks.generateRateLimitKey).toHaveBeenCalledWith(policy.name, "192.0.2.1");
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      "rate-limit:PUBLIC_API:192.0.2.1",
      policy
    );
  });

  it("returns the normal rate-limit response when the request is over limit", async () => {
    const result = {
      success: false,
      limit: 120,
      remaining: 0,
      reset: Date.now() + 60_000,
    };
    mocks.rateLimit.mockResolvedValue(result);

    const response = await publicRateLimit(
      new NextRequest("http://localhost/api/properties"),
      policy
    );

    expect(response?.status).toBe(429);
    expect(mocks.rateLimitResponse).toHaveBeenCalledWith(result);
  });

  it("allows public reads through when the limiter throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.rateLimit.mockRejectedValue(new Error("limiter storage unavailable"));

    const response = await publicRateLimit(
      new NextRequest("http://localhost/api/properties"),
      policy
    );

    expect(response).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Rate limiter unavailable for PUBLIC_API:",
      "limiter storage unavailable"
    );
  });
});
