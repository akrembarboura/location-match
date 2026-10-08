"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { AsyncStateContainer } from "@/components/shared/AsyncStateContainer";
import { PropertyModerationBadge } from "@/components/properties/PropertyModerationBadge";
import { formatDT } from "@/lib/utils";
import { withCallbackUrl } from "@/lib/auth/redirect";
import {
  Building2,
  PlusCircle,
  Loader2,
  AlertCircle,
  Phone,
  Lock,
  CheckCircle2,
  CalendarDays,
  Clock,
  CreditCard,
  LogIn,
  ArrowRight,
} from "lucide-react";

export default function OwnerPage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer onboarding state
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const isCustomer = user?.role === "CUSTOMER";
  const isOwnerOrAdmin =
    user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (user?.phone) {
      setOnboardingPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !isOwnerOrAdmin) return;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/owner/overview");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Impossible de charger votre tableau de bord.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [isAuthenticated, isOwnerOrAdmin]);

  // 1. Loading auth state
  if (authLoading) {
    return (
      <OwnerShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OwnerShell>
    );
  }

  // 2. Anonymous Visitor State
  if (!isAuthenticated) {
    const registerHref = withCallbackUrl("/register", "/owner/list-property");
    const loginHref = withCallbackUrl("/login", "/owner");

    return (
      <OwnerShell title="Publier votre bien sur LOC MAISON">
        <div className="mx-auto max-w-4xl py-12 text-center space-y-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Vous avez un logement à louer en Tunisie ?
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Proposez vos villas, appartements ou maisons aux estivants et étudiants. Notre équipe qualifie et sécurise chaque location.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={registerHref}
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark"
            >
              Créer mon compte propriétaire
            </Link>
            <Link
              href={loginHref}
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-surface"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Link>
          </div>
        </div>
      </OwnerShell>
    );
  }

  // 3. Customer Onboarding Transition State
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

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || "Impossible d'activer votre espace propriétaire.");
        }

        await refreshUser();
      } catch (err: any) {
        setOnboardingError(err.message || "Une erreur est survenue.");
      } finally {
        setOnboardingLoading(false);
      }
    }

    return (
      <OwnerShell title="Activer mon espace propriétaire">
        <div className="mx-auto max-w-xl py-12">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <Building2 className="h-7 w-7" />
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Proposer un logement sur LOC MAISON
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Continuez avec votre compte ({user?.email}) pour gérer vos logements.
            </p>

            {onboardingError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive text-left">
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
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={onboardingLoading}
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {onboardingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activation…
                  </>
                ) : (
                  <>
                    Activer mon compte propriétaire
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </OwnerShell>
    );
  }

  // 4. Owner Dashboard State
  const displayName = user?.firstName || "Propriétaire";
  const kpis = data?.kpis || {};
  const today = data?.today || {};
  const upcomingArrivals = data?.upcomingArrivals || [];
  const upcomingDepartures = data?.upcomingDepartures || [];
  const propertiesList = data?.properties || [];

  return (
    <OwnerShell
      title={`Bonjour, ${displayName}`}
      subtitle="Voici l'état de vos locations et activités opérationnelles."
    >
      <AsyncStateContainer
        isLoading={loading}
        loadingText="Chargement des données de votre espace propriétaire…"
        isError={Boolean(error)}
        errorMessage={error || undefined}
        onRetry={() => {
          setLoading(true);
          setError(null);
          fetch("/api/owner/overview")
            .then((res) => {
              if (!res.ok) throw new Error("Impossible de charger votre tableau de bord.");
              return res.json();
            })
            .then((json) => setData(json))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        }}
      >
        <div className="space-y-8">
          {/* Quick Actions Bar */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Link
              href="/owner/list-property"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 hover:border-primary/50 transition-colors shadow-2xs group"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Ajouter un bien</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Créer une annonce</span>
              </div>
            </Link>

            <Link
              href="/owner/calendar"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 hover:border-primary/50 transition-colors shadow-2xs group"
            >
              <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Calendrier</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Planning & Arrivées</span>
              </div>
            </Link>

            <Link
              href="/owner/payments"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 hover:border-primary/50 transition-colors shadow-2xs group"
            >
              <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Paiements</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Encaissements</span>
              </div>
            </Link>

            <Link
              href="/owner/requests"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 hover:border-primary/50 transition-colors shadow-2xs group"
            >
              <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-foreground block truncate">Demandes</span>
                <span className="text-[0.7rem] text-muted-foreground hidden sm:block">Réservations reçues</span>
              </div>
            </Link>
          </div>
          {/* SECTION 22: DASHBOARD TODAY SUMMARY BOX */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              Aujourd&apos;hui — Aperçu rapide
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-medium">
              <div className="rounded-xl border border-border/60 bg-surface/60 p-3 flex flex-col items-center text-center">
                <span className="text-emerald-700 dark:text-emerald-400 text-lg font-bold font-display">{today.available || 0}</span>
                <span className="text-muted-foreground mt-0.5">Disponibles</span>
              </div>
              <div className="rounded-xl border border-border/60 bg-surface/60 p-3 flex flex-col items-center text-center">
                <span className="text-foreground text-lg font-bold font-display">{today.rented || 0}</span>
                <span className="text-muted-foreground mt-0.5">Loués</span>
              </div>
              <div className="rounded-xl border border-border/60 bg-surface/60 p-3 flex flex-col items-center text-center">
                <span className="text-amber-700 dark:text-amber-400 text-lg font-bold font-display">{today.arrivalsToday || 0}</span>
                <span className="text-muted-foreground mt-0.5">Arrivées</span>
              </div>
              <div className="rounded-xl border border-border/60 bg-surface/60 p-3 flex flex-col items-center text-center">
                <span className="text-sky-700 dark:text-sky-400 text-lg font-bold font-display">{today.departuresToday || 0}</span>
                <span className="text-muted-foreground mt-0.5">Départs</span>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/60 bg-surface/60 p-3 flex flex-col items-center text-center">
                <span className="text-amber-700 dark:text-amber-400 text-lg font-bold font-display">{today.paymentsPending || 0}</span>
                <span className="text-muted-foreground mt-0.5">Soldes en attente</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: REAL DATABASE KPI CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Mes biens</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1">{kpis.totalProperties || 0}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Disponibles</span>
                <p className="text-2xl font-bold font-display text-emerald-700 dark:text-emerald-400 mt-1">{kpis.availableProperties || 0}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Actuellement loués</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1">{kpis.rentedProperties || 0}</p>
              </div>
              <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4.5 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Paiements à recevoir</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1">{formatDT(kpis.paymentsToReceive || 0)} DT</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* SECTION 11: ARRIVALS / DEPARTURES */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Prochaines arrivées */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  Prochaines arrivées
                </h3>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-surface text-muted-foreground border border-border/50">
                  {upcomingArrivals.length} arrivée(s)
                </span>
              </div>

              {upcomingArrivals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Aucune arrivée prévue cette semaine.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingArrivals.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground block">{item.propertyTitle}</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                          <span>Client : <strong className="text-foreground">{item.customerName}</strong> ({item.guests} pers.)</span>
                          {item.contactVisibility === "RELEASED" ? (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="h-3 w-3" /> Contact dispo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              <Lock className="h-3 w-3" /> Masqué
                            </span>
                          )}
                        </div>
                        <span className="block font-mono text-[0.7rem] text-primary mt-1">{item.formattedRange}</span>
                      </div>
                      <Link
                        href="/owner/calendar"
                        className="rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        Voir
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prochains départs */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
                  Prochains départs
                </h3>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-surface text-muted-foreground border border-border/50">
                  {upcomingDepartures.length} départ(s)
                </span>
              </div>

              {upcomingDepartures.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Aucun départ prévu cette semaine.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDepartures.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground block">{item.propertyTitle}</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                          <span>Client : <strong className="text-foreground">{item.customerName}</strong> ({item.guests} pers.)</span>
                          {item.contactVisibility === "RELEASED" ? (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="h-3 w-3" /> Contact dispo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              <Lock className="h-3 w-3" /> Masqué
                            </span>
                          )}
                        </div>
                        <span className="block font-mono text-[0.7rem] text-primary mt-1">{item.formattedRange}</span>
                      </div>
                      <Link
                        href="/owner/calendar"
                        className="rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        Voir
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: OWNER PROPERTY OVERVIEW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Mes biens</h2>
              <Link href="/owner/properties" className="text-xs font-semibold text-primary hover:underline">
                Tout voir ({propertiesList.length}) →
              </Link>
            </div>

            {propertiesList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card">
                <p className="text-sm text-muted-foreground">Vous n&apos;avez pas encore de logement enregistré.</p>
                <Link
                  href="/owner/list-property"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Ajouter une annonce
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {propertiesList.slice(0, 3).map((prop: any) => (
                  <div key={prop.id} className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={prop.coverImage}
                        alt={prop.title}
                        className="h-16 w-20 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[0.7rem] text-muted-foreground block">{prop.propertyType} • {prop.city}</span>
                        <h4 className="font-bold text-sm text-foreground truncate">{prop.title}</h4>
                        <span className="text-xs font-semibold text-primary mt-1 block">
                          {formatDT(prop.price)} DT / {prop.pricePeriod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                      <PropertyModerationBadge status={prop.status} />
                      <div className="flex items-center gap-2">
                        <Link href={`/owner/properties/${prop.id}/availability`} className="text-xs font-semibold text-primary hover:underline">
                          Disponibilités
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AsyncStateContainer>
    </OwnerShell>
  );
}
