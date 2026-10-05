import { describe, it, expect, vi } from "vitest";
import { middleware } from "../../middleware";
import { NextRequest, NextResponse } from "next/server";
import { signJwtToken } from "@/server/utils/auth";
import { AUTH_CONFIG } from "../../src/server/config/auth";
import { SignJWT } from "jose";

describe("Middleware Tests", () => {
  const createReq = (path: string, token?: string) => {
    const req = new NextRequest(`http://localhost${path}`);
    if (token) {
      req.cookies.set(AUTH_CONFIG.SESSION_COOKIE_NAME, token);
    }
    return req;
  };

  it("J1: Unauthenticated request to /admin is redirected", async () => {
    const req = createReq("/admin/dashboard");
    const res = await middleware(req);
    expect(res.status).toBe(307); // NextResponse.redirect defaults to 307
    expect(res.headers.get("location")).toContain("/login");
  });

  it("J2: Customer cannot enter /admin", async () => {
    const token = await signJwtToken({ sub: "u", role: "CUSTOMER", email: "e@e.com" });
    const req = createReq("/admin", token);
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("J3: Customer can access /owner landing for onboarding", async () => {
    const token = await signJwtToken({ sub: "u", role: "CUSTOMER", email: "e@e.com" });
    const req = createReq("/owner", token);
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("J3b: Customer accessing protected owner subroute is redirected to /owner", async () => {
    const token = await signJwtToken({ sub: "u", role: "CUSTOMER", email: "e@e.com" });
    const req = createReq("/owner/reservations", token);
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/owner");
  });

  it("J4: Owner cannot enter /admin", async () => {
    const token = await signJwtToken({ sub: "u", role: "OWNER", email: "e@e.com" });
    const req = createReq("/admin", token);
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("J5: Authorized role can continue", async () => {
    const token = await signJwtToken({ sub: "u", role: "ADMIN", email: "e@e.com" });
    const req = createReq("/admin", token);
    const res = await middleware(req);
    // NextResponse.next() returns a response without a location redirect
    expect(res.headers.get("location")).toBeNull();
  });

  it("J6 & J7: Malformed or Expired JWT redirects to login", async () => {
    const req1 = createReq("/admin", "malformed_token_string");
    const res1 = await middleware(req1);
    expect(res1.status).toBe(307);
    expect(res1.headers.get("location")).toContain("/login");
    
    // Test expired token
    const token2 = await new SignJWT({ sub: "u", role: "ADMIN", email: "e@e.com" })
      .setProtectedHeader({ alg: AUTH_CONFIG.JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime("-1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    
    const req2 = createReq("/admin", token2);
    const res2 = await middleware(req2);
    expect(res2.status).toBe(307);
    expect(res2.headers.get("location")).toContain("/login");
  });
});

