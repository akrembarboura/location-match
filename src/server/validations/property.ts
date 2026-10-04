import { z } from "zod";

export const PropertySearchSchema = z.object({
  rentalCategory: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  checkIn: z.string().optional(), // Should ideally be date, but mock is string
  checkOut: z.string().optional(),
});

export type PropertySearchInput = z.infer<typeof PropertySearchSchema>;
