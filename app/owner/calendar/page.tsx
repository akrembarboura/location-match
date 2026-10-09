"use client";

import React, { useEffect, useState } from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatDT } from "@/lib/utils";
import { PaymentScheduleView } from "@/components/pricing/PaymentScheduleView";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  User,
  Phone,
  MessageSquare,
  Lock,
  Clock,
  CreditCard,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react";

export default function OwnerCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        setLoading(true);
        const url = selectedPropertyId !== "ALL"
          ? `/api/owner/calendar?propertyId=${selectedPropertyId}`
          : "/api/owner/calendar";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erreur de chargement");
        const data = await res.json();
        setProperties(data.properties || []);
        setEvents(data.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, [selectedPropertyId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Days in current month grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust starting day for Monday start (0: Mon, 6: Sun)
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  function getEventsForDay(day: number) {
    const target = new Date(year, month, day);
    return events.filter((e) => {
      const start = new Date(e.checkIn);
      const end = new Date(e.checkOut);
      return target >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             target <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  }

  return (
    <OwnerShell
      title="Calendrier des locations"
      subtitle="Visualisez les occupations, arrivées et disponibilités de vos biens"
    >
      {/* Calendar Controls & Property Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-2xs mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-foreground min-w-30 text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface/80 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>

        {/* Filters and View mode */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">Tous les biens</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-lg border border-border bg-background p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "month" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "list" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Legend - Clean Single Dot Per Category */}
      <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-muted-foreground mb-6 p-3.5 rounded-xl bg-surface border border-border">
        <span className="font-semibold text-foreground mr-1">Légende :</span>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
          <span>Louée / Réservée</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>Arrivée prochaine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
          <span>Départ prochain</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-600 shrink-0" />
          <span>Paiement en attente</span>
        </div>
      </div>

      {/* Main Calendar Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Chargement du calendrier…</p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {events.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucune réservation trouvée pour la période sélectionnée.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedReservation(e)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-foreground">{e.propertyTitle}</span>
                      <span className="text-xs text-muted-foreground">• {e.guests} client(s)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Client : <span className="font-medium text-foreground">{e.customerName}</span>
                    </p>
                    <p className="text-xs font-mono text-primary font-medium">{e.formattedRange}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="block text-sm font-semibold text-foreground">{formatDT(e.totalAmount)} DT</span>
                      <span className={`text-[0.7rem] font-medium px-2.5 py-0.5 rounded-md inline-block mt-0.5 ${
                        ["PAID", "VERIFIED", "CONFIRMED"].includes(e.paymentStatus)
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : e.paymentStatus === "REPORTED"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : e.paymentStatus === "PARTIALLY_PAID"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      }`}>
                        {["PAID", "VERIFIED", "CONFIRMED"].includes(e.paymentStatus)
                          ? "Payé"
                          : e.paymentStatus === "REPORTED"
                          ? "Paiement déclaré"
                          : e.paymentStatus === "PARTIALLY_PAID"
                          ? `Reste ${formatDT(e.remainingAmount)} DT`
                          : "Non payé"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                      Détails <Eye className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MONTH GRID VIEW */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-xs font-semibold text-muted-foreground py-2.5">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border bg-background min-h-120">
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-surface/30 min-h-22.5" />;
              }

              const dayEvents = getEventsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${day}`}
                  className={`p-1.5 min-h-22.5 flex flex-col justify-start overflow-hidden transition-colors ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-rose-700 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayEvents.map((evt) => {
                      const isUnpaid = evt.paymentStatus !== "PAID";
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedReservation(evt)}
                          className={`p-1.5 rounded-md text-[0.7rem] leading-tight cursor-pointer font-medium transition-opacity hover:opacity-90 shadow-2xs ${
                            isUnpaid
                              ? "bg-amber-500/10 text-amber-900 border border-amber-500/20 dark:text-amber-200"
                              : "bg-rose-500/10 text-rose-900 border border-rose-500/20 dark:text-rose-200"
                          }`}
                        >
                          <div className="font-semibold truncate">{evt.propertyTitle}</div>
                          <div className="truncate text-[0.65rem] text-muted-foreground">{evt.customerName}</div>
                          <div className="font-bold text-[0.65rem] mt-0.5">
                            {formatDT(evt.totalAmount)} DT {isUnpaid && `(Reste ${formatDT(evt.remainingAmount)})`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  Réservation #{selectedReservation.id}
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mt-0.5">
                  {selectedReservation.propertyTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReservation(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="mt-5 space-y-5 text-sm">
              {/* Client section */}
              <div className="rounded-xl bg-surface p-4 space-y-3 border border-border/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" />
                  Client
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground text-sm">{selectedReservation.customerName}</span>
                  <span className="text-muted-foreground font-medium">{selectedReservation.guests} client(s)</span>
                </div>

                {selectedReservation.contactVisibility === "RELEASED" && selectedReservation.customerPhone ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 space-y-2 text-xs">
                    <div className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Contact client disponible</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={`tel:${selectedReservation.customerPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark"
                      >
                        <Phone className="h-3.5 w-3.5" /> Appeler ({selectedReservation.customerPhone})
                      </a>
                      <a
                        href={`https://wa.me/${selectedReservation.customerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <Lock className="h-4 w-4 text-amber-600" />
                      <span>Coordonnées masquées</span>
                    </div>
                    <p className="text-[0.75rem] text-muted-foreground">
                      Les coordonnées du client seront disponibles après confirmation de la réservation et validation du paiement par LOC MAISON.
                    </p>
                  </div>
                )}
              </div>

              {/* Stay section */}
              <div className="rounded-xl bg-surface p-4 space-y-2 border border-border/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Séjour & Temps restant
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Arrivée :</span>
                    <span className="font-semibold text-foreground">{new Date(selectedReservation.checkIn).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Départ :</span>
                    <span className="font-semibold text-foreground">{new Date(selectedReservation.checkOut).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {selectedReservation.remainingInfo?.label || "Séjour actif"}
                  </span>
                </div>
              </div>

              <PaymentScheduleView
                rentalCategory={selectedReservation.rentalCategory}
                checkIn={selectedReservation.checkIn}
                checkOut={selectedReservation.checkOut}
                pricing={{
                  total: selectedReservation.totalAmount,
                  unitPrice: selectedReservation.unitPrice,
                  pricePeriod: selectedReservation.pricePeriod,
                  currency: "TND",
                }}
                paymentSummary={{
                  paidAmount: selectedReservation.paidAmount,
                  reportedAmount: selectedReservation.reportedAmount,
                  paidMonths: selectedReservation.paidMonths,
                  status: selectedReservation.paymentStatus,
                }}
                editableByOwner={true}
              />

              {/* Payment section */}
              <div className="rounded-xl bg-surface p-4 space-y-3 border border-border/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Suivi financier & Paiement
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.7rem] text-muted-foreground block">Total</span>
                    <span className="font-bold text-foreground text-sm">{formatDT(selectedReservation.totalAmount)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.7rem] text-muted-foreground block">Payé</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatDT(selectedReservation.paidAmount)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.7rem] text-muted-foreground block">Reste</span>
                    <span className="font-bold text-foreground text-sm">{formatDT(selectedReservation.remainingAmount)} DT</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                  <span className="text-muted-foreground">Statut du paiement :</span>
                  <span className={`font-medium px-2.5 py-0.5 rounded-md ${
                    ["PAID", "VERIFIED", "CONFIRMED"].includes(selectedReservation.paymentStatus)
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : selectedReservation.paymentStatus === "REPORTED"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : selectedReservation.paymentStatus === "PARTIALLY_PAID"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  }`}>
                    {["PAID", "VERIFIED", "CONFIRMED"].includes(selectedReservation.paymentStatus)
                      ? "Payé"
                      : selectedReservation.paymentStatus === "REPORTED"
                      ? "Paiement déclaré (En attente)"
                      : selectedReservation.paymentStatus === "PARTIALLY_PAID"
                      ? "Paiement partiel"
                      : "Non payé"}
                  </span>
                </div>

                <div className="rounded-lg bg-card border border-border/50 p-2.5 text-[0.75rem] text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Paiements confirmés et sécurisés par LOC MAISON.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setSelectedReservation(null)}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
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
