"use client";

import React from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { User, Mail, Phone, ShieldCheck, Building2 } from "lucide-react";

export default function OwnerProfilePage() {
  const { user } = useAuth();

  return (
    <OwnerShell
      title="Profil propriétaire"
      subtitle="Vos informations de compte et coordonnées de contact"
    >
      <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "P"}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">
              {user?.firstName} {user?.lastName}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Compte Propriétaire Vérifié
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Adresse e-mail
            </span>
            <span className="font-semibold text-foreground">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Numéro de téléphone
            </span>
            <span className="font-mono font-semibold text-foreground">
              {user?.phone || "Non renseigné"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Rôle sur la plateforme
            </span>
            <span className="font-semibold text-foreground uppercase">{user?.role}</span>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}
