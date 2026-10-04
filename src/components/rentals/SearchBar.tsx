"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { destinationsQuery } from "@/lib/rentals/api";
import { t } from "@/lib/i18n";

export type SearchValues = { city?: string | undefined; checkIn?: string | undefined; checkOut?: string | undefined; guests?: number | undefined };

export function SearchBar({ initial = {} }: { initial?: SearchValues }) {
  const navigate = useRouter();
  const { data: destinations = [] } = useQuery(destinationsQuery());
  const [city, setCity] = useState(initial.city ?? "");
  const [checkIn, setCheckIn] = useState(initial.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial.checkOut ?? "");
  const [guests, setGuests] = useState(initial.guests ?? 2);

  const cell = "flex flex-col gap-0.5 px-4 py-2.5 text-left";
  const label = "text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";
  const input = "w-full bg-transparent text-[0.95rem] text-foreground outline-none";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (city) params.set("city", city);
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        if (guests) params.set("guests", guests.toString());
        navigate.push(`/houses?${params.toString()}`);
      }}
      className="grid overflow-hidden rounded-xl border border-border bg-card shadow-raised sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] lg:items-center"
    >
      <label className={`${cell} border-b border-border sm:col-span-2 lg:col-span-1 lg:border-b-0 lg:border-r`}>
        <span className={label}>{t.search.where}</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={input}>
          <option value="">{t.search.anywhere}</option>
          {destinations.map((d: any) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </label>
      <label className={`${cell} border-b border-r border-border lg:border-b-0`}>
        <span className={label}>{t.search.checkIn}</span>
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={input} />
      </label>
      <label className={`${cell} border-b border-border lg:border-b-0 lg:border-r`}>
        <span className={label}>{t.search.checkOut}</span>
        <input type="date" value={checkOut} min={checkIn || undefined} onChange={(e) => setCheckOut(e.target.value)} className={input} />
      </label>
      <label className={`${cell} sm:col-span-2 lg:col-span-1`}>
        <span className={label}>{t.search.guests}</span>
        <input type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={input} />
      </label>
      <div className="p-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-display text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        >
          <Search className="h-4 w-4" /> {t.search.submit}
        </button>
      </div>
    </form>
  );
}
