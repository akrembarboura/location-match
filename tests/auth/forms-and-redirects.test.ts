import { describe, it, expect } from "vitest";
import {
  getSafeCallbackUrl,
  getDefaultRouteForRole,
  getPostAuthRedirect,
  withCallbackUrl,
} from "../../src/lib/auth/redirect";
import {
  LoginFormSchema,
  RegisterFormSchema,
  firstFieldErrors,
} from "../../src/lib/auth/form-schemas";
import { AuthApiError } from "../../src/lib/auth/api";

describe("Auth Redirect Utilities (Open-Redirect Prevention)", () => {
  it("accepts valid relative callback paths", () => {
    expect(getSafeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(getSafeCallbackUrl("/admin/requests?status=PENDING")).toBe(
      "/admin/requests?status=PENDING"
    );
    expect(getSafeCallbackUrl("/properties/s2-corniche-mahdia")).toBe(
      "/properties/s2-corniche-mahdia"
    );
  });

  it("rejects malicious or protocol-relative URLs", () => {
    expect(getSafeCallbackUrl("https://evil.com")).toBeNull();
    expect(getSafeCallbackUrl("http://evil.com/hack")).toBeNull();
    expect(getSafeCallbackUrl("//evil.com")).toBeNull();
    expect(getSafeCallbackUrl("/\\evil.com")).toBeNull();
    expect(getSafeCallbackUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeCallbackUrl(null)).toBeNull();
    expect(getSafeCallbackUrl(undefined)).toBeNull();
    expect(getSafeCallbackUrl("")).toBeNull();
  });

  it("prevents redirect loops back to auth pages", () => {
    expect(getSafeCallbackUrl("/login")).toBeNull();
    expect(getSafeCallbackUrl("/register")).toBeNull();
    expect(getSafeCallbackUrl("/login?callbackUrl=/dashboard")).toBeNull();
    expect(getSafeCallbackUrl("/register?ref=home")).toBeNull();
  });

  it("resolves default role landings", () => {
    expect(getDefaultRouteForRole("ADMIN")).toBe("/admin");
    expect(getDefaultRouteForRole("SUPER_ADMIN")).toBe("/admin");
    expect(getDefaultRouteForRole("OWNER")).toBe("/owner");
    expect(getDefaultRouteForRole("CUSTOMER")).toBe("/dashboard");
    expect(getDefaultRouteForRole(undefined)).toBe("/dashboard");
  });

  it("prioritizes safe callbackUrl over role default", () => {
    expect(getPostAuthRedirect("CUSTOMER", "/houses/villa-hiboun")).toBe(
      "/houses/villa-hiboun"
    );
    expect(getPostAuthRedirect("CUSTOMER", "https://malicious.com")).toBe(
      "/dashboard"
    );
    expect(getPostAuthRedirect("ADMIN", null)).toBe("/admin");
  });

  it("builds query strings properly with withCallbackUrl", () => {
    expect(withCallbackUrl("/login", "/dashboard")).toBe(
      "/login?callbackUrl=%2Fdashboard"
    );
    expect(withCallbackUrl("/register", "https://evil.com")).toBe("/register");
  });
});

describe("Client Form Validation Schemas", () => {
  it("validates login inputs with normalization", () => {
    const valid = LoginFormSchema.safeParse({
      email: " User@Domain.TN ",
      password: "secretpassword",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe("user@domain.tn");
    }

    const invalidEmail = LoginFormSchema.safeParse({
      email: "not-an-email",
      password: "secretpassword",
    });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = LoginFormSchema.safeParse({
      email: "user@domain.tn",
      password: "123",
    });
    expect(shortPassword.success).toBe(false);
  });

  it("validates registration inputs and matches password confirmation", () => {
    const valid = RegisterFormSchema.safeParse({
      firstName: "Ali",
      lastName: "Ben Salah",
      email: "ali@example.tn",
      phone: "22 123 456",
      password: "secretpassword",
      confirmPassword: "secretpassword",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.phone).toBe("+21622123456");
    }

    const mismatched = RegisterFormSchema.safeParse({
      firstName: "Ali",
      lastName: "Ben Salah",
      email: "ali@example.tn",
      phone: "22 123 456",
      password: "secretpassword",
      confirmPassword: "differentpassword",
    });
    expect(mismatched.success).toBe(false);
    if (!mismatched.success) {
      const errors = firstFieldErrors(mismatched.error);
      expect(errors.confirmPassword).toBe(
        "Les mots de passe ne correspondent pas."
      );
    }
  });

  it("rejects invalid Tunisian phone numbers in registration", () => {
    const invalidPhone = RegisterFormSchema.safeParse({
      firstName: "Ali",
      lastName: "Ben Salah",
      email: "ali@example.tn",
      phone: "12345678", // invalid prefix in Tunisia
      password: "secretpassword",
      confirmPassword: "secretpassword",
    });
    expect(invalidPhone.success).toBe(false);
    if (!invalidPhone.success) {
      const errors = firstFieldErrors(invalidPhone.error);
      expect(errors.phone).toContain("Numéro de téléphone invalide");
    }
  });
});

describe("AuthApiError Class", () => {
  it("formats user-facing errors properly", () => {
    const err = new AuthApiError(
      "INVALID_CREDENTIALS",
      "Email ou mot de passe incorrect.",
      401
    );
    expect(err.code).toBe("INVALID_CREDENTIALS");
    expect(err.status).toBe(401);
    expect(err.message).toBe("Email ou mot de passe incorrect.");
  });

  it("preserves field-level validation errors", () => {
    const err = new AuthApiError(
      "VALIDATION",
      "Veuillez vérifier les informations saisies.",
      400,
      { email: "Adresse e-mail invalide." }
    );
    expect(err.fieldErrors.email).toBe("Adresse e-mail invalide.");
  });
});
