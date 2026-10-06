"use client";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Building2, Castle, Check, Droplets, GraduationCap, Home as HomeIcon,
  KeyRound, MessageCircle, Search, ShieldCheck, Camera, Receipt, Phone, Users, Waves, MapPin,
} from "lucide-react";
import { PageShell, SectionHeading } from "@/components/site/PageShell";
import { SearchBar } from "@/components/rentals/SearchBar";
import { HouseGrid } from "@/components/rentals/HouseCard";
import { SafeImage } from "@/components/rentals/SafeImage";
import { categoriesQuery, destinationsQuery, featuredHousesQuery } from "@/lib/rentals/api";
import type { Category } from "@/lib/rentals/types";
import { t } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics/client";
const hero = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889819/location-match/hero.jpg";



const categoryIcons: Record<string, typeof HomeIcon> = {
  castle: Castle, home: HomeIcon, building: Building2, waves: Waves, users: Users, droplets: Droplets, graduation: GraduationCap,
};
const stepIcons = [Search, MessageCircle, KeyRound];
const trustIcons = [ShieldCheck, Camera, Receipt, Phone];

function CategoryChip({ c }: { c: Category }) {
  const Icon = categoryIcons[c.icon] ?? HomeIcon;
  const cls = "flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary";
  if (c.rentalCategory === "student")
    return <Link href="/student" className={cls}><Icon className="h-4 w-4" /> {c.label}</Link>;
  return <Link href={`/houses?category=${c.id }`} className={cls}><Icon className="h-4 w-4" /> {c.label}</Link>;
}

const CURATED_DESTINATIONS = [
  {
    id: "zone-touristique",
    slug: "zone-touristique",
    name: "Zone Touristique",
    city: "Mahdia",
    governorate: "Mahdia",
    badge: "Bord de mer",
    propertyCount: 14,
    startingPrice: 190,
    pricePeriod: "nuit",
    propertyTypes: "Villas vue mer · S+2 · Résidences",
    tags: ["Pieds dans l'eau", "Climatisé", "Vue mer"],
    tagline: "Villas de standing et résidences balnéaires avec accès direct aux plages.",
    imageUrl: hero,
    href: "/houses?category=beach",
  },
  {
    id: "hiboun",
    slug: "hiboun",
    name: "Hiboun & Corniche",
    city: "Mahdia",
    governorate: "Mahdia",
    badge: "Familial & Calme",
    propertyCount: 9,
    startingPrice: 180,
    pricePeriod: "nuit",
    propertyTypes: "Grandes villas · Jardins · Piscines",
    tags: ["Piscine privée", "Jardin", "Grand standing"],
    tagline: "Quartier résidentiel calme avec grandes cours et proximité des plages.",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889822/location-match/prop-1.jpg",
    href: "/houses?category=villa",
  },
  {
    id: "medina",
    slug: "medina",
    name: "Médina & Skifa",
    city: "Mahdia",
    governorate: "Mahdia",
    badge: "Charme & Histoire",
    propertyCount: 6,
    startingPrice: 150,
    pricePeriod: "nuit",
    propertyTypes: "Dars authentiques · Patios · Rooftops",
    tags: ["Architecture typique", "Patio frais", "Centre historique"],
    tagline: "Dars traditionnelles restaurées et maisons au cœur du patrimoine historique.",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889824/location-match/prop-3.jpg",
    href: "/houses?category=house",
  },
  {
    id: "rejiche",
    slug: "rejiche",
    name: "Rejiche & Salakta",
    city: "Mahdia",
    governorate: "Mahdia",
    badge: "Plage & Sérénité",
    propertyCount: 8,
    startingPrice: 140,
    pricePeriod: "nuit",
    propertyTypes: "Maisons de pêcheur · S+1 · S+2",
    tags: ["Accès plage", "Calme absolu", "Terrasse vue mer"],
    tagline: "Criques sauvages, sérénité maritime et maisons de vacances les pieds dans le sable.",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889823/location-match/prop-2.jpg",
    href: "/houses?category=beach",
  },
];

const POPULAR_SEARCH_TAGS = [
  { label: "Zone Touristique (Plage)", href: "/houses?category=beach" },
  { label: "Villas avec piscine Hiboun", href: "/houses?category=villa" },
  { label: "Dars de la Médina", href: "/houses?category=house" },
  { label: "Bord de mer Rejiche & Salakta", href: "/houses?category=beach" },
  { label: "Logements étudiants FSEG", href: "/student" },
  { label: "Sélection d'été", href: "/summer" },
];

