"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, Clock, Layers, CheckSquare, Square, Loader2, Info } from "lucide-react";
import { calculatePaymentSchedule, PaymentScheduleResult, MonthlyScheduleItem } from "@/lib/pricing/payment-schedule";

interface PaymentScheduleViewProps {
  rentalCategory?: string;
  checkIn: Date | string;
  checkOut: Date | string;
  pricing?: {
    total?: number;
    unitPrice?: number;
    pricePeriod?: string;
    pricePerNight?: number;
    currency?: string;
  };
  paymentSummary?: {
    paidAmount?: number;
    reportedAmount?: number;
    paidMonths?: string[];
    status?: string;
  };
  compact?: boolean;
  editableByOwner?: boolean;
  onToggleMonthStatus?: (
    item: MonthlyScheduleItem,
    index: number,
    schedule: MonthlyScheduleItem[]
  ) => Promise<void> | void;
}

export function PaymentScheduleView({
  rentalCategory,
  checkIn,
  checkOut,
  pricing,
  paymentSummary,
  compact = false,
  editableByOwner = false,
  onToggleMonthStatus,
}: PaymentScheduleViewProps) {
  const [updatingMonth, setUpdatingMonth] = useState<string | null>(null);

  const result: PaymentScheduleResult = calculatePaymentSchedule({
    rentalCategory,
    checkIn,
    checkOut,
    pricing,
    paymentSummary,
  });

  const handleMonthClick = async (item: MonthlyScheduleItem, index: number) => {
    if (!editableByOwner || !onToggleMonthStatus) return;
    try {
      setUpdatingMonth(item.monthKey);
      await onToggleMonthStatus(item, index, result.schedule);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la mensualité:", err);
    } finally {
      setUpdatingMonth(null);
    }
  };

  if (!result.isStudentMonthly) {
    // Summer / Short-Term Stay View (Soft Colors & Motion)
    const { staySummary, totalAmount, paidAmount, remainingAmount, currency, overallStatus } = result;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-7 space-y-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Règlement du Séjour (Vacances / Estival)
              </h4>
              <p className="text-xs text-slate-500">Tarification par nuitée / séjour</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
              overallStatus === "PAID"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : overallStatus === "PARTIALLY_PAID" || overallStatus === "REPORTED"
                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            {overallStatus === "PAID"
              ? "✓ Payé en totalité"
              : overallStatus === "PARTIALLY_PAID"
              ? "🟡 Acompte versé"
              : overallStatus === "REPORTED"
              ? "🟡 En cours de confirmation"
              : "🔴 Non payé (Sur place)"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1"
          >
            <span className="text-slate-500 font-medium">Durée du séjour</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-base">
              {staySummary?.nights} Nuit{staySummary?.nights && staySummary.nights > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-slate-500">
              Du {staySummary?.checkIn} au {staySummary?.checkOut}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1"
          >
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Montant Total du Séjour</span>
            <div className="font-bold text-lg text-emerald-900 dark:text-emerald-200">
              {totalAmount} {currency}
            </div>
            <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              {staySummary?.pricePerNight} {currency} / nuit
            </div>
          </motion.div>
        </div>

        {paidAmount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 gap-2">
            <span>Déjà réglé : <strong className="text-emerald-600 dark:text-emerald-400">{paidAmount} {currency}</strong></span>
            <span>Solde restant : <strong className="text-slate-900 dark:text-slate-100">{remainingAmount} {currency}</strong></span>
          </div>
        )}
      </motion.div>
    );
  }

  // Student Monthly Schedule View with Motion & Pastel Colors
  const paidMonthsCount = result.schedule.filter((item) => item.status === "PAID").length;
  const totalMonthsCount = result.schedule.length;
  const progressPercent = Math.round((paidMonthsCount / totalMonthsCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6 shadow-xs"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Échéancier & Suivi des Loyer Mensuels
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Règlement mois par mois ({result.monthlyRate} {result.currency} / mois)
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto shrink-0 whitespace-nowrap">
          <span className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full border border-indigo-200/60 dark:border-indigo-800 whitespace-nowrap">
            {paidMonthsCount} / {totalMonthsCount} Mois Réglés
          </span>
        </div>
      </div>

      {/* Monthly Progress Bar with Animated Motion */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span>Avancement du bail</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {result.paidAmount} / {result.totalAmount} {result.currency} ({progressPercent}%)
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          />
        </div>
      </div>

      {/* Active Month Highlight Card */}
      {result.activeMonthDue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-5 rounded-2xl border transition-all ${
            result.activeMonthDue.status === "PAID"
              ? "bg-emerald-50/60 border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
              : "bg-amber-50/60 border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-800 text-amber-950 dark:text-amber-200"
          } flex items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3.5">
            {result.activeMonthDue.status === "PAID" ? (
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              </div>
            ) : (
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600 shrink-0" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                {result.activeMonthDue.status === "PAID" ? "Toutes les mensualités sont à jour" : "Prochaine Échéance en cours"}
              </div>
              <div className="text-lg font-bold mt-0.5">
                {result.activeMonthDue.monthLabel} : {result.activeMonthDue.amount} {result.currency}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Timeline Calendar Table Grid */}
      {!compact && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Calendrier des Mensualités ({totalMonthsCount} mois)
            </span>
            {editableByOwner && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                Cliquer sur un mois pour valider la réception du loyer
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            <AnimatePresence>
              {result.schedule.map((item, index) => {
                const isUpdating = updatingMonth === item.monthKey;

                return (
                  <motion.div
                    key={item.monthKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    whileHover={editableByOwner ? { y: -2, scale: 1.015 } : {}}
                    whileTap={editableByOwner ? { scale: 0.975 } : {}}
                    onClick={() => editableByOwner && handleMonthClick(item, index)}
                    className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all duration-150 overflow-hidden w-full ${
                      editableByOwner
                        ? "cursor-pointer hover:border-emerald-500 hover:shadow-md hover:ring-2 hover:ring-emerald-500/20 active:scale-[0.98]"
                        : ""
                    } ${
                      item.status === "PAID"
                        ? "bg-emerald-50/40 border-emerald-200/60 text-slate-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300"
                        : item.status === "PARTIALLY_PAID"
                        ? "bg-amber-50/40 border-amber-200/60 text-slate-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300"
                        : "bg-slate-50/60 border-slate-200/70 dark:bg-slate-800/30 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {editableByOwner && (
                        <div className="text-emerald-600 dark:text-emerald-400 shrink-0">
                          {isUpdating ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin text-emerald-600" />
                          ) : item.status === "PAID" ? (
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-slate-400" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{item.monthLabel}</div>
                        <div className="text-slate-500 text-[10px] sm:text-[11px] truncate">Échéance : {item.dueDate}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.amount} {result.currency}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                          item.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                            : item.status === "PARTIALLY_PAID"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                        }`}
                      >
                        {item.status === "PAID"
                          ? "🟢 Payé (Enregistré)"
                          : item.status === "PARTIALLY_PAID"
                          ? `🟡 Partiel (${item.paidAmount} DT)`
                          : "🔴 Non payé"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
