import { describe, it, expect } from "vitest";
import { POST as registerPost } from "../../app/api/auth/register/route";
import { POST as loginPost } from "../../app/api/auth/login/route";
import { authService } from "../../src/server/services/AuthService";
import { userRepository } from "../../src/server/repositories/UserRepository";
import { UserModel } from "../../src/lib/models";
import connectToDatabase from "../../src/lib/mongoose";
import { NextRequest } from "next/server";

describe("LOC MAISON — Owner Lifecycle & Rejection Authentication Tests", () => {
  async function createTestOwner(emailPrefix: string) {
    await connectToDatabase();
    const email = `${emailPrefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = "secureownerpassword123";

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        firstName: "Test",
        lastName: "Owner",
        role: "OWNER",
      }),
    });

    const res = await registerPost(req);
    expect(res.status).toBe(200);

    const userDoc = await UserModel.findOne({ email }).lean().exec();
    expect(userDoc).not.toBeNull();
    const userId = userDoc!.id || userDoc!._id.toString();

    return { email, password, userId, passwordHash: userDoc!.passwordHash };
  }

  it("Test 1 — Valid owner login succeeds when status is ACTIVE", async () => {
    const owner = await createTestOwner("t1_active");

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: owner.email, password: owner.password }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe(owner.email);
    expect(data.user.role).toBe("OWNER");
  });

  it("Test 2 — Reject owner preserves user record, email, role, and passwordHash", async () => {
    const owner = await createTestOwner("t2_reject");
    const updated = await userRepository.updateStatus(owner.userId, "REJECTED");
    expect(updated).not.toBeNull();

    const userDoc = await UserModel.findOne({ email: owner.email }).lean().exec();
    expect(userDoc).not.toBeNull();
    expect(userDoc!.email).toBe(owner.email);
    expect(userDoc!.role).toBe("OWNER");
    expect(userDoc!.passwordHash).toBe(owner.passwordHash); // Password hash must NOT be modified
    expect(userDoc!.status).toBe("REJECTED");
  });

  it("Test 3 — Login after rejection returns ACCOUNT_REJECTED error, NOT INVALID_CREDENTIALS", async () => {
    const owner = await createTestOwner("t3_login_reject");
    await userRepository.updateStatus(owner.userId, "REJECTED");

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: owner.email, password: owner.password }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(403);
    const data = await res.json();

    expect(data.error.code).toBe("ACCOUNT_REJECTED");
    expect(data.error.message).toContain("compte propriétaire a été rejeté");
    expect(data.error.code).not.toBe("INVALID_CREDENTIALS");
  });

  it("Test 4 — Login with wrong password returns INVALID_CREDENTIALS", async () => {
    const owner = await createTestOwner("t4_wrongpass");
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: owner.email, password: "wrongpassword" }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(401);
    const data = await res.json();

    expect(data.code || data.error?.code || data.error).toBe("INVALID_CREDENTIALS");
  });

  it("Test 5 — Login with unknown email returns INVALID_CREDENTIALS", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "nonexistent_unknown_9999@example.com", password: "somepassword" }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(401);
    const data = await res.json();

    expect(data.code || data.error?.code || data.error).toBe("INVALID_CREDENTIALS");
  });

  it("Test 6 — Session invalidation after rejection", async () => {
    const owner = await createTestOwner("t6_session");

    // 1. Log in to get session cookie
    const loginReq = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: owner.email, password: owner.password }),
    });
    const loginRes = await loginPost(loginReq);
    expect(loginRes.status).toBe(200);

    // 2. Reject owner
    await userRepository.updateStatus(owner.userId, "REJECTED");

    // 3. Check current user via session
    const current = await authService.getCurrentUser();
    expect(current).toBeNull(); // Existing session becomes invalid!

    // 4. Verify password hash is still intact in DB
    const dbUser = await UserModel.findOne({ email: owner.email }).lean().exec();
    expect(dbUser!.passwordHash).toBe(owner.passwordHash);
  });
});
