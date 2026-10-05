"use client";

import React, { useEffect, useState } from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatDT } from "@/lib/utils";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  User,
  Phone,
  Clock,
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";

export default function OwnerReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRes, setSelectedRes] = useState<any | null>(null);

  useEffect(() => {
    async function fetchReservations() {
      try {
        setLoading(true);
        const url = statusFilter !== "ALL"
          ? `/api/owner/reservations?status=${statusFilter}`
          : "/api/owner/reservations";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erreur lors du chargement des réservations");
        const data = await res.json();
        setReservations(data || []);
      } catch (err: any) {
        setError(err.message || "Impossible de charger les réservations.");
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [statusFilter]);

  return (
    <OwnerShell
      title="Réservations confirmées"
      subtitle="Suivez vos locations confirmées, détails clients et état financier"
    >
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-2xs mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-foreground">Filtrer par statut :</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="ALL">Toutes les réservations</option>
          <option value="CONFIRMED">Confirmées</option>
          <option value="COMPLETED">Terminées</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement des réservations…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Aucune réservation confirmée pour le moment.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Les réservations confirmées via la plateforme LOC MAISON apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const checkInStr = new Date(res.checkIn).toLocaleDateString("fr-FR");
            const checkOutStr = new Date(res.checkOut).toLocaleDateString("fr-FR");
            const isUnpaid = res.paymentSummary?.status !== "PAID";

            return (
              <div
                key={res.id}
                onClick={() => setSelectedRes(res)}
                className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-2xs transition-all hover:shadow-card cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                    <img
                      src={res.propertyCoverImage || "/placeholder-property.jpg"}
                      alt={res.propertyTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">#{res.id}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-foreground">{res.propertyCity}</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-foreground">
                      {res.propertyTitle}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Client : <span className="font-semibold text-foreground">{res.customerName}</span> ({res.guests} pers.)
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{checkInStr} → {checkOutStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border gap-2">
                  <div className="text-right">
                    <span className="block text-base font-bold text-foreground">
                      {formatDT(res.pricing?.total || 0)} DT
                    </span>
                    <span className={`text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                      !isUnpaid
                        ? "bg-emerald-500/10 text-emerald-600"
                        : res.paymentSummary?.status === "PARTIALLY_PAID"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-rose-500/10 text-rose-600"
                    }`}>
                      {!isUnpaid ? "✓ Payé" : res.paymentSummary?.status === "PARTIALLY_PAID" ? `⚠ Reste ${formatDT(res.paymentSummary?.remainingAmount || 0)} DT` : "⚠ Non payé"}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-primary">Voir détails →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Details Drawer Modal */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  Réservation #{selectedRes.id}
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mt-0.5">
                  {selectedRes.propertyTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-xl bg-surface p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" />
                  Client
                </h4>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{selectedRes.customerName}</span>
                  <span className="text-xs text-muted-foreground">{selectedRes.guests} client(s)</span>
                </div>
                {selectedRes.customerPhone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <a href={`tel:${selectedRes.customerPhone}`} className="hover:underline font-mono">
                      {selectedRes.customerPhone}
                    </a>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-surface p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Dates de séjour
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Arrivée :</span>
                    <span className="font-semibold text-foreground">{new Date(selectedRes.checkIn).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Départ :</span>
                    <span className="font-semibold text-foreground">{new Date(selectedRes.checkOut).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-surface p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Montants & Règlement
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-border bg-background p-2">
                    <span className="text-[0.7rem] text-muted-foreground block">Montant total</span>
                    <span className="font-bold text-foreground text-sm">{formatDT(selectedRes.pricing?.total || 0)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <span className="text-[0.7rem] text-muted-foreground block">Payé</span>
                    <span className="font-bold text-emerald-600 text-sm">{formatDT(selectedRes.paymentSummary?.paidAmount || 0)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <span className="text-[0.7rem] text-muted-foreground block">Restant</span>
                    <span className="font-bold text-rose-600 text-sm">{formatDT(selectedRes.paymentSummary?.remainingAmount || 0)} DT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRes(null)}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
