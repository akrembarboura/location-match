import { describe, it, expect } from "vitest";
import { authService } from "@/server/services/AuthService";
import { userRepository } from "@/server/repositories/UserRepository";
import { mapUserToPrivateDTO } from "@/server/dtos/user";

describe("Password Security Tests", () => {
  it("B1 & B2: Registration hashes the password", async () => {
    const user = await authService.register({
      email: "hash@example.com",
      password: "securepassword",
      role: "CUSTOMER",
    });
    
    const dbUser = await userRepository.findByEmail("hash@example.com");
    expect(dbUser).toBeDefined();
    expect(dbUser!.passwordHash).not.toBe("securepassword");
    expect(dbUser!.passwordHash.length).toBeGreaterThan(20);
  });

  it("B3: Correct password authenticates", async () => {
    await authService.register({
      email: "login@example.com",
      password: "securepassword",
      role: "CUSTOMER",
    });
    
    const user = await authService.login({
      email: "login@example.com",
      password: "securepassword",
    });
    expect(user).toBeDefined();
    expect(user.email).toBe("login@example.com");
  });

  it("B4: Incorrect password fails", async () => {
    await expect(authService.login({
      email: "login@example.com",
      password: "wrongpassword",
    })).rejects.toThrow("Invalid email or password");
  });

  it("B5: Password is never returned in user DTO", async () => {
    await authService.register({
      email: "dto@example.com",
      password: "securepassword",
      role: "CUSTOMER",
    });
    const dbUser = await userRepository.findByEmail("dto@example.com");
    const dto = mapUserToPrivateDTO(dbUser);
    expect(dto).not.toHaveProperty("password");
    expect(dto).not.toHaveProperty("passwordHash");
  });
});
