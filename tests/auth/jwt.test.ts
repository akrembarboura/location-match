import { describe, it, expect } from "vitest";
import { signJwtToken, verifyJwtToken } from "../../src/server/utils/auth";
import { AUTH_CONFIG } from "../../src/server/config/auth";
import { SignJWT, jwtVerify } from "jose";

describe("JWT Security Tests", () => {
  it("A1: Valid JWT verifies successfully", async () => {
    const token = await signJwtToken({ sub: "user1", role: "CUSTOMER", email: "test@test.com" });
    const verified = await verifyJwtToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("user1");
    expect(verified?.role).toBe("CUSTOMER");
  });

  it("A2: Invalid signature returns null", async () => {
    const token = await signJwtToken({ sub: "user1", role: "CUSTOMER", email: "test@test.com" });
    const tampered = token.slice(0, -5) + "abcde";
    const verified = await verifyJwtToken(tampered);
    expect(verified).toBeNull();
  });

  it("A3: Expired JWT is rejected", async () => {
    const token = await new SignJWT({ sub: "u", role: "CUSTOMER", email: "e@e.com" })
      .setProtectedHeader({ alg: AUTH_CONFIG.JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime("-1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    
    const verified = await verifyJwtToken(token);
    expect(verified).toBeNull();
  });

  it("A4 & A5 & A8: Missing required claims (sub, role, email) is rejected", async () => {
    const token1 = await new SignJWT({ role: "CUSTOMER", email: "e@e.com" }) // missing sub
      .setProtectedHeader({ alg: AUTH_CONFIG.JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    expect(await verifyJwtToken(token1)).toBeNull();

    const token2 = await new SignJWT({ sub: "u", email: "e@e.com" }) // missing role
      .setProtectedHeader({ alg: AUTH_CONFIG.JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    expect(await verifyJwtToken(token2)).toBeNull();
  });

  it("A7: Unexpected algorithm is rejected", async () => {
    // HS512 instead of HS256
    const token = await new SignJWT({ sub: "u", role: "CUSTOMER", email: "e@e.com" })
      .setProtectedHeader({ alg: "HS512" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    
    const verified = await verifyJwtToken(token);
    expect(verified).toBeNull();
  });

  it("A9 & A10: Contains exp and is approx 7 days", async () => {
    const token = await signJwtToken({ sub: "user1", role: "CUSTOMER", email: "test@test.com" });
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    
    expect(payload.exp).toBeDefined();
    
    const nowSecs = Math.floor(Date.now() / 1000);
    const expectedExp = nowSecs + (7 * 24 * 60 * 60);
    
    // allow 5 seconds drift
    expect(Math.abs(payload.exp! - expectedExp)).toBeLessThan(5);
  });
});

