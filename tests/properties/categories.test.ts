import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import { PropertyModel, UserModel } from "@/lib/models";
import { propertyService } from "@/server/services/PropertyService";
import { mapPropertyToPublicDTO } from "@/server/dtos/property";

describe("LOC MAISON Multi-Category Classification System", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    await PropertyModel.deleteMany({});
  });

  it("allows a single property to belong to multiple relevant categories (Type + Features + Rental Category)", async () => {
    const propertyData = {
      id: "PROP-VILLA-CORNICHE",
      slug: "villa-corniche-mahdia",
      ownerId: "owner-123",
      title: "Villa Corniche Mahdia",
      description: "Superbe villa pieds dans l'eau avec piscine privée pour grandes familles.",
      rentalCategory: "summer",
      rentalCategories: ["summer"],
      propertyType: "Villa",
      type: "villa",
      features: ["beach", "family", "pool"],
      categoryIds: ["villa", "beach", "family", "pool"],
      city: "Mahdia",
      area: "Corniche",
      location: {
        country: "Tunisie",
        city: "Mahdia",
        area: "Corniche",
        address: "Route de la Corniche",
      },
      pricing: { price: 3500, pricePeriod: "week", currency: "TND" },
      capacity: { guests: 10, bedrooms: 4, bathrooms: 3 },
      guests: 10,
      bedrooms: 4,
      bathrooms: 3,
      amenities: ["Piscine", "Pieds dans l'eau", "Wi-Fi", "Climatisation"],
      images: [{ id: "img-1", url: "https://example.com/villa.jpg" }],
      status: "PUBLISHED",
      isPublished: true,
    };

    await PropertyModel.create(propertyData);

    // Verify DTO structure
    const doc = await PropertyModel.findOne({ id: "PROP-VILLA-CORNICHE" }).lean().exec();
    const dto = mapPropertyToPublicDTO(doc);

    expect(dto.type).toBe("villa");
    expect(dto.features).toContain("beach");
    expect(dto.features).toContain("family");
    expect(dto.features).toContain("pool");
    expect(dto.rentalCategories).toContain("summer");

    // 1. Discoverable via /houses?category=villa
    const villaResults = await propertyService.searchProperties({ category: "villa", rentalCategory: "summer" });
    expect(villaResults.some((p) => p.id === "PROP-VILLA-CORNICHE")).toBe(true);

    // 2. Discoverable via /houses?category=beach
    const beachResults = await propertyService.searchProperties({ category: "beach", rentalCategory: "summer" });
    expect(beachResults.some((p) => p.id === "PROP-VILLA-CORNICHE")).toBe(true);

    // 3. Discoverable via /houses?category=family
    const familyResults = await propertyService.searchProperties({ category: "family", rentalCategory: "summer" });
    expect(familyResults.some((p) => p.id === "PROP-VILLA-CORNICHE")).toBe(true);

    // 4. Discoverable via /houses?category=pool
    const poolResults = await propertyService.searchProperties({ category: "pool", rentalCategory: "summer" });
    expect(poolResults.some((p) => p.id === "PROP-VILLA-CORNICHE")).toBe(true);
  });

  it("handles student housing separately as a dedicated rental category", async () => {
    const studentProp = {
      id: "PROP-STUDENT-01",
      slug: "studio-etudiant-fseg",
      ownerId: "owner-456",
      title: "Studio meublé FSEG",
      rentalCategory: "student",
      rentalCategories: ["student"],
      propertyType: "Studio",
      type: "apartment",
      features: ["wifi", "study_desk"],
      categoryIds: ["apartment", "student"],
      city: "Mahdia",
      area: "Près FSEG",
      status: "PUBLISHED",
      isPublished: true,
    };

    await PropertyModel.create(studentProp);

    const studentResults = await propertyService.searchProperties({ rentalCategory: "student" });
    expect(studentResults.some((p) => p.id === "PROP-STUDENT-01")).toBe(true);
  });

  it("never returns unpublished properties when filtering by guest capacity", async () => {
    await PropertyModel.create({
      id: "PROP-DRAFT-HIGH-CAPACITY",
      title: "Brouillon privé",
      status: "DRAFT",
      isPublished: false,
      guests: 10,
      capacity: { guests: 10 },
    });
    await PropertyModel.create({
      id: "PROP-PUBLISHED-HIGH-CAPACITY",
      title: "Villa publiée",
      status: "PUBLISHED",
      isPublished: true,
      guests: 10,
      capacity: { guests: 10 },
    });

    const results = await propertyService.searchProperties({ guests: 4 });
    const resultIds = results.map((property) => property.id);

    expect(resultIds).toContain("PROP-PUBLISHED-HIGH-CAPACITY");
    expect(resultIds).not.toContain("PROP-DRAFT-HIGH-CAPACITY");
  });
});
