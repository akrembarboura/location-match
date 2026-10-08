/**
 * Rental domain models. These mirror the future database/API shape exactly —
 * UI components depend only on these types, never on the mock data.
 */

export type PropertyType = "villa" | "house" | "apartment" | string;

export type PropertyFeature =
  | "beach"
  | "family"
  | "pool"
  | "parking"
  | "garden"
  | "sea_view"
  | "air_conditioning"
  | "wifi"
  | "terrace"
  | "pet_friendly"
  | string;

export type RentalCategory = "summer" | "student";

export type HouseImage = {
  id: string;
  url: string;
  alt: string;
  /** Display order; lowest first. */
  position: number;
  width?: number;
  height?: number;
};

export type House = {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** Neighbourhood / street-level location, e.g. "Hiboun, route de la corniche". */
  location: string;
  city: string;
  governorate: string;
  rentalCategory: RentalCategory;
  rentalCategories?: RentalCategory[];
  pricePerNight: number;
  pricing?: { price?: number; pricePeriod?: string; currency?: string };
  currency: "TND";
  guests: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  type?: PropertyType;
  categoryIds: string[];
  features?: PropertyFeature[];
  /** Image id of the cover; falls back to the first image. */
  coverImageId: string | null;
  images: HouseImage[];
  amenities: string[];
  rating: number | null;
  reviewCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  availabilityStatus?: "AVAILABLE" | "RESERVED";
  reservation?: { from: string; to: string } | null;
  /** Ranges already booked (ISO dates). Availability-ready. */
  unavailable: { from: string; to: string }[];
};

export type Destination = {
  id: string;
  slug: string;
  name: string;
  governorate: string;
  imageUrl: string | null;
  tagline: string;
  propertyCount?: number;
  startingPrice?: number;
  pricePeriod?: string;
  propertyTypes?: string;
  badge?: string;
  tags?: string[];
  href?: string;
};

export type Category = {
  id: string;
  slug: string;
  label: string;
  rentalCategory: RentalCategory;
  icon: string;
};

export type HouseFilters = {
  city?: string;
  category?: string;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  rentalCategory?: RentalCategory;
  page?: number;
  limit?: number;
};

export function getCoverImage(house: House): HouseImage | undefined {
  const sorted = sortImages(house.images);
  return sorted.find((i) => i.id === house.coverImageId) ?? sorted[0];
}

export function sortImages(images: HouseImage[]): HouseImage[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(value);
}
