"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatDT } from "@/lib/utils";
import {
  CalendarDays,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Building2,
} from "lucide-react";

export default function PropertyAvailabilityPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<any | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [propRes, resRes] = await Promise.all([
          fetch(`/api/owner/properties/${propertyId}`),
          fetch(`/api/owner/reservations?propertyId=${propertyId}`),
        ]);

        if (!propRes.ok) throw new Error("Impossible de charger ce logement.");
        const propData = await propRes.json();
        const resData = resRes.ok ? await resRes.json() : [];

        setProperty(propData);
        setReservations(resData || []);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [propertyId]);

  return (
    <OwnerShell
      title={property?.title ? `Disponibilités — ${property.title}` : "Disponibilités du bien"}
      subtitle="Visualisez l'historique et le calendrier d'occupation de ce logement"
      actions={
        <Link
          href="/owner/properties"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux biens
        </Link>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des disponibilités…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Property Status Summary Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                <img
                  src={property?.images?.[0]?.url || (typeof property?.images?.[0] === "string" ? property.images[0] : null) || "/placeholder-property.jpg"}
                  alt={property?.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{property?.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {property?.city} • {property?.capacity?.guests || 1} personnes max.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Statut actuel :</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                property?.availabilityStatus === "RESERVED"
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}>
                {property?.availabilityStatus === "RESERVED" ? "● Louée" : "✓ Disponible"}
              </span>
            </div>
          </div>

          {/* Reservation Timeline */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-4">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Historique des réservations & Occupations
            </h3>

            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Aucune réservation enregistrée pour ce logement.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {reservations.map((res) => (
                  <div key={res.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-primary">#{res.id}</span>
                      <p className="text-sm font-semibold text-foreground">{res.customerName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(res.checkIn).toLocaleDateString("fr-FR")} → {new Date(res.checkOut).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">{formatDT(res.pricing?.total || 0)} DT</span>
                      <span className="block text-[0.7rem] font-semibold text-emerald-600">✓ Confirmée</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