function Home() {
  const featured = useQuery(featuredHousesQuery());
  const { data: destinations = [] } = useQuery(destinationsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());

  // Merge API destinations with curated zones to ensure a balanced, information-rich 4-card grid
  const displayDestinations = (() => {
    if (!destinations || destinations.length === 0) return CURATED_DESTINATIONS;
    return CURATED_DESTINATIONS.map((curated) => {
      const match = (destinations as any[]).find(
        (d: any) =>
          d.id === curated.id ||
          d.slug === curated.slug ||
          d.name?.toLowerCase() === curated.name.toLowerCase()
      );
      if (!match) return curated;
      return {
        ...curated,
        propertyCount: match.propertyCount || curated.propertyCount,
        startingPrice: match.startingPrice || curated.startingPrice,
        pricePeriod: match.pricePeriod || curated.pricePeriod,
        propertyTypes: match.propertyTypes || curated.propertyTypes,
        imageUrl: match.imageUrl || match.image || curated.imageUrl,
        tagline: match.tagline || curated.tagline,
      };
    });
  })();

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={hero} alt="" width={1600} height={1008} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-foreground/55 via-foreground/35 to-background" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/85">{t.hero.eyebrow}</p>
          <h1 className="mt-3 max-w-2xl font-display text-[2.1rem] leading-[1.1] text-primary-foreground sm:text-5xl">{t.hero.title}</h1>
          <p className="mt-4 max-w-lg text-[1.02rem] leading-relaxed text-primary-foreground/90">{t.hero.subtitle}</p>
          <div className="mt-8 sm:mt-12"><SearchBar /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <h2 className="sr-only">{t.categories.title}</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c: any) => <CategoryChip key={c.id} c={c} />)}
        </div>
      </section>

      {/* Featured Properties (Section 33) */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow={t.featured.eyebrow}
            title={t.featured.title}
            description={t.featured.description}
          />
          <Link
            href="/houses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline"
          >
            {t.featured.seeAll} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <HouseGrid
          houses={featured.data}
          isLoading={featured.isLoading}
          isError={featured.isError}
          emptyText={t.featured.empty}
          errorText={t.featured.error}
        />
      </section>

      {/* Destinations & Neighborhoods Marketplace Section */}
      <section className="border-y border-border/70 bg-sand/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow={t.destinations.eyebrow}
              title={t.destinations.title}
              description={t.destinations.description}
            />
            <Link
              href="/houses"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline"
            >
              {t.destinations.seeAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayDestinations.map((d) => (
              <Link
                key={d.id}
                href={d.href || { pathname: "/houses", query: { city: d.city || d.name } }}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-raised"
              >
                {/* Visual Header */}
                <div className="relative aspect-16/11 w-full overflow-hidden bg-muted">
                  <SafeImage
                    src={d.imageUrl}
                    alt={d.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top Badges: Category & Active listings */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    {d.badge && (
                      <span className="rounded-md bg-card/95 px-2.5 py-0.5 text-[0.7rem] font-bold tracking-tight text-foreground shadow-xs backdrop-blur-xs">
                        {d.badge}
                      </span>
                    )}
                    {d.propertyCount && (
                      <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[0.68rem] font-bold tracking-tight text-primary-foreground shadow-xs">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {d.propertyCount} annonces
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                    <p className="flex items-center gap-1 text-[0.72rem] font-medium text-white/80">
                      <MapPin className="h-3 w-3 shrink-0 text-primary-soft" />
                      {d.city || d.governorate} · Tunisie
                    </p>
                    <h3 className="mt-0.5 font-display text-[1.15rem] font-bold leading-tight text-white transition-colors group-hover:text-primary-soft">
                      {d.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body with High Information Density */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    {/* Price floor indicator */}
                    <div className="flex items-baseline justify-between border-b border-border/60 pb-2.5">
                      <span className="text-[0.72rem] font-medium uppercase tracking-wider text-muted-foreground">
                        Prix indicatif
                      </span>
                      <div className="text-right">
                        <span className="font-display text-base font-bold text-foreground">
                          {d.startingPrice} DT
                        </span>
                        <span className="text-[0.72rem] text-muted-foreground">
                          {" "}/ {d.pricePeriod}
                        </span>
                      </div>
                    </div>

                    {/* Typical property types */}
                    {d.propertyTypes && (
                      <p className="mt-2 text-[0.78rem] font-semibold text-foreground/90">
                        {d.propertyTypes}
                      </p>
                    )}

                    {/* Short description */}
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {d.tagline}
                    </p>

                    {/* Feature Chips */}
                    {d.tags && d.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {d.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 text-[0.68rem] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer CTA */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-primary">
                    <span>Explorer les logements</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Filter Navigation Bar */}
          <div className="mt-8 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="shrink-0 text-xs font-semibold text-foreground">
                Recherches fréquentes par quartier :
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <Link
                    key={tag.label}
                    href={tag.href}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHeading eyebrow={t.how.eyebrow} title={t.how.title} />
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {t.how.steps.map((s, i) => {
            const Icon = stepIcons[i] ?? Search;
            return (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base text-foreground">{i + 1}. {s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-10">
          <SectionHeading eyebrow={t.trust.eyebrow} title={t.trust.title} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.trust.items.map((item, i) => {
              const Icon = trustIcons[i] ?? ShieldCheck;
              return (
                <div key={item.title}>
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-display text-[0.98rem] text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Owner CTA + student */}
      <section className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl bg-primary-dark p-7 text-primary-foreground sm:p-10">
          <p className="font-display text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/75">{t.owner.eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl">{t.owner.title}</h2>
          <p className="mt-3 max-w-lg text-primary-foreground/85">{t.owner.body}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {t.owner.points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary-foreground/80" /> {p}</li>
            ))}
          </ul>
          <Link
            href="/owner/list-property"
            onClick={() => trackEvent("owner_cta_clicked")}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-lg bg-card px-6 font-display text-sm font-semibold text-primary transition-colors hover:bg-sand"
          >
            {t.owner.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-border bg-sand p-7 sm:p-10">
          <div>
            <GraduationCap className="h-7 w-7 text-primary" />
            <h2 className="mt-3 font-display text-xl text-foreground">{t.student.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.student.body}</p>
          </div>
          <Link href="/student" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            {t.student.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

export default Home;
