"use client";
import React from 'react';
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/PageShell";
import { SearchBar } from "@/components/rentals/SearchBar";
import { HouseGrid } from "@/components/rentals/HouseCard";
import { categoriesQuery, housesQuery } from "@/lib/rentals/api";
import type { HouseFilters } from "@/lib/rentals/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Search = { city?: string | undefined; category?: string | undefined; guests?: number | undefined; checkIn?: string | undefined; checkOut?: string | undefined };

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);



function HousesPage() {
  const searchParams = useSearchParams();
  const search = {
    city: searchParams.get("city") || undefined,
    category: searchParams.get("category") || undefined,
    guests: searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined,
    checkIn: searchParams.get("checkIn") || undefined,
    checkOut: searchParams.get("checkOut") || undefined
  };
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 10_000) : 1;
  const pageSize = 24;
  const filters: HouseFilters = { ...search, rentalCategory: "summer", page, limit: pageSize };
  const houses = useQuery(housesQuery(filters));
  const { data: categories = [] } = useQuery(categoriesQuery());
  const hasFilters = Object.values(search).some(Boolean);
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage === 1) params.delete("page");
    else params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/houses?${query}` : "/houses";
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div>
          <p className="eyebrow">LOC MAISON · CATALOGUE DES BIENS</p>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl text-foreground">
            {search.city ? `Logements disponibles à ${search.city}` : t.list.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Trouvez une location adaptée à vos critères parmi notre sélection de villas, dars et appartements en Tunisie.
          </p>
        </div>
        <div className="mt-6">
          <SearchBar key={JSON.stringify(search)} initial={search} />
        </div>
        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href="/houses"
            
            className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", !search.category ? "border-primary bg-primary-soft font-medium text-primary" : "border-border bg-card text-muted-foreground")}
          >
            {t.list.allCategories}
          </Link>
          {categories.filter((c: any) => c.rentalCategory === "summer").map((c: any) => (
            <Link
              key={c.id}
              href={`/houses?category=${c.id}`}
              className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", search.category === c.id ? "border-primary bg-primary-soft font-medium text-primary" : "border-border bg-card text-muted-foreground")}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="mb-6 mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {houses.data ? `${t.list.results(houses.data.properties.length)} · Page ${page}` : "\u00a0"}
          </p>
          {hasFilters && <Link href="/houses" className="text-sm font-medium text-primary hover:underline">{t.list.reset}</Link>}
        </div>
        <HouseGrid houses={houses.data?.properties} isLoading={houses.isLoading} isError={houses.isError} emptyText={t.list.empty} errorText={t.featured.error} />
        {houses.data && (page > 1 || houses.data.hasMore) && (
          <nav aria-label="Pagination des logements" className="mt-8 flex items-center justify-center gap-4">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                Précédent
              </Link>
            )}
            <span className="text-sm text-muted-foreground">Page {page}</span>
            {houses.data.hasMore && (
              <Link href={pageHref(page + 1)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                Suivant
              </Link>
            )}
          </nav>
        )}
      </div>
    </PageShell>
  );
}

export default function Page() { return <React.Suspense fallback={<div>Loading...</div>}><HousesPage /></React.Suspense>; }
