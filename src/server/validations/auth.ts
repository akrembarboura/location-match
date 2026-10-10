import { z } from "zod";
import { ROLE_ENUM } from "@/lib/roles";
import { normalizeTunisianPhone } from "@/lib/rentals/request-schema";

/**
 * Auth validation — single source of truth.
 *
 * Used by the API routes (authoritative) AND by the login/register forms for
 * immediate client-side feedback. This module must stay free of server-only
 * imports (mongoose, next/headers…) so it can be bundled for the browser.
 */

export const PASSWORD_MIN_LENGTH = 6;

// Emails are trimmed and lower-cased so "Ali@Mail.com" and "ali@mail.com"
// cannot become two different accounts.
const emailField = z
  .string({ required_error: "L'adresse e-mail est obligatoire." })
  .trim()
  .toLowerCase()
  .min(1, "L'adresse e-mail est obligatoire.")
  .email("Adresse e-mail invalide.");

const passwordField = z
  .string({ required_error: "Le mot de passe est obligatoire." })
  .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);

const nameField = z.string().trim().max(60, "Ce champ est trop long (60 caractères maximum).");

// Optional Tunisian phone, reusing the normalizer of the rental-request domain
// so the whole app stores numbers in the same "+216XXXXXXXX" format.
const optionalPhoneField = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const normalized = normalizeTunisianPhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Numéro de téléphone invalide. Exemple : 22 123 456 ou +216 22 123 456.",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const LoginSchema = z.object({
  email: emailField,
  password: passwordField,
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: nameField.optional(),
  lastName: nameField.optional(),
  phone: optionalPhoneField,
  role: z
    .preprocess((val) => (val === "OWNER" ? "OWNER" : "CUSTOMER"), z.enum(["CUSTOMER", "OWNER"]))
    .default("CUSTOMER"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Le jeton de réinitialisation est requis."),
  password: passwordField,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const VerifyOTPSchema = z.object({
  email: emailField,
  otp: z.string().trim().length(6, "Le code OTP doit contenir exactement 6 chiffres."),
});
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;

export const ResendOTPSchema = z.object({
  email: emailField,
});
export type ResendOTPInput = z.infer<typeof ResendOTPSchema>;
