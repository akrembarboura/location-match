import { describe, it, expect } from "vitest";
import { POST as registerPost } from "../../app/api/auth/register/route";
import { POST as loginPost } from "../../app/api/auth/login/route";
import { NextRequest } from "next/server";
import { AUTH_CONFIG } from "../../src/server/config/auth";

describe("API Security Tests (Registration & Login)", () => {
  it("C1 & C5: Valid registration succeeds and forces CUSTOMER role", async () => {
    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "api@example.com",
        password: "securepassword",
        role: "SUPER_ADMIN" // Attack attempt
      })
    });
    
    const res = await registerPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.user.email).toBe("api@example.com");
    expect(data.user.role).toBe("CUSTOMER");
  });

  it("C2 & C3: Invalid email or password fails validation", async () => {
    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "invalid", password: "123" })
    });
    const res = await registerPost(req);
    expect(res.status).toBe(400); // Zod validation error
  });

  it("C4: Duplicate email is rejected", async () => {
    // Register first
    await registerPost(new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "dup@example.com", password: "securepassword" })
    }));

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "dup@example.com", password: "securepassword" })
    });
    const res = await registerPost(req);
    expect(res.status).toBe(409); // Conflict
  });

  it("D2, D3, D4: Unknown email & wrong password give same 401 error", async () => {
    // Wrong password (must be > 6 chars to pass Zod)
    const req1 = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "api@example.com", password: "wrongpassword" })
    });
    const res1 = await loginPost(req1);
    expect(res1.status).toBe(401);
    const data1 = await res1.json();
    expect(data1.error).toBe("Invalid email or password");

    // Unknown email
    const req2 = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "unknown@example.com", password: "securepassword" })
    });
    const res2 = await loginPost(req2);
    expect(res2.status).toBe(401);
    const data2 = await res2.json();
    expect(data2.error).toBe("Invalid email or password");
  });

  it("D7: JWT is not returned in JSON response on login", async () => {
    // Register first
    await registerPost(new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "login-d7@example.com", password: "securepassword" })
    }));

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "login-d7@example.com", password: "securepassword" })
    });
    const res = await loginPost(req);
    const data = await res.json();
    
    expect(data.user).toBeDefined();
    expect(data.token).toBeUndefined();
    expect(data.jwt).toBeUndefined();
  });
});
