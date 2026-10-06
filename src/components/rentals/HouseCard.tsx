"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bath, BedDouble, Camera, Heart, MapPin, Star, Users } from "lucide-react";
import type { House } from "@/lib/rentals/types";
import { formatPrice, getCoverImage } from "@/lib/rentals/types";
import { SafeImage } from "./SafeImage";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics/client";

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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav();
    trackEvent(fav ? "property_unfavorited" : "property_favorited", {
      propertyId: house.id,
      city: house.city,
      rentalCategory: house.rentalCategory,
      propertyType: house.propertyType,
      forceTrack: true,
    });
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/75 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <Link href={`/houses/${house.slug}`} aria-label={house.title} className="block h-full w-full">
          <SafeImage
            src={cover?.url}
            alt={cover?.alt ?? house.title}
            width={800}
            height={600}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 z-10">
          {house.availabilityStatus === "RESERVED" && (
            <span className="rounded-md bg-amber-500/95 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              Réservée
            </span>
          )}
          {house.rentalCategory && (
            <span className="rounded-md bg-card/90 px-2 py-0.5 text-[0.7rem] font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {house.rentalCategory === "summer" ? "Été" : house.rentalCategory === "student" ? "Étudiant" : house.rentalCategory}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-pressed={fav}
          aria-label={fav ? t.card.unfavorite : t.card.favorite}
          className="absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-card hover:scale-105 active:scale-95"
        >
          <Heart className={cn("h-4 w-4 transition-colors", fav ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
        </button>

        {house.images?.length > 1 && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-foreground/75 px-2.5 py-0.5 text-[0.7rem] font-medium text-background backdrop-blur-sm">
            <Camera className="h-3 w-3" /> {house.images.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={`/houses/${house.slug}`} className="flex flex-1 flex-col justify-between gap-2.5">
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground line-clamp-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {house.location ? `${house.location}, ${house.city}` : house.city}
            </p>

            <h3 className="mt-1 font-display text-[1.05rem] font-semibold leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {house.title}
            </h3>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
              {house.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5 shrink-0" /> {t.card.bedrooms(house.bedrooms)}
                </span>
              )}
              {house.guests > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 shrink-0" /> {t.card.guests(house.guests)}
                </span>
              )}
              {house.bathrooms > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 shrink-0" /> {house.bathrooms} sdb.
                </span>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-3">
            <div>
              <span className="font-display text-lg font-bold text-foreground">
                {formatPrice(house.pricePerNight)} DT
              </span>{" "}
              <span className="text-xs text-muted-foreground">/ {t.card.perNight}</span>
            </div>

            {house.rating !== null && house.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>{house.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-[0.7rem]">({house.reviewCount})</span>
              </span>
            ) : (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[0.75rem] font-semibold text-primary">
                {t.card.new}
              </span>
            )}
          </div>
        </Link>
      </div>
    </article>
  );
}

export function HouseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm animate-pulse">
      <div className="aspect-4/3 w-full bg-muted" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="pt-2 border-t border-border/40 flex justify-between items-center">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
        </div>
      </div>
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
  const grid = "grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  if (isLoading)
    return <div className={grid}>{Array.from({ length: 8 }, (_, i) => <HouseCardSkeleton key={i} />)}</div>;
  if (isError)
    return <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">{errorText}</p>;
  if (!houses?.length)
    return <p className="rounded-lg border border-dashed border-border bg-sand p-8 text-center text-muted-foreground">{emptyText}</p>;
  return <div className={grid}>{houses.map((h) => <HouseCard key={h.id} house={h} />)}</div>;
}
