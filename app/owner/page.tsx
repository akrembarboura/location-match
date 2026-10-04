"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { formatDT } from "@/lib/utils";
import { withCallbackUrl } from "@/lib/auth/redirect";
import {
  Building2,
  PlusCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Users,
  Wallet,
  ArrowRight,
  Edit,
  Phone,
  CheckCircle2,
} from "lucide-react";

const perks = [
  {
    icon: Users,
    t: "Deux saisons, une annonce",
    d: "Les estivants de juin à septembre, les étudiants pour l'année universitaire.",
  },
  {
    icon: ShieldCheck,
    t: "Locataires vérifiés",
    d: "Nous vérifions chaque profil avant de transmettre votre contact.",
  },
  {
    icon: Wallet,
    t: "Gratuit pour publier",
    d: "Ajoutez vos photos et vos prix. Aucuns frais tant que votre bien n'est pas loué.",
  },
];

export default function OwnerPage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer onboarding transition state
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const isCustomer = user?.role === "CUSTOMER";
  const isOwnerOrAdmin =
    user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Pre-fill phone if available
  useEffect(() => {
    if (user?.phone) {
      setOnboardingPhone(user.phone);
    }
  }, [user]);

  // Fetch properties only for owners / admins
  useEffect(() => {
    if (!isAuthenticated || !isOwnerOrAdmin) return;

    async function fetchOwnerProperties() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/owner/properties");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Impossible de charger vos biens.");
        }
        const data = await res.json();
        setProperties(data || []);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }

    fetchOwnerProperties();
  }, [isAuthenticated, isOwnerOrAdmin]);

  // Loading state
  if (authLoading) {
    return (
      <PageShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  // =========================================================================
  // STATE A — Anonymous Visitor
  // =========================================================================
  if (!isAuthenticated) {
    const registerHref = withCallbackUrl("/register", "/owner/list-property");
    const loginHref = withCallbackUrl("/login", "/owner");

    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
          <p className="eyebrow">Publier votre bien</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Vous avez un logement à louer ?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Ajoutez votre maison, appartement ou villa sur LOC MAISON.
            Notre équipe vérifie chaque annonce avant sa publication.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={registerHref}
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark"
            >
              Créer mon compte
            </Link>
            <Link
              href={loginHref}
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-surface"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-3 text-left">
            {perks.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-border bg-card p-6 shadow-2xs">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-base font-semibold text-foreground">{t}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  // =========================================================================
  // STATE F — Logged-in Customer (Owner Onboarding Transition)
  // =========================================================================
  if (isCustomer) {
    async function handleCustomerOnboard(e: React.FormEvent) {
      e.preventDefault();
      try {
        setOnboardingLoading(true);
        setOnboardingError(null);

        const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email?.split("@")[0] || "Propriétaire";
        const phone = onboardingPhone.trim() || user?.phone || "20000000";

        if (phone.length < 8) {
          setOnboardingError("Veuillez indiquer un numéro de téléphone valide (au moins 8 chiffres).");
          setOnboardingLoading(false);
          return;
        }

        const res = await fetch("/api/owner/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            phone,
            area: "Mahdia",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Impossible d'activer votre espace propriétaire.");
        }

        // Refresh session user so role becomes OWNER in auth context
        await refreshUser();
        router.push("/owner/list-property");
      } catch (err: any) {
        setOnboardingError(err.message || "Une erreur est survenue.");
      } finally {
        setOnboardingLoading(false);
      }
    }

    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
              <Building2 className="h-7 w-7" />
            </div>

            <p className="eyebrow">Publier votre bien</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
              Vous souhaitez proposer un logement sur LOC MAISON ?
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Continuez avec votre compte actuel ({user?.email}) pour créer votre annonce.
            </p>

            {onboardingError && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-left text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{onboardingError}</p>
              </div>
            )}

            <form onSubmit={handleCustomerOnboard} className="mt-6 text-left space-y-4">
              <div>
                <label htmlFor="owner-phone" className="block text-xs font-medium text-foreground mb-1">
                  Numéro de téléphone de contact
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="owner-phone"
                    type="tel"
                    placeholder="22 123 456"
                    value={onboardingPhone}
                    onChange={(e) => setOnboardingPhone(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  Ce numéro servira à notre équipe pour vérifier votre logement.
                </p>
              </div>

              <button
                type="submit"
                disabled={onboardingLoading}
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {onboardingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activation en cours…
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </PageShell>
    );
  }

  // =========================================================================
  // STATE D & E — Logged-in Owner / Admin
  // =========================================================================
  const displayName = user?.firstName || "Propriétaire";

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Simple Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <p className="eyebrow">Mon espace</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
              Bonjour {displayName} 👋
            </h1>
          </div>

          <Link
            href="/owner/list-property"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter une annonce
          </Link>
        </div>

        {/* Content */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Chargement de vos annonces…</p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          ) : properties.length === 0 ? (
            /* STATE D — Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Vous n&apos;avez pas encore d&apos;annonce.
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Présentez votre logement aux personnes qui cherchent une location en Tunisie.
              </p>
              <Link
                href="/owner/list-property"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Ajouter une annonce
              </Link>
            </div>
          ) : (
            /* STATE E — Owner with Properties */
            <div className="space-y-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {properties.length === 1 ? "Votre annonce" : "Mes annonces"}
              </h2>

              <div className="space-y-4">
                {properties.map((property) => {
                  const cover = property.images?.[0]?.url || "/placeholder-property.jpg";
                  const isRejected = property.status === "REJECTED";
                  const isDraft = property.status === "DRAFT";

                  return (
                    <div
                      key={property.id}
                      className="overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative aspect-4/3 w-full sm:w-44 sm:h-32 overflow-hidden rounded-lg border border-border bg-surface shrink-0">
                          <img
                            src={cover}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded bg-background/85 px-1.5 py-0.5 text-[0.65rem] font-semibold text-foreground backdrop-blur">
                            {property.images?.length || 0} photo{(property.images?.length || 0) > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Property Details */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{property.propertyType}</span>
                            <span>•</span>
                            <span>
                              {property.city} {property.area ? `(${property.area})` : ""}
                            </span>
                          </div>

                          <h3 className="font-display text-base font-semibold text-foreground truncate">
                            {property.title}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            <span className="font-semibold text-foreground text-sm">
                              {formatDT(property.pricing?.price || 0)} DT
                            </span>
                            <span>
                              / {property.pricing?.pricePeriod === "month" ? "mois" : "semaine"}
                            </span>
                            <span>•</span>
                            <span>{property.capacity?.bedrooms || 1} ch.</span>
                            <span>•</span>
                            <span>{property.capacity?.guests || 1} pers.</span>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                          <PropertyModerationBadge status={property.status} />

                          <div className="flex items-center gap-2 mt-1">
                            <Link
                              href={`/owner/properties/${property.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface/80 transition-colors"
                            >
                              Voir mon annonce
                              <ArrowRight className="h-3 w-3" />
                            </Link>

                            {(isDraft || isRejected) && (
                              <Link
                                href={`/owner/properties/${property.id}/edit`}
                                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                              >
                                <Edit className="h-3 w-3" />
                                Modifier
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rejection Motif Banner */}
                      {isRejected && property.moderation?.rejectionReason && (
                        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold">Motif du refus : </span>
                            <span>{property.moderation.rejectionReason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
