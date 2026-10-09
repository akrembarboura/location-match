"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, CheckCircle, Building2, Calendar, ShieldCheck, User } from "lucide-react";
import { RentalContractData } from "@/types/contract";
import { downloadRentalContractPDF } from "@/lib/services/contract-generator";

interface RentalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentalContractData | null;
  loading?: boolean;
}

export function RentalContractModal({ isOpen, onClose, contract, loading }: RentalContractModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!contract) return;
    try {
      setDownloading(true);
      downloadRentalContractPDF(contract);
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-slate-200">
        <DialogHeader className="p-6 pb-4 bg-slate-900 text-white rounded-t-lg sticky top-0 z-10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Contrat de Location Saisonnier / Étudiant
              </DialogTitle>
              {contract && (
                <p className="text-xs text-slate-400">
                  Réf: {contract.contractId} | Émis le {new Date(contract.issuedAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={!contract || loading}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Imprimer
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!contract || loading || downloading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {downloading ? "Génération..." : "Télécharger (PDF)"}
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 md:p-8 bg-slate-50 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Chargement du contrat de location...</p>
            </div>
          ) : !contract ? (
            <div className="py-16 text-center text-slate-500">
              <p>Impossible de charger les données du contrat.</p>
            </div>
          ) : (
            <div id="printable-contract" className="bg-white p-6 md:p-10 rounded-xl border border-slate-200 shadow-sm space-y-8">
              {/* Header Branding */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                  <div className="text-2xl font-black tracking-tight text-slate-900">
                    LOC <span className="text-emerald-600">MAISON</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Plateforme d'Hébergement & Location en Tunisie</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Contrat Certifié Conforme
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{contract.contractId}</p>
                </div>
              </div>

              {/* 1. Parties */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  1. Identification des Parties
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs font-bold uppercase text-slate-500">Le Bailleur (Propriétaire)</div>
                    <div className="text-sm font-bold text-slate-900">{contract.owner.name}</div>
                    <div className="text-xs text-slate-600">Tél: {contract.owner.phone || "N/A"}</div>
                    <div className="text-xs text-slate-600">Email: {contract.owner.email || "N/A"}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs font-bold uppercase text-slate-500">Le Preneur (Locataire)</div>
                    <div className="text-sm font-bold text-slate-900">{contract.customer.name}</div>
                    <div className="text-xs text-slate-600">Tél: {contract.customer.phone || "N/A"}</div>
                    <div className="text-xs text-slate-600">Email: {contract.customer.email || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* 2. Property Designation */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  2. Désignation des Lieux Loués
                </h3>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-base font-bold text-slate-900">{contract.property.title}</div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Type de bien:</span> {contract.property.propertyType}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Adresse:</span> {contract.property.address}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Capacité:</span> {contract.property.bedrooms} chambre(s) · {contract.property.bathrooms} sdb · Jusqu'à {contract.property.guests} personnes
                  </div>
                </div>
              </div>

              {/* 3. Duration & Financial Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    3. Durée du Séjour
                  </h3>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <div><span className="font-semibold">Check-in:</span> {contract.dates.checkIn}</div>
                    <div><span className="font-semibold">Check-out:</span> {contract.dates.checkOut}</div>
                    <div className="pt-1 font-bold text-slate-900 text-sm">Total: {contract.dates.totalNights} nuit(s)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    4. Conditions Financières
                  </h3>
                  <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-1.5 text-xs text-slate-800">
                    <div><span className="font-semibold">Loyer:</span> {contract.pricing.pricePerNight} {contract.pricing.currency} / nuit</div>
                    <div><span className="font-semibold">Montant Séjour:</span> <span className="text-sm font-bold text-emerald-900">{contract.pricing.total} {contract.pricing.currency}</span></div>
                    <div className="pt-1">
                      <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white font-semibold rounded text-[11px]">
                        {contract.pricing.paymentStatus === "PAID" ? "Payé en totalité" : contract.pricing.paymentStatus === "PARTIALLY_PAID" ? `Acompte payé (${contract.pricing.paidAmount} TND)` : "Paiement sur place"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Terms */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  5. Clauses et Engagements
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {contract.terms.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ul>
              </div>

              {/* 6. Signatures */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center space-y-8 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-700 uppercase">Signature du Bailleur</div>
                  <div className="text-[11px] text-emerald-600 font-semibold italic">Signé électroniquement via LOC MAISON</div>
                </div>
                <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center space-y-8 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-700 uppercase">Signature du Preneur</div>
                  <div className="text-[11px] text-emerald-600 font-semibold italic">Signé électroniquement via LOC MAISON</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
