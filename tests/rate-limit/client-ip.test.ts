import { describe, it, expect } from "vitest";
import { getClientIp } from "../../src/server/utils/client-ip";
import { NextRequest } from "next/server";

describe("Client IP Extraction", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new NextRequest("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("extracts IP from x-real-ip header", () => {
    const req = new NextRequest("http://localhost", {
      headers: { "x-real-ip": "10.0.0.5" },
    });
    expect(getClientIp(req)).toBe("10.0.0.5");
  });


  it("falls back to localhost if no headers or ip property", () => {
    const req = new NextRequest("http://localhost");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
