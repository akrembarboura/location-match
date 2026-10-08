"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(null);
    setDevResetUrl(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Une erreur est survenue.");
      }

      setIsSubmitted(true);

      // In development mode, display reset link for quick local testing
      if (json.data?.resetUrl) {
        setDevResetUrl(json.data.resetUrl);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-neutral-900">
          Mot de passe oublié ?
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 rounded-xl sm:px-10">
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Demande envoyée !</h3>
              <p className="text-sm text-neutral-600">
                Si un compte existe pour <span className="font-medium text-neutral-900">{email}</span>, un e-mail avec les instructions de réinitialisation a été transmis.
              </p>

              {devResetUrl && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-amber-900 break-all space-y-1">
                  <p className="font-semibold text-amber-800"> Mode Développement :</p>
                  <p>Lien direct de réinitialisation :</p>
                  <Link href={devResetUrl} className="text-emerald-700 underline font-mono block">
                    {devResetUrl}
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="exemple@domaine.tn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-emerald-600"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

