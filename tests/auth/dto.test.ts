import { describe, it, expect } from "vitest";
import { mapUserToPrivateDTO, mapUserToPublicDTO } from "@/server/dtos/user";

describe("DTO Security Tests", () => {
  const rawDocument = {
    id: "123",
    _id: "mongodb-internal-123",
    email: "test@example.com",
    passwordHash: "super-secret-hash",
    role: "CUSTOMER",
    firstName: "John",
    lastName: "Doe",
    phone: "555-5555",
    avatar: "http://image.png",
    __v: 0,
    resetToken: "abc",
  };

  it("I1 & I3 & K6 & K7: Private DTO strips sensitive internals", () => {
    const dto = mapUserToPrivateDTO(rawDocument);
    expect(dto.id).toBe("123");
    expect(dto.email).toBe("test@example.com");
    expect(dto.role).toBe("CUSTOMER");
    expect(dto.firstName).toBe("John");
    
    expect(dto).not.toHaveProperty("passwordHash");
    expect(dto).not.toHaveProperty("_id");
    expect(dto).not.toHaveProperty("__v");
    expect(dto).not.toHaveProperty("resetToken");
  });

  it("I2 & I3 & K6 & K7: Public DTO strips private data", () => {
    const dto = mapUserToPublicDTO(rawDocument);
    expect(dto.id).toBe("123");
    expect(dto.firstName).toBe("John");
    expect(dto.avatar).toBe("http://image.png");
    
    expect(dto).not.toHaveProperty("email");
    expect(dto).not.toHaveProperty("phone");
    expect(dto).not.toHaveProperty("role");
    expect(dto).not.toHaveProperty("passwordHash");
  });
});

