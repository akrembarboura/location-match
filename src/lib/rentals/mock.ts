/**
 * TEMPORARY demo data. Replace with database rows — shape is identical to
 * what the API returns. Image URLs are placeholders: swap `url` values for
 * your own photos (any number per house).
 */
const hero = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889819/location-match/hero.jpg";
const p1 = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889822/location-match/prop-1.jpg";
const p2 = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889823/location-match/prop-2.jpg";
const p3 = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889824/location-match/prop-3.jpg";
import type { Category, Destination, House, HouseImage } from "./types";

const pool = [p1, p2, p3, hero];

function imgs(houseId: string, count: number, alt: string, offset = 0): HouseImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${houseId}-img-${i + 1}`,
    url: (pool[(i + offset) % pool.length] ?? hero),
    alt: `${alt} — photo ${i + 1}`,
    position: i,
  }));
}

export const mockCategories: Category[] = [
  { id: "villa", slug: "villas", label: "Villas", rentalCategory: "summer", icon: "castle" },
  { id: "house", slug: "maisons", label: "Maisons", rentalCategory: "summer", icon: "home" },
  { id: "apartment", slug: "appartements", label: "Appartements", rentalCategory: "summer", icon: "building" },
  { id: "beach", slug: "bord-de-mer", label: "Pieds dans l'eau", rentalCategory: "summer", icon: "waves" },
  { id: "family", slug: "familles", label: "Pour familles", rentalCategory: "summer", icon: "users" },
  { id: "pool", slug: "piscine", label: "Avec piscine", rentalCategory: "summer", icon: "droplets" },
  { id: "student", slug: "etudiants", label: "Logement étudiant", rentalCategory: "student", icon: "graduation" },
];

export const mockDestinations: Destination[] = [
  {
    id: "zone-touristique",
    slug: "zone-touristique",
    name: "Zone Touristique",
    governorate: "Mahdia",
    imageUrl: hero,
    tagline: "Villas de standing et résidences balnéaires pieds dans l'eau",
    propertyCount: 14,
    startingPrice: 190,
    pricePeriod: "nuit",
    propertyTypes: "Villas vue mer · S+2 · Résidences",
    badge: "Bord de mer",
    tags: ["Pieds dans l'eau", "Climatisé", "Vue mer"],
    href: "/houses?category=beach",
  },
  {
    id: "hiboun",
    slug: "hiboun",
    name: "Hiboun & Corniche",
    governorate: "Mahdia",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889822/location-match/prop-1.jpg",
    tagline: "Quartier familial calme à proximité immédiate des plages",
    propertyCount: 9,
    startingPrice: 180,
    pricePeriod: "nuit",
    propertyTypes: "Grandes villas · Jardins · Piscines",
    badge: "Familial & Calme",
    tags: ["Piscine privée", "Jardin", "Grand standing"],
    href: "/houses?category=villa",
  },
  {
    id: "medina",
    slug: "medina",
    name: "Médina & Skifa",
    governorate: "Mahdia",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889824/location-match/prop-3.jpg",
    tagline: "Dars traditionnelles restaurées et maisons au cœur historique",
    propertyCount: 6,
    startingPrice: 150,
    pricePeriod: "nuit",
    propertyTypes: "Dars authentiques · Patios · Rooftops",
    badge: "Charme & Histoire",
    tags: ["Architecture typique", "Patio frais", "Centre historique"],
    href: "/houses?category=house",
  },
  {
    id: "rejiche",
    slug: "rejiche",
    name: "Rejiche & Salakta",
    governorate: "Mahdia",
    imageUrl: "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889823/location-match/prop-2.jpg",
    tagline: "Cadre maritime sauvage, tranquillité et criques préservées",
    propertyCount: 8,
    startingPrice: 140,
    pricePeriod: "nuit",
    propertyTypes: "Maisons de pêcheur · S+1 · S+2",
    badge: "Plage & Sérénité",
    tags: ["Accès direct plage", "Calme absolu", "Terrasse vue mer"],
    href: "/houses?category=beach",
  },
];

type Seed = Omit<House, "images" | "coverImageId" | "currency" | "isPublished" | "unavailable"> & {
  imageCount: number;
};

const seeds: Seed[] = [
  { id: "h1", slug: "villa-hiboun-piscine", title: "Villa avec piscine à Hiboun", description: "Grande villa familiale à 3 minutes à pied de la plage de Hiboun. Jardin, piscine privée, cuisine équipée et terrasse pour les dîners d'été.", location: "Hiboun", city: "Mahdia", governorate: "Mahdia", rentalCategory: "summer", pricePerNight: 420, guests: 8, bedrooms: 4, bathrooms: 3, propertyType: "Villa", categoryIds: ["villa", "pool", "family"], amenities: ["Piscine", "Climatisation", "Wi-Fi", "Parking", "Jardin", "Barbecue"], rating: 4.8, reviewCount: 23, isFeatured: true, imageCount: 7 },
  { id: "h2", slug: "s2-corniche-mahdia", title: "S+2 vue mer sur la corniche", description: "Appartement lumineux au 2e étage, balcon face à la mer, à deux pas des cafés de la corniche.", location: "Zone touristique", city: "Mahdia", governorate: "Mahdia", rentalCategory: "summer", pricePerNight: 190, guests: 5, bedrooms: 2, bathrooms: 1, propertyType: "Appartement", categoryIds: ["apartment", "beach"], amenities: ["Vue mer", "Climatisation", "Wi-Fi", "Balcon"], rating: 4.6, reviewCount: 41, isFeatured: true, imageCount: 5 },
  { id: "h3", slug: "maison-medina-mahdia", title: "Maison traditionnelle près de Skifa Kahla", description: "Dar rénovée avec patio, au cœur de la médina. Calme, fraîche l'été, plage à 6 minutes.", location: "Médina", city: "Mahdia", governorate: "Mahdia", rentalCategory: "summer", pricePerNight: 230, guests: 6, bedrooms: 3, bathrooms: 2, propertyType: "Maison", categoryIds: ["house", "family"], amenities: ["Patio", "Climatisation", "Wi-Fi", "Terrasse"], rating: null, reviewCount: 0, isFeatured: true, imageCount: 3, offset: 2 } as Seed,
  { id: "h4", slug: "villa-rejiche-plage", title: "Villa pieds dans l'eau à Rejiche", description: "Accès direct à la plage de Rejiche, grande terrasse et salon d'été. Idéale pour les grandes familles.", location: "Rejiche", city: "Mahdia", governorate: "Mahdia", rentalCategory: "summer", pricePerNight: 550, guests: 10, bedrooms: 5, bathrooms: 3, propertyType: "Villa", categoryIds: ["villa", "beach", "family"], amenities: ["Accès plage", "Climatisation", "Parking", "Wi-Fi", "Terrasse"], rating: 4.9, reviewCount: 8, isFeatured: true, imageCount: 10 },
  { id: "h5", slug: "s1-salakta", title: "S+1 charmant à Salakta", description: "Résidence calme, à 5 minutes du petit port de Salakta.", location: "Salakta", city: "Mahdia", governorate: "Mahdia", rentalCategory: "summer", pricePerNight: 140, guests: 4, bedrooms: 1, bathrooms: 1, propertyType: "Appartement", categoryIds: ["apartment"], amenities: ["Climatisation", "Gardien"], rating: 4.3, reviewCount: 19, isFeatured: false, imageCount: 4 },
  { id: "h11", slug: "studio-etudiant-fseg-mahdia", title: "Studio meublé près de la FSEG", description: "Studio calme et meublé, à 7 minutes à pied de la FSEG. Loué pour l'année universitaire.", location: "Près FSEG", city: "Mahdia", governorate: "Mahdia", rentalCategory: "student", pricePerNight: 15, guests: 1, bedrooms: 1, bathrooms: 1, propertyType: "Studio", categoryIds: ["student"], amenities: ["Meublé", "Wi-Fi", "Machine à laver"], rating: null, reviewCount: 0, isFeatured: false, imageCount: 3 },
];

export const mockHouses: House[] = seeds.map(({ imageCount, ...s }) => {
  const offset = (s as { offset?: number }).offset ?? Number(s.id.slice(1)) % 4;
  const images = imgs(s.id, imageCount, s.title, offset);
  const { offset: _o, ...rest } = s as Seed & { offset?: number };
  void _o;
  return {
    ...rest,
    currency: "TND",
    isPublished: true,
    coverImageId: images[0]?.id ?? null,
    images,
    unavailable: [],
  };
});
