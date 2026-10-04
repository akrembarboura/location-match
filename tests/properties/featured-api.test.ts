import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getFeaturedProperties: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/server/services/PropertyService", () => ({
  propertyService: {
    getFeaturedProperties: mocks.getFeaturedProperties,
  },
}));

vi.mock("@/server/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
  rateLimitResponse: vi.fn(),
}));

import { GET } from "@/app/api/properties/featured/route";

describe("GET /api/properties/featured", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getFeaturedProperties.mockReset();
    mocks.rateLimit.mockReset().mockResolvedValue({
      success: true,
      limit: 120,
      remaining: 119,
      reset: Date.now() + 60_000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not expose MongoDB connection details when the query fails", async () => {
    mocks.getFeaturedProperties.mockRejectedValue(
      new Error("connect ECONNREFUSED mongodb://user:secret@127.0.0.1:27017/db")
    );

    const response = await GET(
      new NextRequest("http://localhost/api/properties/featured")
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Internal Server Error" });
    expect(JSON.stringify(payload)).not.toMatch(
      /ECONNREFUSED|mongodb:\/\/|secret|127\.0\.0\.1/
    );
    expect(console.error).toHaveBeenCalledWith(
      "GET /api/properties/featured failed:",
      "Error"
    );
  });
});
