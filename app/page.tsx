"use client";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Building2, Castle, Check, Droplets, GraduationCap, Home as HomeIcon,
  KeyRound, MessageCircle, Search, ShieldCheck, Camera, Receipt, Phone, Users, Waves,
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

function Home() {
  const featured = useQuery(featuredHousesQuery());
  const { data: destinations = [] } = useQuery(destinationsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());

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

      {/* Destinations */}
      <section className="border-y border-border bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeading eyebrow={t.destinations.eyebrow} title={t.destinations.title} />
          <div className="-mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-4">
            {destinations.map((d: any, i: number) => (
              <Link
                key={d.id}
                href={{ pathname: "/houses", query: { city: d.name } }}
                className={`group relative block w-[70%] shrink-0 snap-start overflow-hidden rounded-lg sm:w-auto ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
              >
                <div className={`${i === 0 ? "aspect-3/4 sm:aspect-auto sm:h-full" : "aspect-3/4 sm:aspect-4/3"}`}>
                  <SafeImage src={d.imageUrl ?? ""} alt={d.name} className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-lg text-primary-foreground">{d.name}</p>
                  <p className="text-sm text-primary-foreground/85">{d.tagline}</p>
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
