"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/rentals/request-schema";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Calendar,
  MapPin,
  Home,
  Users,
  Send,
  Save,
  MessageSquare,
  Building,
} from "lucide-react";

export default function AdminRequests() {
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Proposal Form State
  const [propId, setPropId] = useState("");
  const [propPrice, setPropPrice] = useState("");
  const [propMsg, setPropMsg] = useState("");
  const [sendingProposal, setSendingProposal] = useState(false);

  const fetchAdminRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        const data = await res.json();
        setRequestsList(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
          setNoteText(data[0].adminNotes || "");
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  const selectedReq = requestsList.find((r) => r.id === selectedId) || requestsList[0];

  useEffect(() => {
    if (selectedReq) {
      setNoteText(selectedReq.adminNotes || "");
    }
  }, [selectedId]);

  const handleStatusChange = async (newStatus: RequestStatus) => {
    if (!selectedReq) return;
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatusMessage(`Statut mis à jour : ${newStatus}`);
        setRequestsList((prev) =>
          prev.map((r) => (r.id === selectedReq.id ? { ...r, status: newStatus } : r))
        );
        await fetchAdminRequests();
      } else {
        const d = await res.json().catch(() => ({}));
        setStatusMessage(d.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setStatusMessage("Erreur réseau lors de la mise à jour");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReq) return;
    setSavingNote(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: noteText }),
      });

      if (res.ok) {
        setStatusMessage("Notes internes enregistrées.");
        setRequestsList((prev) =>
          prev.map((r) => (r.id === selectedReq.id ? { ...r, adminNotes: noteText } : r))
        );
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !propId.trim()) return;
    setSendingProposal(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${selectedReq.id}/proposals`, {
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
        await fetchAdminRequests();
      } else {
        const d = await res.json();
        setStatusMessage(d.error || "Erreur lors de l'ajout");
      }
    } finally {
      setSendingProposal(false);
    }
  };

  return (
    <AdminShell
      title="Gestion des demandes"
      subtitle={`${requestsList.length} demandes de location enregistrées`}
    >
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Chargement des demandes...
        </div>
      ) : requestsList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg text-foreground">Aucune demande reçue pour le moment</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Les demandes des clients pour l'été ou les logements étudiants s'afficheront ici en temps réel.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Left Column: Request List */}
          <div className="space-y-3">
            {requestsList.map((q) => {
              const isSelected = q.id === selectedReq?.id;
              const customerName = q.customer?.fullName || q.customer || "Client inconnu";
              const customerPhone = q.customer?.phone || q.phone;
              const dest = q.destination || q.area || "Non précisé";

              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  className={`w-full rounded-lg border bg-card p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {q.id}
                      </span>
                      {q.propertyId && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Réservation directe
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {q.status || q.stage || "PENDING"}
                    </span>
                  </div>

                  <p className="mt-2 font-display text-base font-bold text-foreground">
                    {customerName}
                  </p>

                  {q.selectedPropertyDetails?.title && (
                    <p className="text-xs font-medium text-primary line-clamp-1">
                      Logement : {q.selectedPropertyDetails.title}
                    </p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {dest}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {q.guests || q.people || 1} pers.
                    </span>
                    <span className="font-medium text-foreground">
                      {q.budget ? `${q.budget} DT` : "Budget libre"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Dates : {q.checkIn || q.period} → {q.checkOut || "flexible"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Request Details & Action Panel */}
          {selectedReq && (
            <aside className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{selectedReq.id}</span>
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {selectedReq.customer?.fullName || selectedReq.customer}
                    </h2>
                  </div>
                  <a
                    href={`tel:${selectedReq.customer?.phone || selectedReq.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    <Phone className="h-3.5 w-3.5" /> Appeler
                  </a>
                </div>

                {statusMessage && (
                  <div className="mt-4 rounded-md bg-primary/10 p-2.5 text-xs font-medium text-primary">
                    {statusMessage}
                  </div>
                )}

                {/* Direct Property Reservation Details */}
                {selectedReq.selectedPropertyDetails && (
                  <div className="mt-5 overflow-hidden rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Demande de réservation directe
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          selectedReq.selectedPropertyDetails.availabilityStatus === "RESERVED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Bien : {selectedReq.selectedPropertyDetails.availabilityStatus}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-3">
                      {selectedReq.selectedPropertyDetails.coverImage ? (
                        <img
                          src={selectedReq.selectedPropertyDetails.coverImage}
                          alt={selectedReq.selectedPropertyDetails.title}
                          className="h-16 w-20 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                          <Home className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-display text-sm font-bold text-foreground">
                          {selectedReq.selectedPropertyDetails.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {selectedReq.selectedPropertyDetails.city}
                          {selectedReq.selectedPropertyDetails.area ? ` · ${selectedReq.selectedPropertyDetails.area}` : ""}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-primary">
                          {selectedReq.selectedPropertyDetails.pricing?.price} DT
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {" "}/ {selectedReq.selectedPropertyDetails.pricing?.pricePeriod === "month" ? "mois" : "semaine"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
                      <span>Capacité max : <strong>{selectedReq.selectedPropertyDetails.guests || 1} pers.</strong></span>
                      {" · "}
                      <a
                        href={`/properties/${selectedReq.selectedPropertyDetails.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        Voir la fiche du logement ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* Workflow Status Selector */}
                <div className="mt-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Statut de la demande
                  </label>
                  <select
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    value={selectedReq.status || selectedReq.stage || "PENDING"}
                    onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
                  >
                    {REQUEST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {selectedReq.propertyId && selectedReq.status !== "CONFIRMED" && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Passer le statut à "CONFIRMED" bloquera automatiquement ce logement pour les dates {selectedReq.checkIn} → {selectedReq.checkOut}.
                    </p>
                  )}
                  {selectedReq.propertyId && selectedReq.status === "CONFIRMED" && (
                    <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                      ✓ Logement réservé sur ces dates ({selectedReq.checkIn} → {selectedReq.checkOut}).
                    </p>
                  )}
                </div>

                {/* Requirements Summary */}
                <div className="mt-6 space-y-2.5 rounded-lg bg-surface p-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone :</span>
                    <span className="font-semibold text-foreground">
                      {selectedReq.customer?.phone || selectedReq.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destination :</span>
                    <span className="font-semibold text-foreground">
                      {selectedReq.destination || selectedReq.area}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dates souhaitées :</span>
                    <span className="font-semibold text-foreground">
                      {selectedReq.checkIn || selectedReq.period} → {selectedReq.checkOut || "Flexible"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Voyageurs :</span>
                    <span className="font-semibold text-foreground">
                      {selectedReq.guests || selectedReq.people}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget max :</span>
                    <span className="font-semibold text-foreground">
                      {selectedReq.budget ? `${selectedReq.budget} DT / ${selectedReq.budgetPeriod || "semaine"}` : "Non précisé"}
                    </span>
                  </div>
                  {selectedReq.university && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Université :</span>
                      <span className="font-semibold text-foreground">{selectedReq.university}</span>
                    </div>
                  )}
                  {selectedReq.amenities?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground">Équipements :</span>
                      <p className="mt-1 font-medium text-foreground">
                        {selectedReq.amenities.join(", ")}
                      </p>
                    </div>
                  )}
                  {selectedReq.message && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-primary" /> Message du voyageur :
                      </span>
                      <p className="mt-1 font-medium text-foreground italic">
                        « {selectedReq.message} »
                      </p>
                    </div>
                  )}
                </div>

                {/* Internal Admin Notes */}
                <div className="mt-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes internes (confidentielles)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Client contacté sur WhatsApp, cherche proche plage, propriétaire M. Hedi informé..."
                    className="mt-1.5 w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={savingNote}
                    onClick={handleSaveNotes}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
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
                  Renseignez l'identifiant du bien (ex: <code>h1</code> ou slug <code>villa-hiboun-piscine</code>). Le client pourra le visualiser et accepter la proposition.
                </p>

                <form onSubmit={handleAddProposal} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground">Identifiant ou Slug du bien *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: h1 ou villa-hiboun-piscine"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                      value={propId}
                      onChange={(e) => setPropId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground">Tarif proposé (DT optionnel)</label>
                    <input
                      type="number"
                      placeholder="ex: 1200"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                      value={propPrice}
                      onChange={(e) => setPropPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground">Message pour le client (optionnel)</label>
                    <textarea
                      rows={2}
                      placeholder="ex: Cette villa est disponible pour vos dates, située à 3 min à pied de la plage..."
                      className="mt-1 w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      value={propMsg}
                      onChange={(e) => setPropMsg(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingProposal || !propId.trim()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingProposal ? "Envoi en cours..." : "Transmettre la proposition au client"}
                  </button>
                </form>
              </div>
            </aside>
          )}
        </div>
      )}
    </AdminShell>
  );
}
