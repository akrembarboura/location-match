"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialToken = searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState(initialToken);
  
  const [step, setStep] = useState<"VERIFY_OTP" | "ENTER_PASSWORD">(
    initialToken ? "ENTER_PASSWORD" : "VERIFY_OTP"
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Handle OTP verification step
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length !== 6) {
      setErrorMessage("Veuillez saisir votre adresse e-mail et le code OTP à 6 chiffres.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Code OTP invalide.");
      }

      setResetToken(json.data.resetToken);
      setStep("ENTER_PASSWORD");
      setInfoMessage("Code vérifié avec succès. Veuillez choisir votre nouveau mot de passe.");
    } catch (err: any) {
      setErrorMessage(err.message || "Impossible de vérifier le code OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (!email) return;
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!res.ok && json.error?.code === "TOO_MANY_REQUESTS") {
        throw new Error(json.error?.message);
      }

      setInfoMessage("Un nouveau code OTP a été envoyé à votre adresse e-mail.");
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du renvoi du code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset submission
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetToken) {
      setErrorMessage("Jeton de réinitialisation manquant. Veuillez saisir le code OTP.");
      setStep("VERIFY_OTP");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Échec de la réinitialisation du mot de passe.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">Mot de passe réinitialisé !</h3>
        <p className="text-sm text-neutral-600">
          Votre mot de passe a été mis à jour avec succès. Redirection vers la page de connexion...
        </p>
        <Link href="/login">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
            Se connecter maintenant
          </Button>
        </Link>
      </div>
    );
  }

  if (step === "VERIFY_OTP") {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {infoMessage && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="exemple@domaine.tn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Code OTP à 6 chiffres</Label>
          <div className="relative">
            <Input
              id="otp"
              type="text"
              maxLength={6}
              required
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="pl-10 font-mono tracking-widest text-lg"
              disabled={isLoading}
            />
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          </div>
        </div>

        <div className="space-y-3">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading || otp.length !== 6}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier le code OTP"
            )}
          </Button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isLoading || !email}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-neutral-600 hover:text-emerald-600 disabled:opacity-50 py-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Renvoyer un nouveau code OTP
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmitPassword} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {infoMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <AlertDescription>{infoMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            required
            placeholder="Au moins 8 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type="password"
            required
            placeholder="Répétez le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Réinitialisation...
          </>
        ) : (
          "Enregistrer le nouveau mot de passe"
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-neutral-900">
          Nouveau mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Entrez votre code OTP ou votre nouveau mot de passe sécurisé.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          <Suspense fallback={
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
