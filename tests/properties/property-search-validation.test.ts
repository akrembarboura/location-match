import { describe, expect, it } from "vitest";
import { PropertySearchSchema } from "@/server/validations/property";

describe("PropertySearchSchema", () => {
  it("accepts and coerces bounded search pagination and guest values", () => {
    const parsed = PropertySearchSchema.safeParse({
      guests: "20",
      page: "2",
      limit: "50",
      checkIn: "2026-07-12",
      checkOut: "2026-07-18",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({ guests: 20, page: 2, limit: 50 });
    }
  });

  it.each([
    { guests: "0" },
    { guests: "31" },
    { limit: "51" },
    { page: "0" },
    { checkIn: "2026-02-30" },
    { checkIn: "2026-07-20", checkOut: "2026-07-19" },
  ])("rejects invalid or out-of-range filters: %o", (filters) => {
    expect(PropertySearchSchema.safeParse(filters).success).toBe(false);
  });
});
