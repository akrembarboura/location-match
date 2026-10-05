"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuthMutations } from "@/lib/auth/api";
import { RegisterFormSchema, firstFieldErrors, type RegisterFormValues } from "@/lib/auth/form-schemas";
import { PASSWORD_MIN_LENGTH } from "@/server/validations/auth";
import { withCallbackUrl } from "@/lib/auth/redirect";
import { AuthCard, AuthField, FormAlert, PasswordField, SubmitButton } from "./AuthFormParts";
import { useAuthPageRedirect } from "./useAuthPageRedirect";

type FieldName = keyof RegisterFormValues;

const EMPTY: Required<RegisterFormValues> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

// Visual order, used to focus the first invalid field.
const FIELD_ORDER: FieldName[] = ["firstName", "lastName", "email", "phone", "password", "confirmPassword"];

export function RegisterForm() {
  const { callbackUrl, isRedirecting } = useAuthPageRedirect();
  const { register } = useAuthMutations();

  const [values, setValues] = useState<Required<RegisterFormValues>>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isOwnerIntent = callbackUrl?.startsWith("/owner");
  const [accountRole, setAccountRole] = useState<"CUSTOMER" | "OWNER">(
    isOwnerIntent ? "OWNER" : "CUSTOMER"
  );

  const busy = register.isPending || isRedirecting;

  function validate(next: RegisterFormValues) {
    const result = RegisterFormSchema.safeParse(next);
    return result.success ? {} : firstFieldErrors(result.error);
  }

  function update(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (name === "email") setEmailTaken(false);
    if (submitted) setFieldErrors(validate(next));
  }

  function onBlur(name: FieldName) {
    if (!values[name]) return;
    const errors = validate(values);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errors[name],
      // Keep the confirmation in sync when the password itself changes.
      ...(name === "password" && values.confirmPassword ? { confirmPassword: errors.confirmPassword } : {}),
    }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return; // prevents duplicate submissions
    setSubmitted(true);
    setFormError(null);
    setEmailTaken(false);

    const errors = validate(values);
    setFieldErrors(errors);
    const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus();
      return;
    }

    register.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        password: values.password,
        role: accountRole,
      } as any,
      {
        onError: (error) => {
          setFormError(error.message);
          if (error.code === "VALIDATION" || error.code === "EMAIL_TAKEN") {
            setFieldErrors((prev) => ({ ...prev, ...error.fieldErrors }));
          }
          if (error.code === "EMAIL_TAKEN") {
            setEmailTaken(true);
            document.getElementById("register-email")?.focus();
          }
        },
      },
    );
  }

  const loginHref = withCallbackUrl("/login", callbackUrl);

  return (
    <AuthCard
      eyebrow={accountRole === "OWNER" ? "Espace Propriétaire" : "Nouveau compte"}
      title={accountRole === "OWNER" ? "Créer votre compte propriétaire" : "Créer un compte"}
      description={
        accountRole === "OWNER"
          ? "Créez votre compte pour publier votre logement sur LOC MAISON."
          : "Créez votre compte LOC MAISON pour gérer vos demandes et locations."
      }
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link href={loginHref} className="font-medium text-primary underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={formError ? "register-form-error" : undefined}>
        {/* Account Type Selector */}
        <div className="mb-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Vous souhaitez utiliser LOC MAISON en tant que :
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface p-1 border border-border">
            <button
              type="button"
              onClick={() => setAccountRole("CUSTOMER")}
              className={`rounded-md py-2 text-xs font-semibold transition-all ${
                accountRole === "CUSTOMER"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Locataire / Client
            </button>
            <button
              type="button"
              onClick={() => setAccountRole("OWNER")}
              className={`rounded-md py-2 text-xs font-semibold transition-all ${
                accountRole === "OWNER"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Propriétaire
            </button>
          </div>
        </div>
        {formError && (
          <div id="register-form-error">
            <FormAlert>
              {formError}
              {emailTaken && (
                <>
                  {" "}
                  <Link href={loginHref} className="font-medium underline underline-offset-4">
                    Se connecter
                  </Link>
                </>
              )}
            </FormAlert>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            id="register-firstName"
            name="firstName"
            label="Prénom"
            autoComplete="given-name"
            autoCapitalize="words"
            required
            value={values.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            onBlur={() => onBlur("firstName")}
            error={fieldErrors.firstName}
            readOnly={busy}
          />
          <AuthField
            id="register-lastName"
            name="lastName"
            label="Nom"
            autoComplete="family-name"
            autoCapitalize="words"
            required
            value={values.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            onBlur={() => onBlur("lastName")}
            error={fieldErrors.lastName}
            readOnly={busy}
          />
        </div>

        <AuthField
          id="register-email"
          name="email"
          type="email"
          label="Adresse e-mail"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="vous@exemple.com"
          required
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() => onBlur("email")}
          error={fieldErrors.email}
          readOnly={busy}
        />

        <AuthField
          id="register-phone"
          name="phone"
          type="tel"
          label="Numéro de téléphone"
          autoComplete="tel"
          inputMode="tel"
          placeholder="22 123 456"
          hint="Facultatif — utile pour vous recontacter sur WhatsApp."
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          onBlur={() => onBlur("phone")}
          error={fieldErrors.phone}
          readOnly={busy}
        />

        <PasswordField
          id="register-password"
          name="password"
          label="Mot de passe"
          autoComplete="new-password"
          required
          hint={`${PASSWORD_MIN_LENGTH} caractères minimum.`}
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          onBlur={() => onBlur("password")}
          error={fieldErrors.password}
          readOnly={busy}
        />

        <PasswordField
          id="register-confirmPassword"
          name="confirmPassword"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          required
          value={values.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          onBlur={() => onBlur("confirmPassword")}
          error={fieldErrors.confirmPassword}
          readOnly={busy}
        />

        <SubmitButton
          loading={busy}
          label="Créer mon compte"
          loadingLabel={isRedirecting ? "Redirection…" : "Création du compte…"}
        />

        <p className="text-center text-xs text-muted-foreground">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            politique de confidentialité
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
