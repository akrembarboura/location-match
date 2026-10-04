import { describe, it, expect } from "vitest";
import {
  getUserInitials,
  getUserDisplayName,
  getRoleLabel,
} from "@/lib/auth/user-helpers";

describe("User Display & Avatar Helpers", () => {
  describe("getUserInitials", () => {
    it("extracts 2 initials from two-word full names", () => {
      expect(getUserInitials("Akrem Barboura")).toBe("AB");
      expect(getUserInitials("Ahmed Ben Ali")).toBe("AA");
      expect(getUserInitials("Mohamed Salah")).toBe("MS");
    });

    it("extracts up to 2 letters from single-word names", () => {
      expect(getUserInitials("Akrem")).toBe("AK");
      expect(getUserInitials("A")).toBe("A");
    });

    it("falls back to email initial when name is empty", () => {
      expect(getUserInitials("", "akrem@example.com")).toBe("A");
      expect(getUserInitials(undefined, "user@test.tn")).toBe("U");
    });

    it("returns 'U' when both name and email are missing", () => {
      expect(getUserInitials()).toBe("U");
    });
  });

  describe("getUserDisplayName", () => {
    it("returns full name when firstName and lastName are present", () => {
      expect(
        getUserDisplayName({
          firstName: "Akrem",
          lastName: "Barboura",
          email: "akrem@test.com",
        })
      ).toBe("Akrem Barboura");
    });

    it("returns firstName only if lastName is missing", () => {
      expect(
        getUserDisplayName({
          firstName: "Akrem",
          email: "akrem@test.com",
        })
      ).toBe("Akrem");
    });

    it("falls back to email prefix if name is missing", () => {
      expect(
        getUserDisplayName({
          email: "akrem.barboura@test.com",
        })
      ).toBe("akrem.barboura");
    });
  });

  describe("getRoleLabel", () => {
    it("translates roles to friendly French marketplace labels", () => {
      expect(getRoleLabel("CUSTOMER")).toBe("Client");
      expect(getRoleLabel("OWNER")).toBe("Propriétaire");
      expect(getRoleLabel("ADMIN")).toBe("Administrateur");
      expect(getRoleLabel("SUPER_ADMIN")).toBe("Super Administrateur");
      expect(getRoleLabel(undefined)).toBe("Membre");
    });
  });
});
