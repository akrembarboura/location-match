"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuthMutations } from "@/lib/auth/api";
import { LoginFormSchema, firstFieldErrors, type LoginFormValues } from "@/lib/auth/form-schemas";
import { withCallbackUrl } from "@/lib/auth/redirect";
import { AuthCard, AuthField, FormAlert, PasswordField, SubmitButton } from "./AuthFormParts";
import { useAuthPageRedirect } from "./useAuthPageRedirect";

type FieldName = keyof LoginFormValues;

export function LoginForm() {
  const { callbackUrl, isRedirecting } = useAuthPageRedirect();
  const { login } = useAuthMutations();

  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const busy = login.isPending || isRedirecting;

  function validate(next: LoginFormValues) {
    const result = LoginFormSchema.safeParse(next);
    return result.success ? {} : firstFieldErrors(result.error);
  }

  function update(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    // After a first submit attempt, re-validate live so errors clear as the user fixes them.
    if (submitted) setFieldErrors(validate(next));
  }

  function onBlur(name: FieldName) {
    if (!values[name]) return; // don't nag on empty fields until submit
    const errors = validate(values);
    setFieldErrors((prev) => ({ ...prev, [name]: errors[name] }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return; // prevents duplicate submissions
    setSubmitted(true);
    setFormError(null);

    const errors = validate(values);
    setFieldErrors(errors);
    const firstInvalid = (Object.keys(errors) as FieldName[])[0];
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus();
      return;
    }

    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        // On success the session cache is updated and useAuthPageRedirect navigates.
        onError: (error) => {
          setFormError(error.message);
          if (error.code === "VALIDATION") setFieldErrors(error.fieldErrors);
          if (error.code === "INVALID_CREDENTIALS") {
            setValues((v) => ({ ...v, password: "" }));
            document.getElementById("login-password")?.focus();
          }
        },
      },
    );
  }

  const isOwnerIntent = callbackUrl?.startsWith("/owner");

  return (
    <AuthCard
      eyebrow={isOwnerIntent ? "Espace Propriétaire" : "Mon espace"}
      title="Connexion"
      description={
        isOwnerIntent
          ? "Connectez-vous pour accéder à votre espace propriétaire."
          : "Connectez-vous à votre compte pour gérer vos demandes et locations."
      }
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href={withCallbackUrl("/register", callbackUrl)} className="font-medium text-primary underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={formError ? "login-form-error" : undefined}>
        {formError && (
          <div id="login-form-error">
            <FormAlert>{formError}</FormAlert>
          </div>
        )}

        <AuthField
          id="login-email"
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

        <PasswordField
          id="login-password"
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          error={fieldErrors.password}
          readOnly={busy}
        />

        <p className="text-right text-xs text-muted-foreground">
          Mot de passe oublié ?{" "}
          <a href="tel:+21690000000" className="font-medium text-primary underline-offset-4 hover:underline">
            Contactez-nous
          </a>
        </p>

        <SubmitButton loading={busy} label="Se connecter" loadingLabel={isRedirecting ? "Redirection…" : "Connexion…"} />
      </form>
    </AuthCard>
  );
}
