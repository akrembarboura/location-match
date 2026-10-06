"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/rentals/request-schema";
import {
  ArrowLeft,
  Phone,
  Home,
  MapPin,
  Users,
  Send,
  Save,
  MessageSquare,
  Building,
  Lock,
  Unlock,
  ShieldCheck,
  Loader2,
  X,
  Calendar,
} from "lucide-react";

export default function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [requestData, setRequestData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Proposal Form State
  const [propId, setPropId] = useState("");
  const [propPrice, setPropPrice] = useState("");
  const [propMsg, setPropMsg] = useState("");
  const [sendingProposal, setSendingProposal] = useState(false);

  // Contact Unlock/Relock State
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [unlockingLoading, setUnlockingLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [relockingLoading, setRelockingLoading] = useState(false);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/requests/${id}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Demande introuvable.");
      }
      const data = await res.json();
      setRequestData(data);
      setNoteText(data.adminNotes || "");
    } catch (err: any) {
      setError(err.message || "Erreur de chargement de la demande.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: RequestStatus) => {
    if (!requestData) return;
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatusMessage(`Statut mis à jour : ${newStatus}`);
        setRequestData((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
      } else {
        const d = await res.json().catch(() => ({}));
        setStatusMessage(d.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setStatusMessage("Erreur réseau lors de la mise à jour");
    }
  };

  const handleSaveNotes = async () => {
    if (!requestData) return;
    setSavingNote(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: noteText }),
      });

      if (res.ok) {
        setStatusMessage("Notes internes enregistrées.");
        setRequestData((prev: any) => (prev ? { ...prev, adminNotes: noteText } : prev));
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData || !propId.trim()) return;
    setSendingProposal(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propId.trim(),
          proposedPrice: propPrice ? Number(propPrice) : undefined,
          adminMessage: propMsg.trim() || undefined,
        }),
      });

      if (res.ok) {
        setStatusMessage("Proposition transmise au client !");
        setPropId("");
        setPropPrice("");
        setPropMsg("");
        await fetchRequestDetail();
      } else {
        const d = await res.json();
        setStatusMessage(d.error || "Erreur lors de l'ajout");
      }
    } finally {
      setSendingProposal(false);
    }
  };

  const handleAdminUnlockContact = async () => {
    if (!requestData || !unlockReason.trim() || unlockReason.trim().length < 3) {
      setUnlockError("Le motif du déverrouillage est obligatoire (au moins 3 caractères).");
      return;
    }

    try {
      setUnlockingLoading(true);
      setUnlockError(null);
      const targetResId = requestData.reservationId || requestData.id;
      const res = await fetch(`/api/admin/reservations/${targetResId}/contact-access/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: unlockReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du déverrouillage des coordonnées.");
      }

      setStatusMessage("Coordonnées déverrouillées avec succès pour le propriétaire !");
      setUnlockModalOpen(false);
      setUnlockReason("");
      await fetchRequestDetail();
    } catch (err: any) {
      setUnlockError(err.message || "Erreur de communication.");
    } finally {
      setUnlockingLoading(false);
    }
  };

  const handleAdminRelockContact = async () => {
    if (!requestData) return;

    try {
      setRelockingLoading(true);
      const targetResId = requestData.reservationId || requestData.id;
      const res = await fetch(`/api/admin/reservations/${targetResId}/contact-access/relock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du verrouillage des coordonnées.");
      }

      setStatusMessage("Coordonnées verrouillées à nouveau pour le propriétaire !");
      await fetchRequestDetail();
    } catch (err: any) {
      setStatusMessage(err.message || "Erreur de communication.");
    } finally {
      setRelockingLoading(false);
    }
  };

  const customerName = requestData?.customer?.fullName || requestData?.customer || "Client inconnu";
  const customerPhone = requestData?.customer?.phone || requestData?.phone;

  return (
    <AdminShell
      title={`Fiche Demande ${id}`}
      subtitle="Gestion complète des détails, du statut, de l'accès contact et des propositions"
    >
      <div className="mb-4">
        <Link
          href="/admin/requests"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la liste des demandes
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Chargement des détails...</span>
        </div>
      ) : error || !requestData ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">{error || "Demande introuvable"}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Request Information & Direct Property Card */}
          <div className="space-y-6 lg:col-span-7">
            {/* Header Box */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="font-mono text-xs font-semibold text-primary">{requestData.id}</span>
                  <h2 className="font-display text-2xl font-bold text-foreground mt-0.5">
                    {customerName}
                  </h2>
                </div>
                {customerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-green-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Appeler ({customerPhone})
                  </a>
                )}
              </div>

              {statusMessage && (
                <div className="mt-4 rounded-md bg-primary/10 p-3 text-xs font-medium text-primary">
                  {statusMessage}
                </div>
              )}

              {/* Direct Property Reservation Details */}
              {requestData.selectedPropertyDetails && (
                <div className="mt-5 overflow-hidden rounded-xl border border-primary/20 bg-surface p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Demande de réservation directe
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        requestData.selectedPropertyDetails.availabilityStatus === "RESERVED"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}
                    >
                      Bien : {requestData.selectedPropertyDetails.availabilityStatus}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-4">
                    {requestData.selectedPropertyDetails.coverImage ? (
                      <img
                        src={requestData.selectedPropertyDetails.coverImage}
                        alt={requestData.selectedPropertyDetails.title}
                        className="h-24 w-32 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                        <Home className="h-8 w-8" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-display text-base font-bold text-foreground">
                        {requestData.selectedPropertyDetails.title}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {requestData.selectedPropertyDetails.city}
                        {requestData.selectedPropertyDetails.area ? ` · ${requestData.selectedPropertyDetails.area}` : ""}
                      </p>
                      <p className="text-sm font-bold text-primary pt-1">
                        {requestData.selectedPropertyDetails.pricing?.price} DT
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}/ {requestData.selectedPropertyDetails.pricing?.pricePeriod === "month" ? "mois" : "semaine"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Capacité max : <strong>{requestData.selectedPropertyDetails.guests || 1} pers.</strong>
                    </span>
                    <a
                      href={`/properties/${requestData.selectedPropertyDetails.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      Voir la fiche du logement ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Requirements Summary */}
              <div className="mt-6 space-y-3 rounded-xl bg-surface p-5 text-xs">
                <h3 className="font-display text-sm font-bold text-foreground border-b border-border pb-2">
                  Synthèse du besoin client
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block">Téléphone :</span>
                    <span className="font-semibold text-foreground">{customerPhone || "Non renseigné"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Destination :</span>
                    <span className="font-semibold text-foreground">{requestData.destination || requestData.area || "Non précisé"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Dates souhaitées :</span>
                    <span className="font-semibold text-foreground">
                      {requestData.checkIn || requestData.period} → {requestData.checkOut || "Flexible"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Voyageurs :</span>
                    <span className="font-semibold text-foreground">{requestData.guests || requestData.people || 1} pers.</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Budget max :</span>
                    <span className="font-semibold text-foreground">
                      {requestData.budget ? `${requestData.budget} DT / ${requestData.budgetPeriod || "semaine"}` : "Non précisé"}
                    </span>
                  </div>
                  {requestData.university && (
                    <div>
                      <span className="text-muted-foreground block">Université :</span>
                      <span className="font-semibold text-foreground">{requestData.university}</span>
                    </div>
                  )}
                </div>

                {requestData.amenities?.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-muted-foreground block font-medium">Équipements :</span>
                    <p className="mt-1 font-medium text-foreground">
                      {requestData.amenities.join(", ")}
                    </p>
                  </div>
                )}

                {requestData.message && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" /> Message du voyageur :
                    </span>
                    <p className="mt-1 font-medium text-foreground italic bg-card p-3 rounded-lg border border-border">
                      « {requestData.message} »
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Status Control, Contact Access, Internal Notes & Proposal */}
          <div className="space-y-6 lg:col-span-5">
            {/* Status & Contact Control Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
              {/* Workflow Status Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Statut de la demande
                </label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  value={requestData.status || requestData.stage || "PENDING"}
                  onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
                >
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {requestData.propertyId && requestData.status !== "CONFIRMED" && (
                  <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                    Passer le statut à &quot;CONFIRMED&quot; bloquera automatiquement ce logement pour les dates {requestData.checkIn} → {requestData.checkOut}.
                  </p>
                )}
                {requestData.propertyId && requestData.status === "CONFIRMED" && (
                  <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Logement réservé sur ces dates ({requestData.checkIn} → {requestData.checkOut}).
                  </p>
                )}
              </div>

              {/* Admin Contact Access Control Panel */}
              <div className="overflow-hidden rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Accès coordonnées au propriétaire
                  </span>
                  {requestData.contactAccessOverride?.enabled ? (
                    <span className="text-[0.68rem] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded">
                      Dérogation Admin active
                    </span>
                  ) : (
                    <span className="text-[0.68rem] bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded">
                      Masquées par défaut
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {requestData.contactAccessOverride?.enabled ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 space-y-2 text-emerald-900 dark:text-emerald-200">
                      <div className="font-semibold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                        <Unlock className="h-4 w-4 text-emerald-600" />
                        <span>Coordonnées déverrouillées</span>
                      </div>
                      <p className="text-[0.72rem] text-muted-foreground">
                        Motif : « {requestData.contactAccessOverride.reason} »
                      </p>
                      <button
                        type="button"
                        onClick={handleAdminRelockContact}
                        disabled={relockingLoading}
                        className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-xs hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                        {relockingLoading ? "Verrouillage…" : "Verrouiller à nouveau"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-2 text-amber-900 dark:text-amber-200">
                      <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <span>Coordonnées masquées au propriétaire</span>
                      </div>
                      <p className="text-[0.72rem] text-muted-foreground">
                        Le propriétaire n&apos;a pas accès aux coordonnées avant la validation du paiement.
                      </p>
                      <button
                        onClick={() => {
                          setUnlockReason("");
                          setUnlockError(null);
                          setUnlockModalOpen(true);
                        }}
                        className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary-dark transition-colors"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Déverrouiller les coordonnées
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes internes (confidentielles)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Client contacté sur WhatsApp, cherche proche plage, propriétaire M. Hedi informé..."
                  className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button
                  type="button"
                  disabled={savingNote}
                  onClick={handleSaveNotes}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" /> {savingNote ? "Enregistrement..." : "Enregistrer la note"}
                </button>
              </div>
            </div>

            {/* Proposal Submission Panel */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <Building className="h-4 w-4 text-primary" /> Proposer un logement au client
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Renseignez l&apos;identifiant du bien (ex: <code>h1</code> ou slug <code>villa-hiboun-piscine</code>). Le client pourra le visualiser et accepter la proposition.
              </p>

              <form onSubmit={handleAddProposal} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground">Identifiant ou Slug du bien *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: h1 ou villa-hiboun-piscine"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    value={propId}
                    onChange={(e) => setPropId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground">Tarif proposé (DT optionnel)</label>
                  <input
                    type="number"
                    placeholder="ex: 1200"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    value={propPrice}
                    onChange={(e) => setPropPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground">Message pour le client (optionnel)</label>
                  <textarea
                    rows={2}
                    placeholder="ex: Cette villa est disponible pour vos dates, située à 3 min à pied de la plage..."
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    value={propMsg}
                    onChange={(e) => setPropMsg(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingProposal || !propId.trim()}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sendingProposal ? "Envoi en cours..." : "Transmettre la proposition au client"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Unlock Modal Confirmation Dialog */}
      {unlockModalOpen && requestData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Unlock className="h-5 w-5 text-primary" />
                Déverrouiller les coordonnées ?
              </h3>
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Vous êtes sur le point d&apos;autoriser l&apos;accès aux coordonnées du client pour cette réservation.
              Le propriétaire pourra consulter le numéro de téléphone et l&apos;adresse e-mail.
              Cette action sera enregistrée dans l&apos;historique administratif.
            </p>

            {unlockError && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                {unlockError}
              </div>
            )}

            <div className="mt-4 space-y-1.5 text-xs">
              <label className="font-semibold text-foreground">
                Motif du déverrouillage <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Ex: Demande d'intervention support de la part du propriétaire..."
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                disabled={unlockingLoading}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface/80"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAdminUnlockContact}
                disabled={unlockingLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-xs hover:bg-primary-dark disabled:opacity-50"
              >
                {unlockingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Déverrouillage…
                  </>
                ) : (
                  "Déverrouiller"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
