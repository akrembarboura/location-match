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
  const filters: HouseFilters = { ...search, rentalCategory: "summer" };
  const houses = useQuery(housesQuery(filters));
  const { data: categories = [] } = useQuery(categoriesQuery());
  const hasFilters = Object.values(search).some(Boolean);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl text-foreground">{search.city ? `${t.list.title} à ${search.city}` : t.list.title}</h1>
        <div className="mt-5">
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
          <p className="text-sm text-muted-foreground">{houses.data ? t.list.results(houses.data.length) : "\u00a0"}</p>
          {hasFilters && <Link href="/houses" className="text-sm font-medium text-primary hover:underline">{t.list.reset}</Link>}
        </div>
        <HouseGrid houses={houses.data} isLoading={houses.isLoading} isError={houses.isError} emptyText={t.list.empty} errorText={t.featured.error} />
      </div>
    </PageShell>
  );
}

export default function Page() { return <React.Suspense fallback={<div>Loading...</div>}><HousesPage /></React.Suspense>; }
