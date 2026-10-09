"use client";

import React, { useEffect, useState } from "react";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatDT } from "@/lib/utils";
import { PaymentScheduleView } from "@/components/pricing/PaymentScheduleView";
import { motion } from "framer-motion";
import { calculatePaymentSchedule } from "@/lib/pricing/payment-schedule";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  User,
  Phone,
  MessageSquare,
  Lock,
  Clock,
  CreditCard,
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

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [reportingCashLoading, setReportingCashLoading] = useState(false);

  function handleUpdateMonthPayment(monthItem: any, index: number, schedule: any[]) {
    if (!selectedRes) return;
    const currentPaid = selectedRes.paymentSummary?.paidMonths || [];
    const monthKey = monthItem.monthKey;
    const exists = currentPaid.includes(monthKey);
    const updatedPaidMonths = exists
      ? currentPaid.filter((m: string) => m !== monthKey)
      : [...currentPaid, monthKey];

    setSelectedRes({
      ...selectedRes,
      paymentSummary: {
        ...selectedRes.paymentSummary,
        paidMonths: updatedPaidMonths,
      },
    });
  }

  async function handleReportCash(targetStatus: "REPORTED" | "UNPAID" = "REPORTED") {
    if (!selectedRes) return;
    try {
      setReportingCashLoading(true);
      const res = await fetch(`/api/owner/reservations/${selectedRes.id}/report-cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          amount: selectedRes.paymentSummary?.remainingAmount || selectedRes.pricing?.total || 0,
          paidMonths: selectedRes.paymentSummary?.paidMonths,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de modifier le statut du paiement.");
      setConfirmModalOpen(false);
      // Reload list and refresh selectedRes in place without kicking the owner out of the modal
      const updatedRes = await fetch(
        statusFilter !== "ALL"
          ? `/api/owner/reservations?status=${statusFilter}`
          : "/api/owner/reservations"
      );
      if (updatedRes.ok) {
        const list = await updatedRes.json();
        setReservations(list);
        const refreshedCurrent = list.find((r: any) => r.id === selectedRes.id);
        if (refreshedCurrent) {
          setSelectedRes(refreshedCurrent);
        } else if (data.paymentSummary) {
          setSelectedRes((prev: any) => ({
            ...prev,
            paymentSummary: {
              ...prev?.paymentSummary,
              ...data.paymentSummary,
            },
          }));
        }
      }
    } catch (err: any) {
      alert(err.message || "Erreur de communication.");
    } finally {
      setReportingCashLoading(false);
    }
  }

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
            const isPaid = res.paymentSummary?.status === "PAID";
            const isReported = res.paymentSummary?.status === "REPORTED";

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
                    <span className={`text-[0.7rem] font-medium px-2.5 py-0.5 rounded-md inline-block mt-0.5 ${
                      isPaid
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : isReported
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    }`}>
                      {isPaid
                        ? "Paiement vérifié"
                        : isReported
                        ? "Paiement déclaré"
                        : `En attente (${formatDT(res.paymentSummary?.remainingAmount || res.pricing?.total || 0)} DT)`}
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
              <div className="rounded-xl bg-surface p-4 space-y-3 border border-border/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" />
                  Client
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground text-sm">{selectedRes.customerName}</span>
                  <span className="text-muted-foreground font-medium">{selectedRes.guests} personne(s)</span>
                </div>

                {selectedRes.contactVisibility === "RELEASED" && (selectedRes.customerPhone || selectedRes.customerEmail) ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 space-y-2 text-xs">
                    <div className="font-semibold flex items-center justify-between gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {selectedRes.reason === "ADMIN_OVERRIDE" || selectedRes.contactAccessOverride?.enabled
                            ? "Coordonnées déverrouillées par l'administration"
                            : "Contact client disponible"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {selectedRes.customerPhone && (
                        <>
                          <a
                            href={`tel:${selectedRes.customerPhone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark"
                          >
                            <Phone className="h-3.5 w-3.5" /> Appeler ({selectedRes.customerPhone})
                          </a>
                          <a
                            href={`https://wa.me/${selectedRes.customerPhone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </>
                      )}
                      {selectedRes.customerEmail && (
                        <span className="text-xs text-muted-foreground font-mono block w-full mt-1">
                          Email : {selectedRes.customerEmail}
                        </span>
                      )}
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

              <div className="rounded-xl bg-surface p-4 space-y-2 border border-border/60">
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

              <PaymentScheduleView
                rentalCategory={selectedRes.rentalCategory}
                checkIn={selectedRes.checkIn}
                checkOut={selectedRes.checkOut}
                pricing={{
                  total: selectedRes.pricing?.total || 0,
                  unitPrice: selectedRes.pricing?.unitPrice || selectedRes.unitPrice,
                  pricePeriod: selectedRes.pricing?.pricePeriod || selectedRes.pricePeriod,
                  currency: "TND",
                }}
                paymentSummary={{
                  paidAmount: selectedRes.paymentSummary?.paidAmount || 0,
                  reportedAmount: selectedRes.paymentSummary?.reportedAmount || 0,
                  paidMonths: selectedRes.paymentSummary?.paidMonths || [],
                  status: selectedRes.paymentSummary?.status || "UNPAID",
                }}
                editableByOwner={true}
                onToggleMonthStatus={(monthItem, index, schedule) =>
                  handleUpdateMonthPayment(monthItem, index, schedule)
                }
              />

              <div className="rounded-xl bg-surface p-4 space-y-3 border border-border/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Paiement & Suivi financier
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.68rem] text-muted-foreground block">Total</span>
                    <span className="font-bold text-foreground">{formatDT(selectedRes.pricing?.total || 0)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.68rem] text-muted-foreground block">Déclaré</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{formatDT(selectedRes.paymentSummary?.reportedAmount || 0)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.68rem] text-muted-foreground block">Vérifié</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatDT(selectedRes.paymentSummary?.paidAmount || 0)} DT</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2">
                    <span className="text-[0.68rem] text-muted-foreground block">Reste</span>
                    <span className="font-bold text-foreground">{formatDT(selectedRes.paymentSummary?.remainingAmount || 0)} DT</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mode de paiement :</span>
                    <span className="font-semibold text-foreground">Espèces</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Statut du paiement :</span>
                    <span className={`font-medium px-2.5 py-0.5 rounded-md ${
                      selectedRes.paymentSummary?.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : selectedRes.paymentSummary?.status === "REPORTED"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {selectedRes.paymentSummary?.status === "PAID"
                        ? "Paiement vérifié"
                        : selectedRes.paymentSummary?.status === "REPORTED"
                        ? "Paiement déclaré"
                        : "Paiement en attente"}
                    </span>
                  </div>
                </div>

                {/* Owner Payment Status Control (Full Access) */}
                <div className="pt-3 border-t border-border space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Gérer le statut de paiement :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleReportCash("REPORTED")}
                      disabled={reportingCashLoading || selectedRes.paymentSummary?.status === "PAID"}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer ${
                        selectedRes.paymentSummary?.status === "REPORTED" || selectedRes.paymentSummary?.status === "PAID"
                          ? "bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-md"
                          : "bg-surface border border-border text-foreground hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-300"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {selectedRes.paymentSummary?.status === "REPORTED" || selectedRes.paymentSummary?.status === "PAID"
                        ? "Payé (Enregistré)"
                        : "Marquer comme Payé"}
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleReportCash("UNPAID")}
                      disabled={reportingCashLoading || selectedRes.paymentSummary?.status === "PAID"}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer ${
                        selectedRes.paymentSummary?.status === "UNPAID" || !selectedRes.paymentSummary?.status
                          ? "bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-700 hover:shadow-md"
                          : "bg-surface border border-border text-foreground hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-300"
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      {selectedRes.paymentSummary?.status === "UNPAID" || !selectedRes.paymentSummary?.status
                        ? "Non payé"
                        : "Marquer comme Non payé"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRes(null)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface/80"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedRes && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-foreground">
              Confirmer le paiement
            </h3>

            <p className="mt-2 text-xs text-muted-foreground">
              Vous confirmez avoir reçu :
            </p>

            <div className="my-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="font-display text-2xl font-bold text-primary">
                {formatDT(selectedRes.paymentSummary?.remainingAmount || selectedRes.pricing?.total || 0)} DT
              </p>
              <p className="text-xs font-medium text-foreground mt-1">en espèces</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                de la part de <strong className="text-foreground">{selectedRes.customerName}</strong>
              </p>
            </div>

            <p className="text-[0.75rem] text-muted-foreground">
              Cette action sera enregistrée dans l&apos;historique de la réservation.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={reportingCashLoading}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface/80"
              >
                Annuler
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleReportCash("REPORTED")}
                disabled={reportingCashLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-xs hover:bg-primary-dark cursor-pointer disabled:opacity-50 transition-all"
              >
                {reportingCashLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Confirmer la réception"
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
