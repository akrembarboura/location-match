import { describe, it, expect } from "vitest";
import { authService } from "@/server/services/AuthService";
import { userRepository } from "@/server/repositories/UserRepository";
import { mapUserToPrivateDTO } from "@/server/dtos/user";

describe("Password Security Tests", () => {
  it("B1 & B2: Registration hashes the password", async () => {
    const email = `hash_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const user = await authService.register({
      email,
      password: "securepassword",
      role: "CUSTOMER",
    });
    
    const dbUser = await userRepository.findByEmail(email);
    expect(dbUser).toBeDefined();
    expect(dbUser!.passwordHash).not.toBe("securepassword");
    expect(dbUser!.passwordHash.length).toBeGreaterThan(20);
  });

  it("B3: Correct password authenticates", async () => {
    const email = `login_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    await authService.register({
      email,
      password: "securepassword",
      role: "CUSTOMER",
    });
    
    const user = await authService.login({
      email,
      password: "securepassword",
    });
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
  });

  it("B4: Incorrect password fails", async () => {
    const email = `wrong_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    await authService.register({
      email,
      password: "securepassword",
      role: "CUSTOMER",
    });

    await expect(authService.login({
      email,
      password: "wrongpassword",
    })).rejects.toThrow();
  });

  it("B5: Password is never returned in user DTO", async () => {
    const email = `dto_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    await authService.register({
      email,
      password: "securepassword",
      role: "CUSTOMER",
    });
    const dbUser = await userRepository.findByEmail(email);
    const dto = mapUserToPrivateDTO(dbUser);
    expect(dto).not.toHaveProperty("password");
    expect(dto).not.toHaveProperty("passwordHash");
  });
});
