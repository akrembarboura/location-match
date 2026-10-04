"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bath, BedDouble, Check, Heart, MapPin, Star, Users } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { HouseGallery } from "@/components/rentals/HouseGallery";
import { useFavorite } from "@/components/rentals/HouseCard";
import { houseBySlugQuery } from "@/lib/rentals/api";
import { formatPrice } from "@/lib/rentals/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";



function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">{t.detail.notFound}</h1>
        <Link href="/houses" className="mt-4 inline-block text-primary underline">{t.detail.back}</Link>
      </div>
    </PageShell>
  );
}

function HouseDetail() {
  const { slug } = useParams() as { slug: string };
  const { data: house } = useSuspenseQuery(houseBySlugQuery(slug));
  const [fav, toggleFav] = useFavorite(house?.id ?? "");
  if (!house) return <NotFound />;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">{house.title}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {house.location}, {house.city} · {house.governorate}</span>
              {house.rating !== null && house.reviewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-foreground"><Star className="h-4 w-4 fill-foreground" /> {house.rating.toFixed(1)} · {t.card.reviews(house.reviewCount)}</span>
              )}
            </p>
          </div>
          <button type="button" onClick={toggleFav} aria-pressed={fav} aria-label={fav ? t.card.unfavorite : t.card.favorite}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card">
            <Heart className={cn("h-5 w-5", fav && "fill-accent text-accent")} />
          </button>
        </div>

        <HouseGallery images={house.images} className="mt-5" aspect="aspect-[4/3] sm:aspect-[16/9]" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-6 text-sm text-foreground">
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {t.card.guests(house.guests)}</span>
              <span className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" /> {t.card.bedrooms(house.bedrooms)}</span>
              <span className="inline-flex items-center gap-2"><Bath className="h-4 w-4 text-primary" /> {t.detail.bathrooms(house.bathrooms)}</span>
              <span className="rounded bg-surface px-2 py-0.5 text-muted-foreground">{house.propertyType}</span>
            </div>
            <h2 className="mt-6 font-display text-lg text-foreground">{t.detail.about}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{house.description}</p>
            <h2 className="mt-8 font-display text-lg text-foreground">{t.detail.amenities}</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {house.amenities.map((a: string) => (
                <li key={a} className="flex items-center gap-2 text-sm text-foreground"><Check className="h-4 w-4 text-primary" /> {a}</li>
              ))}
            </ul>
          </div>
          <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24">
            <p className="text-foreground">
              <span className="font-display text-2xl">{formatPrice(house.pricePerNight)} DT</span>{" "}
              <span className="text-muted-foreground">{t.card.perNight}</span>
            </p>
            <Link href="/request/summer" className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-primary font-display text-sm font-semibold text-primary-foreground hover:bg-primary-dark">
              {t.detail.request}
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t.detail.requestHint}</p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

export default HouseDetail;
