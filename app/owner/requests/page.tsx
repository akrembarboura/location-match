"use client";

import React, { useEffect, useState } from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatDT } from "@/lib/utils";
import {
  Inbox,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function OwnerRequestsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        const res = await fetch("/api/owner/reservations");
        if (!res.ok) throw new Error("Erreur de chargement");
        const data = await res.json();
        setReservations(data || []);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des demandes.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  return (
    <OwnerShell
      title="Demandes de location"
      subtitle="Demandes de location en cours traitées et validées par LOC MAISON"
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs text-foreground mb-6">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Gestion centralisée des demandes</p>
          <p className="text-muted-foreground mt-0.5">
            LOC MAISON qualifie et valide chaque demande client avant d&apos;établir une proposition et de bloquer la réservation sur votre logement.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des demandes…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
            <Inbox className="h-8 w-8" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Aucune demande en attente pour vos biens.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Dès qu&apos;une demande client est validée sur un de vos biens, elle apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((req) => (
            <div key={req.id} className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">#{req.id}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  Réservation validée par LOC MAISON
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{req.propertyTitle}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Client : <span className="font-semibold text-foreground">{req.customerName}</span> ({req.guests} personne(s))
                  </p>
                </div>

                <div className="text-right font-bold text-base text-foreground">
                  {formatDT(req.pricing?.total || 0)} DT
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Du {new Date(req.checkIn).toLocaleDateString("fr-FR")} au {new Date(req.checkOut).toLocaleDateString("fr-FR")}
                </span>
                <span>Ville : {req.propertyCity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerShell>
  );
}
