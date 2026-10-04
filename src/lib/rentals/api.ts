/**
 * Data access for rentals. Components only use these query options.
 * To switch to a real backend, replace the bodies of the fetchers below
 * (e.g. with server functions) — no UI change needed.
 */
import { queryOptions } from "@tanstack/react-query";
import type { HouseFilters } from "./types";

export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // vercel
  return `http://localhost:${process.env.PORT ?? 3000}`; // local server
}

async function fetchHouses(filters: HouseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.rentalCategory) params.append("rentalCategory", filters.rentalCategory);
  if (filters.city) params.append("city", filters.city);
  if (filters.category) params.append("category", filters.category);
  if (filters.guests) params.append("guests", filters.guests.toString());
  if (filters.checkIn) params.append("checkIn", filters.checkIn);
  if (filters.checkOut) params.append("checkOut", filters.checkOut);

  const res = await fetch(`${getBaseUrl()}/api/properties?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

export const housesQuery = (filters: HouseFilters = {}) =>
  queryOptions({ queryKey: ["houses", filters], queryFn: () => fetchHouses(filters) });

export const featuredHousesQuery = () =>
  queryOptions({
    queryKey: ["houses", "featured"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/properties/featured`);
      if (!res.ok) throw new Error("Failed to fetch featured properties");
      return res.json();
    },
  });

export const houseBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["house", slug],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/properties/${slug}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch property");
      }
      return res.json();
    },
  });

export const destinationsQuery = () =>
  queryOptions({ 
    queryKey: ["destinations"], 
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/destinations`);
      if (!res.ok) throw new Error("Failed to fetch destinations");
      return res.json();
    } 
  });

export const categoriesQuery = () =>
  queryOptions({ 
    queryKey: ["categories"], 
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    } 
  });

