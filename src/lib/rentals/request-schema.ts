import { z } from "zod";

/**
 * Normalizes Tunisian phone numbers to "+216XXXXXXXX" format.
 * Examples accepted:
 *   "+216 22 123 456" -> "+21622123456"
 *   "22 123 456"       -> "+21622123456"
 *   "22123456"        -> "+21622123456"
 *   "00216 98 123 456"-> "+21698123456"
 * Returns null if invalid.
 */
export function normalizeTunisianPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00216")) digits = digits.slice(5);
  else if (digits.startsWith("216") && digits.length === 11) digits = digits.slice(3);
  
  // 8 digits; mobile starts with 2, 4, 5, 9; fixed lines start with 3, 7
  if (!/^[2-579]\d{7}$/.test(digits)) return null;
  return `+216${digits}`;
}

export const TUNISIAN_DESTINATIONS = [
  "Mahdia",
  "Monastir",
  "Sousse",
  "Hammamet",
  "Djerba",
  "Bizerte",
  "Nabeul",
  "Autre",
] as const;

export const DESTINATION_AREAS: Record<string, string[]> = {
  Mahdia: [
    "Hiboun",
    "Zone Touristique",
    "Mahdia Ville",
    "Rejiche",
    "Chiba",
    "Baghdedi",
    "Près FSEG / Universités",
  ],
  Sousse: [
    "Sousse Médina",
    "Khzema",
    "Sahloul",
    "Bou Jaafar",
    "Port El Kantaoui",
    "Hammam Sousse",
    "Chott Meriem",
  ],
  Hammamet: [
    "Hammamet Nord",
    "Yasmine Hammamet",
    "Hammamet Sud",
    "Centre Ville",
    "Bir Bouregba",
  ],
  Monastir: [
    "Skanes",
    "Falaise",
    "Monastir Ville",
    "Sahline",
    "Khenis",
  ],
  Djerba: [
    "Zone Touristique",
    "Midoun",
    "Houmt Souk",
    "Aghir",
    "Ajim",
  ],
  Bizerte: [
    "Corniche",
    "Bizerte Ville",
    "Rimel",
    "Sidi Salem",
    "Zarzouna",
  ],
  Nabeul: [
    "Nabeul Plage",
    "Centre Ville",
    "Sidi Mahrsi",
    "El Mrazga",
    "Beni Khiar",
  ],
};

export const REQUEST_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "PROPERTY_PROPOSED",
  "CLIENT_CONFIRMATION",
  "CONFIRMED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PROPOSAL_STATUSES = [
  "PENDING_CLIENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

const phoneField = z
  .string()
  .trim()
  .min(1, "Le numéro de téléphone est obligatoire.")
  .transform((v, ctx) => {
    const normalized = normalizeTunisianPhone(v);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Numéro de téléphone invalide. Exemple : 22 123 456 ou +216 22 123 456.",
      });
      return z.NEVER;
    }
    return normalized;
  });

const fullName = z
  .string()
  .trim()
  .min(3, "Entrez votre nom et prénom (au moins 3 caractères).")
  .max(80, "Le nom est trop long.");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ).");

const baseSchema = z.object({
  fullName,
  phone: phoneField,
  amenities: z.array(z.string().max(60)).max(30).default([]),
});

export const SummerRequestSchema = baseSchema
  .extend({
    rentalCategory: z.literal("summer"),
    destination: z.string().trim().min(1, "Veuillez choisir une destination."),
    area: z.string().trim().optional(),
    flexibleLocation: z.boolean().default(false),
    propertyType: z.string().trim().optional(),
    bedrooms: z.string().trim().optional(),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int().min(1, "Au moins 1 voyageur.").max(30),
    budget: z.coerce.number().positive("Le budget doit être un nombre positif.").optional(),
    budgetPeriod: z.enum(["stay", "total", "week", "night"]).default("stay"),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    path: ["checkOut"],
    message: "La date de départ doit être postérieure à la date d'arrivée.",
  });

export const StudentRequestSchema = baseSchema.extend({
  rentalCategory: z.literal("student"),
  destination: z.string().trim().min(1, "Veuillez choisir une ville / destination."),
  university: z.string().trim().min(1, "Veuillez indiquer votre université."),
  checkIn: isoDate,
  checkOut: isoDate.optional(),
  students: z.coerce.number().int().min(1, "Au moins 1 étudiant.").max(12).default(1),
  budget: z.coerce.number().positive("Le budget mensuel doit être positif."),
  budgetPeriod: z.literal("month").default("month"),
  propertyType: z.string().trim().optional(),
  genderPreference: z.string().trim().optional(),
});

export const CreateRentalRequestSchema = z.union([
  SummerRequestSchema,
  StudentRequestSchema,
]);

export type SummerRequestInput = z.infer<typeof SummerRequestSchema>;
export type StudentRequestInput = z.infer<typeof StudentRequestSchema>;
export type CreateRentalRequestInput = z.infer<typeof CreateRentalRequestSchema>;
