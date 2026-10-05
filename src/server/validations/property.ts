import { z } from "zod";
import { PROPERTY_STATUSES } from "@/lib/models";

export const PropertySearchSchema = z.object({
  rentalCategory: z.string().optional(),
  rentalCategories: z.array(z.string()).optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  features: z.array(z.string()).optional(),
  guests: z.coerce.number().int().min(1).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});
export type PropertySearchInput = z.infer<typeof PropertySearchSchema>;

export const PropertyImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("URL d'image invalide."),
  publicId: z.string().optional(),
  alt: z.string().optional(),
  sortOrder: z.number().optional().default(0),
});
export type PropertyImageInput = z.infer<typeof PropertyImageSchema>;

export const CreateOwnerPropertySchema = z.object({
  title: z
    .string({ required_error: "Le titre de l'annonce est obligatoire." })
    .trim()
    .min(3, "Le titre doit comporter au moins 3 caractères.")
    .max(120, "Le titre ne peut pas dépasser 120 caractères."),
  description: z.string().trim().optional().default(""),
  rentalCategory: z.enum(["summer", "student"]).default("summer"),
  rentalCategories: z.array(z.enum(["summer", "student"])).optional().default(["summer"]),
  propertyType: z.string().default("Appartement"),
  type: z.enum(["villa", "house", "apartment"]).or(z.string()).optional(),
  features: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  city: z.string().trim().min(2, "La ville est obligatoire.").default("Mahdia"),
  area: z.string().trim().min(2, "Le quartier est obligatoire."),
  address: z.string().trim().optional(),
  pricing: z
    .object({
      price: z.coerce.number().positive("Le prix doit être supérieur à 0."),
      pricePeriod: z.enum(["night", "week", "month"]).default("week"),
      currency: z.string().default("TND"),
    })
    .optional(),
  summerPrice: z.coerce.number().positive().optional(),
  studentPrice: z.coerce.number().positive().optional(),
  capacity: z
    .object({
      guests: z.coerce.number().int().min(1).default(1),
      bedrooms: z.coerce.number().int().min(0).default(1),
      bathrooms: z.coerce.number().int().min(1).default(1),
      surface: z.coerce.number().positive().optional(),
    })
    .optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(PropertyImageSchema).default([]),
  availability: z
    .object({
      availableFrom: z.string().optional(),
      availableTo: z.string().optional(),
    })
    .optional(),
  asDraft: z.boolean().optional().default(false),
});
export type CreateOwnerPropertyInput = z.infer<typeof CreateOwnerPropertySchema>;

export const UpdateOwnerPropertySchema = CreateOwnerPropertySchema.partial().extend({
  asDraft: z.boolean().optional(),
  resubmit: z.boolean().optional(),
});
export type UpdateOwnerPropertyInput = z.infer<typeof UpdateOwnerPropertySchema>;

export const RejectPropertySchema = z.object({
  rejectionReason: z
    .string({ required_error: "Le motif du refus est obligatoire." })
    .trim()
    .min(5, "Le motif du refus doit comporter au moins 5 caractères.")
    .max(500, "Le motif du refus ne peut pas dépasser 500 caractères."),
});
export type RejectPropertyInput = z.infer<typeof RejectPropertySchema>;

export const OnboardOwnerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est obligatoire."),
  phone: z.string().trim().min(8, "Le numéro de téléphone est obligatoire."),
  area: z.string().trim().optional(),
});
export type OnboardOwnerInput = z.infer<typeof OnboardOwnerSchema>;

export const PropertyReservationSchema = z
  .object({
    from: z.coerce.date({ invalid_type_error: "Date d'arrivée invalide." }),
    to: z.coerce.date({ invalid_type_error: "Date de départ invalide." }),
  })
  .refine((data) => data.from < data.to, {
    message: "La date d'arrivée doit être antérieure à la date de départ.",
    path: ["to"],
  });
export type PropertyReservationInput = z.infer<typeof PropertyReservationSchema>;

