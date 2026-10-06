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
    name: "Zone Touristique",
    city: "Mahdia",
    tag: "Bord de mer",
    tagline: "Villas pieds dans l'eau et résidences balnéaires de standing",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889819/location-match/hero.jpg",
  },
  {
    id: "hiboun",
    name: "Hiboun & Corniche",
    city: "Mahdia",
    tag: "Familial & Calme",
    tagline: "Grandes villas avec jardin à quelques pas des plages de sable fin",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889822/location-match/prop-1.jpg",
  },
  {
    id: "medina",
    name: "Médina & Skifa",
    city: "Mahdia",
    tag: "Charme & Tradition",
    tagline: "Dars traditionnelles rénovées au cœur du patrimoine historique",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889824/location-match/prop-3.jpg",
  },
  {
    id: "rejiche",
    name: "Rejiche & Salakta",
    city: "Mahdia",
    tag: "Nature & Tranquillité",
    tagline: "Criques sauvages, sérénité et cadre maritime authentique",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889823/location-match/prop-2.jpg",
  },
];

function Home() {
  const featured = useQuery(featuredHousesQuery());
  const { data: destinations = [] } = useQuery(destinationsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());

  // Merge API destinations with curated zones to ensure a balanced, information-rich 4-card grid
  const displayDestinations = (() => {
    if (!destinations || destinations.length === 0) return CURATED_DESTINATIONS;
    if (destinations.length >= 4) {
      return destinations.map((d: any) => ({
        id: d.id || d.slug || d.name,
        name: d.name,
        city: d.city || "Mahdia",
        tag: d.tag || "Destination phare",
        tagline: d.tagline || "Sélection de logements d'exception",
        imageUrl: d.imageUrl || d.image || hero,
      }));
    }
    const existingNames = new Set(destinations.map((d: any) => d.name?.toLowerCase()));
    const additional = CURATED_DESTINATIONS.filter((c) => !existingNames.has(c.name.toLowerCase()));
    const adaptedApi = destinations.map((d: any) => ({
      id: d.id || d.slug || d.name,
      name: d.name,
      city: d.city || "Mahdia",
      tag: "Top destination",
      tagline: d.tagline || "Sélection de logements d'exception",
      imageUrl: d.imageUrl || d.image || hero,
    }));
    return [...adaptedApi, ...additional].slice(0, 4);
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

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={t.featured.eyebrow} title={t.featured.title} />
          <Link href="/houses" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
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

      {/* Destinations & Top Neighborhoods */}
      <section className="border-y border-border/70 bg-sand/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Destinations & Quartiers"
              title="Où poser vos valises à Mahdia ?"
              description="Explorez les quartiers côtiers et les zones les plus recherchées pour vos vacances d'été ou vos études."
            />
            <Link
              href="/houses"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Voir tous les logements <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayDestinations.map((d: any) => (
              <Link
                key={d.id}
                href={{ pathname: "/houses", query: { city: d.city || d.name } }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-raised"
              >
                {/* Image Container with high-density card styling */}
                <div className="relative aspect-16/11 w-full overflow-hidden bg-muted">
                  <SafeImage
                    src={d.imageUrl || d.image || hero}
                    alt={d.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

                  {d.tag && (
                    <span className="absolute left-3 top-3 rounded-md bg-card/90 backdrop-blur-sm px-2.5 py-0.5 text-[0.7rem] font-semibold text-foreground shadow-xs">
                      {d.tag}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                    <p className="flex items-center gap-1 text-[0.72rem] font-medium text-white/80">
                      <MapPin className="h-3 w-3 shrink-0 text-primary-soft" />
                      {d.city ? `${d.city} · Tunisie` : "Mahdia · Tunisie"}
                    </p>
                    <h3 className="mt-0.5 font-display text-[1.1rem] font-bold leading-tight text-white group-hover:text-primary-soft transition-colors">
                      {d.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {d.tagline || "Sélection de villas et appartements vérifiés par l'équipe LOC MAISON."}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs font-semibold text-primary">
                    <span>Explorer les offres</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
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
