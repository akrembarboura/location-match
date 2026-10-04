import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import {
  PropertyModel,
  HousingRequestModel,
  PropertyModerationEventModel,
  UserModel,
} from "@/lib/models";
import { authService } from "@/server/services/AuthService";
import { propertyService } from "@/server/services/PropertyService";
import { requestService } from "@/server/services/RequestService";
import { NextRequest } from "next/server";
import {
  POST as reserveProperty,
  PATCH as updateReservation,
  DELETE as releaseReservation,
} from "@/app/api/admin/properties/[id]/reservation/route";
import { POST as addProposal } from "@/app/api/admin/requests/[id]/proposals/route";
import { GET as getPublicProperties } from "@/app/api/properties/route";
import { GET as getPublicPropertyBySlug } from "@/app/api/properties/[slug]/route";

describe("Admin Property Reservation Status Feature", () => {
  const adminUser = {
    id: "admin-usr-999",
    email: "admin@locmaison.com",
    role: "ADMIN" as const,
    firstName: "System",
    lastName: "Admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const customerUser = {
    id: "cust-usr-555",
    email: "customer@locmaison.com",
    role: "CUSTOMER" as const,
    firstName: "Anis",
    lastName: "Ben Ali",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ownerUser = {
    id: "owner-usr-111",
    email: "owner@locmaison.com",
    role: "OWNER" as const,
    firstName: "Salah",
    lastName: "Trabelsi",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await PropertyModel.deleteMany({});
    await HousingRequestModel.deleteMany({});
    await PropertyModerationEventModel.deleteMany({});
  });

  async function createTestProperty(overrides: Partial<any> = {}) {
    return await PropertyModel.create({
      id: "PROP-TEST-001",
      slug: "villa-dar-ennour-mahdia-001",
      ownerId: ownerUser.id,
      title: "Villa Dar Ennour",
      description: "Superbe villa en bord de mer",
      rentalCategory: "summer",
      propertyType: "Villa",
      city: "Mahdia",
      area: "Hiboun",
      pricing: { price: 2000, pricePeriod: "week", currency: "TND" },
      capacity: { guests: 6, bedrooms: 3, bathrooms: 2 },
      images: [{ id: "img-1", url: "https://example.com/p1.jpg" }],
      status: "PUBLISHED",
      isPublished: true,
      availabilityStatus: "AVAILABLE",
      ...overrides,
    });
  }

  describe("1. Admin Reservation Authorization & Role Checks", () => {
    it("allows ADMIN to reserve a PUBLISHED property with a valid date range", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      await createTestProperty();

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-10T00:00:00.000Z",
          to: "2026-07-20T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.property.availabilityStatus).toBe("RESERVED");
      expect(data.property.reservation).toBeDefined();
      expect(data.property.reservation.from).toBe("2026-07-10T00:00:00.000Z");
      expect(data.property.reservation.to).toBe("2026-07-20T00:00:00.000Z");
      expect(data.property.reservation.updatedBy).toBe(adminUser.id);

      // Verify DB persistence
      const saved = await PropertyModel.findOne({ id: "PROP-TEST-001" });
      expect(saved?.availabilityStatus).toBe("RESERVED");
      expect(saved?.reservation?.from).toEqual(new Date("2026-07-10T00:00:00.000Z"));
      expect(saved?.reservation?.to).toEqual(new Date("2026-07-20T00:00:00.000Z"));
      expect(saved?.reservation?.updatedBy).toBe(adminUser.id);
    });

    it("rejects reservation if the property is not PUBLISHED", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      await createTestProperty({ status: "DRAFT", isPublished: false });

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-10T00:00:00.000Z",
          to: "2026-07-20T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Seul un bien publié peut être marqué comme réservé");
    });

    it("returns 403 for CUSTOMER role trying to reserve", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(customerUser);
      await createTestProperty();

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-10T00:00:00.000Z",
          to: "2026-07-20T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(403);
    });

    it("returns 403 for OWNER role trying to reserve", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);
      await createTestProperty();

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-10T00:00:00.000Z",
          to: "2026-07-20T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated user", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(null);
      await createTestProperty();

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-10T00:00:00.000Z",
          to: "2026-07-20T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("2. Date Validation & Formatting Rules", () => {
    it("rejects reservation when 'from' is greater than or equal to 'to' (400)", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      await createTestProperty();

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-20T00:00:00.000Z",
          to: "2026-07-10T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("rejects invalid date strings with 400", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      await createTestProperty();

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "not-a-date",
          to: "2026-07-20T00:00:00.000Z",
        }),
      });

      const res = await reserveProperty(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("3. Updating & Releasing Reservations", () => {
    it("allows admin to update reservation dates (PATCH)", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      await createTestProperty({
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-10T00:00:00.000Z"),
          to: new Date("2026-07-20T00:00:00.000Z"),
          updatedAt: new Date(),
          updatedBy: adminUser.id,
        },
      });

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "2026-07-15T00:00:00.000Z",
          to: "2026-07-25T00:00:00.000Z",
        }),
      });

      const res = await updateReservation(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(200);

      const saved = await PropertyModel.findOne({ id: "PROP-TEST-001" });
      expect(saved?.availabilityStatus).toBe("RESERVED");
      expect(saved?.reservation?.from).toEqual(new Date("2026-07-15T00:00:00.000Z"));
      expect(saved?.reservation?.to).toEqual(new Date("2026-07-25T00:00:00.000Z"));
    });

    it("allows admin to release the reservation back to AVAILABLE (DELETE)", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      await createTestProperty({
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-10T00:00:00.000Z"),
          to: new Date("2026-07-20T00:00:00.000Z"),
          updatedAt: new Date(),
          updatedBy: adminUser.id,
        },
      });

      const req = new NextRequest("http://localhost:3000/api/admin/properties/PROP-TEST-001/reservation", {
        method: "DELETE",
      });

      const res = await releaseReservation(req, {
        params: Promise.resolve({ id: "PROP-TEST-001" }),
      });
      expect(res.status).toBe(200);

      const saved = await PropertyModel.findOne({ id: "PROP-TEST-001" }).lean();
      expect(saved?.availabilityStatus).toBe("AVAILABLE");
      expect(saved?.reservation).toBeFalsy();
    });
  });

  describe("4. Public DTO Data Sanitization", () => {
    it("public API returns availabilityStatus and reservation dates without exposing internal admin info", async () => {
      await createTestProperty({
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-10T00:00:00.000Z"),
          to: new Date("2026-07-20T00:00:00.000Z"),
          updatedAt: new Date(),
          updatedBy: "admin-secret-id",
        },
      });

      const req = new NextRequest("http://localhost:3000/api/properties/villa-dar-ennour-mahdia-001");
      const res = await getPublicPropertyBySlug(req, {
        params: Promise.resolve({ slug: "villa-dar-ennour-mahdia-001" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.availabilityStatus).toBe("RESERVED");
      expect(data.reservation).toEqual({
        from: "2026-07-10T00:00:00.000Z",
        to: "2026-07-20T00:00:00.000Z",
      });
      // STRICT: Must NOT expose updatedBy or internal admin identifiers
      expect(data.reservation.updatedBy).toBeUndefined();
      expect(data.updatedBy).toBeUndefined();
    });
  });

  describe("5. Search Filtering Overlap Exclusion", () => {
    it("excludes reserved property from search when dates overlap", async () => {
      // Reserved from July 10 to July 20
      await createTestProperty({
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-10T00:00:00.000Z"),
          to: new Date("2026-07-20T00:00:00.000Z"),
          updatedAt: new Date(),
          updatedBy: adminUser.id,
        },
      });

      // Search July 12 to July 18 -> Overlaps -> Must NOT be returned
      const reqOverlap = new NextRequest(
        "http://localhost:3000/api/properties?checkIn=2026-07-12&checkOut=2026-07-18"
      );
      const resOverlap = await getPublicProperties(reqOverlap);
      const dataOverlap = await resOverlap.json();
      expect(dataOverlap).toHaveLength(0);

      // Search July 21 to July 28 -> No overlap -> Must be returned
      const reqNoOverlap = new NextRequest(
        "http://localhost:3000/api/properties?checkIn=2026-07-21&checkOut=2026-07-28"
      );
      const resNoOverlap = await getPublicProperties(reqNoOverlap);
      const dataNoOverlap = await resNoOverlap.json();
      expect(dataNoOverlap).toHaveLength(1);
      expect(dataNoOverlap[0].id).toBe("PROP-TEST-001");
    });
  });

  describe("6. Rental Request Proposal Conflict Check", () => {
    it("rejects proposal creation with 409 Conflict if proposed property is reserved for overlapping period", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);

      // Property reserved from July 10 to July 20
      await createTestProperty({
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-10T00:00:00.000Z"),
          to: new Date("2026-07-20T00:00:00.000Z"),
          updatedAt: new Date(),
          updatedBy: adminUser.id,
        },
      });

      // Rental request with overlapping dates: July 12 to July 17
      const request = await HousingRequestModel.create({
        id: "REQ-2026-TEST1",
        customer: { fullName: "Aymen Test", phone: "+216 20 123 456" },
        checkIn: "2026-07-12",
        checkOut: "2026-07-17",
        destination: "Mahdia",
        status: "PENDING",
      });

      const req = new NextRequest(
        `http://localhost:3000/api/admin/requests/${request.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: "PROP-TEST-001",
            proposedPrice: 1500,
          }),
        }
      );

      const res = await addProposal(req, {
        params: Promise.resolve({ id: request.id }),
      });
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toContain("Ce logement est déjà réservé pour cette période");
    });

    it("accepts proposal creation if dates do not overlap with reservation", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);

      // Property reserved from July 10 to July 20
      await createTestProperty({
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-10T00:00:00.000Z"),
          to: new Date("2026-07-20T00:00:00.000Z"),
          updatedAt: new Date(),
          updatedBy: adminUser.id,
        },
      });

      // Rental request with non-overlapping dates: July 22 to July 30
      const request = await HousingRequestModel.create({
        id: "REQ-2026-TEST2",
        customer: { fullName: "Sami Test", phone: "+216 20 654 321" },
        checkIn: "2026-07-22",
        checkOut: "2026-07-30",
        destination: "Mahdia",
        status: "PENDING",
      });

      const req = new NextRequest(
        `http://localhost:3000/api/admin/requests/${request.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: "PROP-TEST-001",
            proposedPrice: 1800,
          }),
        }
      );

      const res = await addProposal(req, {
        params: Promise.resolve({ id: request.id }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
