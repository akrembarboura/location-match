import { z } from "zod";
import { LoginSchema, RegisterSchema } from "@/server/validations/auth";

/**
 * Client-side form schemas, DERIVED from the backend schemas so the rules
 * (email format, password length, phone format, name length) can never drift.
 * The server remains authoritative; these only give immediate feedback.
 */

export const LoginFormSchema = LoginSchema;

export const RegisterFormSchema = RegisterSchema.omit({ role: true })
  .extend({
    // Backend accepts optional names; the public form asks for them.
    firstName: RegisterSchema.shape.firstName.unwrap().min(1, "Veuillez indiquer votre prénom."),
    lastName: RegisterSchema.shape.lastName.unwrap().min(1, "Veuillez indiquer votre nom."),
    confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe."),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas.",
      });
    }
  });

export type LoginFormValues = z.input<typeof LoginFormSchema>;
export type RegisterFormValues = z.input<typeof RegisterFormSchema>;

/** First error message per field, from a failed safeParse. */
export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
