"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BedDouble, Camera, Heart, MapPin, Star, Users } from "lucide-react";
import type { House } from "@/lib/rentals/types";
import { formatPrice, getCoverImage } from "@/lib/rentals/types";
import { SafeImage } from "./SafeImage";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const FAV_KEY = "favorite-houses";

export function useFavorite(id: string) {
  const [fav, setFav] = useState(false);
  useEffect(() => {
    try {
      setFav((JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[]).includes(id));
    } catch {
      /* ignore */
    }
  }, [id]);
  const toggle = () => {
    try {
      const list = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      setFav(next.includes(id));
    } catch {
      setFav((v) => !v);
    }
  };
  return [fav, toggle] as const;
}

export function HouseCard({ house }: { house: House }) {
  const cover = getCoverImage(house);
  const [fav, toggleFav] = useFavorite(house.id);
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <Link href={`/houses/${house.slug }`} aria-label={house.title} className="block h-full">
          <SafeImage
            src={cover?.url}
            alt={cover?.alt ?? house.title}
            width={800}
            height={600}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={fav ? t.card.unfavorite : t.card.favorite}
          className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card transition-transform active:scale-90"
        >
          <Heart className={cn("h-[1.1rem] w-[1.1rem]", fav && "fill-accent text-accent")} />
        </button>
        {house.images.length > 1 && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-foreground/70 px-2.5 py-1 text-[0.7rem] font-medium text-background">
            <Camera className="h-3 w-3" /> {house.images.length}
          </span>
        )}
      </div>

      <Link href={`/houses/${house.slug }`} className="mt-3 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-display text-[0.98rem] text-foreground">{house.title}</h3>
          {house.rating !== null && house.reviewCount > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm text-foreground">
              <Star className="h-3.5 w-3.5 fill-foreground" /> {house.rating.toFixed(1)}
              <span className="text-muted-foreground">({house.reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 text-xs font-medium text-primary">{t.card.new}</span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {house.location}, {house.city}
        </p>
        <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t.card.guests(house.guests)}</span>
          <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {t.card.bedrooms(house.bedrooms)}</span>
        </p>
        <p className="mt-2 text-foreground">
          <span className="font-semibold">{formatPrice(house.pricePerNight)} DT</span>{" "}
          <span className="text-sm text-muted-foreground">{t.card.perNight}</span>
        </p>
      </Link>
    </article>
  );
}

export function HouseCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
      <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}

export function HouseGrid({
  houses,
  isLoading,
  isError,
  emptyText,
  errorText,
}: {
  houses: House[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  emptyText: string;
  errorText?: string;
}) {
  const grid = "grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  if (isLoading)
    return <div className={grid}>{Array.from({ length: 4 }, (_, i) => <HouseCardSkeleton key={i} />)}</div>;
  if (isError)
    return <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">{errorText}</p>;
  if (!houses?.length)
    return <p className="rounded-lg border border-dashed border-border bg-sand p-8 text-center text-muted-foreground">{emptyText}</p>;
  return <div className={grid}>{houses.map((h) => <HouseCard key={h.id} house={h} />)}</div>;
}
