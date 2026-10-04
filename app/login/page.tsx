import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — LOC MAISON",
  description: "Connectez-vous à votre compte LOC MAISON pour gérer vos demandes et locations.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md px-4 py-14 text-center text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
