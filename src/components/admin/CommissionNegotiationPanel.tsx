"use client";

import { useState } from "react";
import { formatDT } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  UserCheck,
  Building,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";

interface CommissionNegotiationPanelProps {
  requestId: string;
  requestData: any;
  onRefresh: () => void;
  onStatusChange: (newStatus: string) => void;
}

export function CommissionNegotiationPanel({
  requestId,
  requestData,
  onRefresh,
  onStatusChange,
}: CommissionNegotiationPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Negotiation state fields
  const customerVerif = requestData?.negotiation?.customerVerification || {};
  const ownerNeg = requestData?.negotiation?.ownerNegotiation || {};
  const commTerms = requestData?.negotiation?.commissionTerms || {};
  const payVerif = requestData?.negotiation?.paymentVerification || {};

  // Form controls
  const [custNotes, setCustNotes] = useState(customerVerif.notes || "");
  const [rate, setRate] = useState<number>(commTerms.rate || ownerNeg.proposedRate || 10);
  const [basis, setBasis] = useState<"FIRST_MONTH_RENT" | "FIRST_AGREED_PAYMENT" | "TOTAL_RENTAL_VALUE">(
    commTerms.basis || ownerNeg.proposedBasis || "FIRST_MONTH_RENT"
  );
  const [collectionFlow, setCollectionFlow] = useState<"OWNER_DIRECT" | "PLATFORM_COLLECTS" | "MIXED">(
    commTerms.collectionFlow || ownerNeg.collectionFlow || "OWNER_DIRECT"
  );
  const [waiveReason, setWaiveReason] = useState(commTerms.waivedReason || "");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");

  const rentalBasis =
    commTerms.rentalBasis ||
    (typeof requestData?.budget === "number" ? requestData.budget : requestData?.selectedPropertyDetails?.pricing?.price || 600);

  // Live calculation preview
  const calculatedCommission = Math.round(((rentalBasis * rate) / 100) * 1000) / 1000;

  const handleAction = async (payload: any) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await fetch(`/api/admin/requests/${requestId}/negotiation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCustomer = () => {
    handleAction({
      action: "CUSTOMER_VERIFICATION",
      status: "CONFIRMED",
      notes: custNotes,
    });
  };

  const handleConfirmOwnerAgreement = () => {
    handleAction({
      action: "OWNER_NEGOTIATION",
      status: "AGREED",
      proposedRate: rate,
      proposedBasis: basis,
      collectionFlow,
    });
  };

  const handleFreezeCommission = (waive = false) => {
    handleAction({
      action: "CONFIRM_TERMS",
      rate,
      basis,
      rentalBasis,
      collectionFlow,
      waivedReason: waive ? waiveReason || "Exonération administrative accordée" : undefined,
    });
  };

  const handleRecordPayment = () => {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setErrorMsg("Veuillez saisir un montant de commission valide.");
      return;
    }
    handleAction({
      action: "RECORD_PAYMENT",
      amount: amt,
      paymentMethod,
      reference: paymentRef,
    });
  };

  const handleVerifyPayment = () => {
    handleAction({
      action: "VERIFY_PAYMENT",
      verifiedAmount: payVerif.reportedAmount || calculatedCommission,
    });
  };

  // Workflow Checklist
  const isCustVerified = customerVerif.status === "CONFIRMED";
  const isOwnerAgreed = ownerNeg.status === "AGREED";
  const isTermsFrozen = commTerms.status === "AGREED" || commTerms.status === "WAIVED";
  const isPaymentVerified = payVerif.status === "VERIFIED" || commTerms.status === "WAIVED" || payVerif.status === "WAIVED";
  const canConfirmReservation = isTermsFrozen && isPaymentVerified && Boolean(requestData?.selectedProperty || requestData?.propertyId);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Workflow Négociation & Commission</h3>
            <p className="text-xs text-muted-foreground">Validation étape par étape, commission et verrouillage financier</p>
          </div>
        </div>

        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${
            requestData?.status === "CONFIRMED"
              ? "bg-emerald-500/10 text-emerald-600"
              : canConfirmReservation
              ? "bg-blue-500/10 text-blue-600 animate-pulse"
              : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {requestData?.status === "CONFIRMED"
            ? "Réservation Confirmée"
            : canConfirmReservation
            ? "Prêt pour Confirmation"
            : "Négociation en cours"}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Customer Verification */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-primary" /> 1. Vérification Client & Sejour
          </span>
          {isCustVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Confirmé
            </span>
          ) : (
            <span className="text-xs text-amber-600 font-medium">À contacter</span>
          )}
        </div>

        {!isCustVerified && (
          <div className="space-y-2 pt-1 text-xs">
            <textarea
              rows={2}
              placeholder="Notes d'échange avec le client (dates validées, attentes tarifaires...)"
              value={custNotes}
              onChange={(e) => setCustNotes(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-lg text-xs"
            />
            <button
              onClick={handleVerifyCustomer}
              disabled={submitting}
              className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-colors"
            >
              {submitting ? "Enregistrement..." : "Valider l'échange client"}
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Owner Negotiation & Terms */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Building className="h-4 w-4 text-primary" /> 2. Négociation Propriétaire & Commission
          </span>
          {isTermsFrozen ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Terms Gelés ({commTerms.rate}%)
            </span>
          ) : (
            <span className="text-xs text-amber-600 font-medium">En négociation</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-muted-foreground font-medium mb-1">Taux Négocié (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              disabled={isTermsFrozen}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full p-2 bg-background border border-border rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-muted-foreground font-medium mb-1">Assiette de Calcul (Base)</label>
            <select
              disabled={isTermsFrozen}
              value={basis}
              onChange={(e: any) => setBasis(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-lg font-medium"
            >
              <option value="FIRST_MONTH_RENT">1er mois de loyer (Standard)</option>
              <option value="FIRST_AGREED_PAYMENT">1er versement convenu</option>
              <option value="TOTAL_RENTAL_VALUE">Loyer total du séjour</option>
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground font-medium mb-1">Canal d'Encaissement</label>
            <select
              disabled={isTermsFrozen}
              value={collectionFlow}
              onChange={(e: any) => setCollectionFlow(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-lg font-medium"
            >
              <option value="OWNER_DIRECT">Direct Propriétaire</option>
              <option value="PLATFORM_COLLECTS">Collecte Plateforme</option>
              <option value="MIXED">Mixte</option>
            </select>
          </div>
        </div>

        {/* Dynamic Calculation Live Preview */}
        <div className="p-3 bg-card border border-border rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Base locative applicable :</span>
            <span className="font-mono font-bold text-foreground">{formatDT(rentalBasis)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Formule :</span>
            <span className="font-mono">{formatDT(rentalBasis)} × {rate}%</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border font-bold text-sm">
            <span className="text-foreground">Commission Dûe LOC MAISON :</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatDT(calculatedCommission)}</span>
          </div>
        </div>

        {!isTermsFrozen && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleFreezeCommission(false)}
              disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              {submitting ? "Enregistrement..." : "Geler les termes de la commission"}
            </button>
            <button
              onClick={() => handleFreezeCommission(true)}
              disabled={submitting}
              className="px-3 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl border border-border hover:bg-secondary/80"
            >
              Exonérer
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Commission Payment Recording & Verification */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-primary" /> 3. Suivi du Règlement Commission
          </span>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
              payVerif.status === "VERIFIED" || commTerms.status === "WAIVED"
                ? "bg-emerald-500/10 text-emerald-600"
                : payVerif.status === "REPORTED"
                ? "bg-amber-500/10 text-amber-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {commTerms.status === "WAIVED"
              ? "Exonérée"
              : payVerif.status === "VERIFIED"
              ? "Vérifiée & Encaissée"
              : payVerif.status === "REPORTED"
              ? "Déclarée (À vérifier)"
              : "Non Payée"}
          </span>
        </div>

        {payVerif.status === "REPORTED" && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
            <div className="font-semibold">Paiement déclaré de {formatDT(payVerif.reportedAmount)} via {payVerif.paymentMethod}.</div>
            <button
              onClick={handleVerifyPayment}
              disabled={submitting}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Vérifier l'encaissement de la commission
            </button>
          </div>
        )}

        {payVerif.status !== "VERIFIED" && commTerms.status !== "WAIVED" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
            <input
              type="number"
              placeholder={`Montant (ex: ${calculatedCommission})`}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="p-2 bg-background border border-border rounded-lg font-mono"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="p-2 bg-background border border-border rounded-lg"
            >
              <option value="CASH">Espèces</option>
              <option value="BANK_TRANSFER">Virement bancaire</option>
              <option value="D17">D17 La Poste</option>
            </select>
            <button
              onClick={handleRecordPayment}
              disabled={submitting}
              className="p-2 bg-secondary text-foreground border border-border font-semibold text-xs rounded-lg hover:bg-secondary/80"
            >
              Enregistrer versement
            </button>
          </div>
        )}
      </div>

      {/* Step 4: Final Confirmation Prerequisites & Action */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Conditions préalables à la confirmation</h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-medium">
          <div className={isCustVerified ? "text-emerald-600" : "text-muted-foreground"}>
            {isCustVerified ? "✓" : "○"} Échange client validé
          </div>
          <div className={isOwnerAgreed ? "text-emerald-600" : "text-muted-foreground"}>
            {isOwnerAgreed ? "✓" : "○"} Accord propriétaire
          </div>
          <div className={isTermsFrozen ? "text-emerald-600" : "text-muted-foreground"}>
            {isTermsFrozen ? "✓" : "○"} Termes commission gelés
          </div>
          <div className={isPaymentVerified ? "text-emerald-600" : "text-muted-foreground"}>
            {isPaymentVerified ? "✓" : "○"} Règlement commission vérifié/exonéré
          </div>
        </div>

        {requestData?.status !== "CONFIRMED" && (
          <div className="pt-2">
            <button
              disabled={!canConfirmReservation || submitting}
              onClick={() => onStatusChange("CONFIRMED")}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirmer la réservation
            </button>
            {!canConfirmReservation && (
              <p className="text-[0.65rem] text-muted-foreground text-center mt-1.5">
                Toutes les conditions préalables doivent être satisfaites avant d'autoriser la confirmation.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
