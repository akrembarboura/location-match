"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { OwnerPropertyForm } from "@/components/properties/OwnerPropertyForm";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/owner/properties/${id}`);
        if (!res.ok) {
          throw new Error("Impossible de charger les données du bien.");
        }
        const data = await res.json();
        setProperty(data);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (error || !property) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl py-12 px-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error || "Bien introuvable."}</p>
          </div>
          <Link
            href="/owner"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mes biens
          </Link>
        </div>
      </PageShell>
    );
  }

  if (property.status !== "DRAFT" && property.status !== "REJECTED") {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl py-12 px-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h2 className="font-display text-xl font-bold text-foreground">
            Modification impossible pour le moment
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Ce bien est actuellement {property.status === "PUBLISHED" ? "publié" : "en cours d'examen"}. 
            Seuls les biens en brouillon ou nécessitant des corrections peuvent être modifiés directement.
          </p>
          <Link
            href={`/owner/properties/${id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            Consulter l'annonce
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <OwnerPropertyForm initialData={property} isEditing={true} />
    </PageShell>
  );
}

