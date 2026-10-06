import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  publicRateLimit: vi.fn(),
  searchPropertiesPage: vi.fn(),
}));

vi.mock("@/server/rate-limit/public", () => ({
  publicRateLimit: mocks.publicRateLimit,
}));

vi.mock("@/server/services/PropertyService", () => ({
  propertyService: {
    searchPropertiesPage: mocks.searchPropertiesPage,
  },
}));

import { GET } from "@/app/api/properties/route";

describe("GET /api/properties", () => {
  beforeEach(() => {
    mocks.publicRateLimit.mockReset().mockResolvedValue(null);
    mocks.searchPropertiesPage.mockReset().mockResolvedValue({
      properties: [{ id: "published-1" }],
      hasMore: true,
    });
  });

  it("returns a bounded search response and cache headers", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/properties?city=Mahdia&guests=4&page=2&limit=10"
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "published-1" }]);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    expect(response.headers.get("X-Page")).toBe("2");
    expect(response.headers.get("X-Page-Size")).toBe("10");
    expect(response.headers.get("X-Has-More")).toBe("true");
    expect(mocks.searchPropertiesPage).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Mahdia", guests: 4, page: 2, limit: 10 })
    );
  });

  it("rejects invalid filters without querying properties", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/properties?guests=100")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Validation Error",
      details: { guests: expect.any(Array) },
    });
    expect(mocks.searchPropertiesPage).not.toHaveBeenCalled();
  });

  it("returns a rate-limit response before querying properties", async () => {
    mocks.publicRateLimit.mockResolvedValue(
      new Response(null, { status: 429 })
    );

    const response = await GET(
      new NextRequest("http://localhost/api/properties")
    );

    expect(response.status).toBe(429);
    expect(mocks.searchPropertiesPage).not.toHaveBeenCalled();
  });
});
