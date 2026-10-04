import { describe, it, expect } from "vitest";
import { generateRateLimitKey, generateUserRateLimitKey } from "@/server/rate-limit/key";

describe("Rate Limit Key Generation", () => {
  it("generates correct key for unauthenticated requests", () => {
    const key = generateRateLimitKey("PUBLIC_API", "192.168.1.1");
    expect(key).toBe("rate-limit:PUBLIC_API:192.168.1.1");
  });

  it("normalizes email addresses", () => {
    const key1 = generateRateLimitKey("AUTH_LOGIN", "127.0.0.1", "User@Example.com");
    const key2 = generateRateLimitKey("AUTH_LOGIN", "127.0.0.1", "user@example.com");
    expect(key1).toBe(key2);
    expect(key1).toBe("rate-limit:AUTH_LOGIN:127.0.0.1:user@example.com");
  });

  it("generates correct key for authenticated users", () => {
    const key = generateUserRateLimitKey("AUTHENTICATED_API", "usr_123");
    expect(key).toBe("rate-limit:AUTHENTICATED_API:usr_123");
  });

  it("handles whitespace in identifiers", () => {
    const key = generateRateLimitKey("AUTH_LOGIN", "127.0.0.1", "  test@test.com  ");
    expect(key).toBe("rate-limit:AUTH_LOGIN:127.0.0.1:test@test.com");
  });
});
