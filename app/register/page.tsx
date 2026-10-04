import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte — LOC MAISON",
  description: "Créez votre compte LOC MAISON pour gérer vos demandes et locations de vacances.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md px-4 py-14 text-center text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
