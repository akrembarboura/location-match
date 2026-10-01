/**
 * Data access for rentals. Components only use these query options.
 * To switch to a real backend, replace the bodies of the fetchers below
 * (e.g. with server functions) — no UI change needed.
 */
import { queryOptions } from "@tanstack/react-query";
import { mockCategories, mockDestinations, mockHouses } from "./mock";
import type { HouseFilters } from "./types";

function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  return aFrom < bTo && bFrom < aTo;
}

async function fetchHouses(filters: HouseFilters = {}) {
  return mockHouses.filter((h) => {
    if (!h.isPublished) return false;
    if (filters.rentalCategory && h.rentalCategory !== filters.rentalCategory) return false;
    if (filters.city && h.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.category && !h.categoryIds.includes(filters.category)) return false;
    if (filters.guests && h.guests < filters.guests) return false;
    if (filters.checkIn && filters.checkOut) {
      const { checkIn, checkOut } = filters;
      if (h.unavailable.some((r) => overlaps(checkIn, checkOut, r.from, r.to))) return false;
    }
    return true;
  });
}

export const housesQuery = (filters: HouseFilters = {}) =>
  queryOptions({ queryKey: ["houses", filters], queryFn: () => fetchHouses(filters) });

export const featuredHousesQuery = () =>
  queryOptions({
    queryKey: ["houses", "featured"],
    queryFn: async () =>
      (await fetchHouses({ rentalCategory: "summer" })).filter((h) => h.isFeatured).slice(0, 8),
  });

export const houseBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["house", slug],
    queryFn: async () => mockHouses.find((h) => h.slug === slug && h.isPublished) ?? null,
  });

export const destinationsQuery = () =>
  queryOptions({ queryKey: ["destinations"], queryFn: async () => mockDestinations });

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: async () => mockCategories });
