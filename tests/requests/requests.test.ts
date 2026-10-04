import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { requestService } from "@/server/services/RequestService";
import { normalizeTunisianPhone, CreateRentalRequestSchema } from "@/lib/rentals/request-schema";
import { HousingRequestModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

describe("Rental Request Workflow & Tunisian Validation", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    await HousingRequestModel.deleteMany({});
  });

  describe("Tunisian Phone Normalization", () => {
    it("normalizes various valid Tunisian phone numbers", () => {
      expect(normalizeTunisianPhone("22 123 456")).toBe("+21622123456");
      expect(normalizeTunisianPhone("+216 98 123 456")).toBe("+21698123456");
      expect(normalizeTunisianPhone("55123456")).toBe("+21655123456");
      expect(normalizeTunisianPhone("00216 44 123 456")).toBe("+21644123456");
      expect(normalizeTunisianPhone("73 123 456")).toBe("+21673123456");
    });

    it("rejects invalid phone numbers", () => {
      expect(normalizeTunisianPhone("12345")).toBeNull();
      expect(normalizeTunisianPhone("+33 6 12 34 56 78")).toBeNull();
      expect(normalizeTunisianPhone("abcd")).toBeNull();
    });
  });

  describe("Rental Request Creation & Lifecycle", () => {
    it("successfully creates a summer rental request with normalized phone and PENDING status", async () => {
      const input = {
        rentalCategory: "summer" as const,
        fullName: "Mohamed Ben Ali",
        phone: "22 123 456",
        destination: "Mahdia",
        checkIn: "2026-07-01",
        checkOut: "2026-07-15",
        guests: 4,
        budget: 1800,
        budgetPeriod: "week" as const,
        amenities: ["Climatisation", "Piscine"],
      };

      const parsed = CreateRentalRequestSchema.parse(input);
      const res = await requestService.createRequest(parsed, "user-123");

      expect(res.id).toMatch(/^REQ-\d{4}-[A-Z0-9]+$/);
      expect(res.status).toBe("PENDING");
      expect(res.destination).toBe("Mahdia");

      const saved = await HousingRequestModel.findOne({ id: res.id }).lean();
      expect(saved).toBeDefined();
      expect(saved?.customer?.fullName).toBe("Mohamed Ben Ali");
      expect(saved?.customer?.phone).toBe("+21622123456");
      expect(saved?.customerId).toBe("user-123");
      expect(saved?.budgetPeriod).toBe("week");
    });

    it("successfully creates a summer rental request with stay budget and destination/area", async () => {
      const input = {
        rentalCategory: "summer" as const,
        fullName: "Karim Mansour",
        phone: "50 123 789",
        destination: "Sousse",
        area: "Khzema",
        flexibleLocation: true,
        checkIn: "2026-07-15",
        checkOut: "2026-07-25",
        guests: 5,
        budget: 2500,
        budgetPeriod: "stay" as const,
        amenities: ["Vue mer", "Climatisation"],
      };

      const parsed = CreateRentalRequestSchema.parse(input);
      const res = await requestService.createRequest(parsed);

      expect(res.id).toBeDefined();
      expect(res.destination).toBe("Sousse");
      expect(res.area).toBe("Khzema");
      expect(res.budgetPeriod).toBe("stay");
    });

    it("creates a student request with university and monthly budget", async () => {
      const input = {
        rentalCategory: "student" as const,
        fullName: "Sarra Trabelsi",
        phone: "+216 98 765 432",
        destination: "Mahdia",
        university: "FSEG Mahdia",
        checkIn: "2026-09-01",
        students: 2,
        budget: 300,
        budgetPeriod: "month" as const,
        genderPreference: "Étudiantes (Filles)",
        amenities: ["Wi-Fi", "Machine à laver"],
      };

      const parsed = CreateRentalRequestSchema.parse(input);
      const res = await requestService.createRequest(parsed);

      expect(res.id).toBeDefined();
      expect(res.rentalCategory).toBe("student");

      const saved = await HousingRequestModel.findOne({ id: res.id }).lean();
      expect(saved?.university).toBe("FSEG Mahdia");
      expect(saved?.customer?.phone).toBe("+21698765432");
    });

    it("prevents client from seeing internal adminNotes", async () => {
      const input = {
        rentalCategory: "summer" as const,
        fullName: "Amine K",
        phone: "55 000 111",
        destination: "Sousse",
        checkIn: "2026-08-01",
        checkOut: "2026-08-10",
        guests: 2,
        budgetPeriod: "week" as const,
        amenities: [],
      };

      const parsed = CreateRentalRequestSchema.parse(input);
      const created = await requestService.createRequest(parsed);

      // Admin adds internal notes
      await requestService.updateRequestStatus(created.id, "UNDER_REVIEW", "Internal: Client requested discount");

      // Client view
      const clientView = await requestService.getClientRequest(created.id);
      expect((clientView as any).adminNotes).toBeUndefined();
      expect(clientView?.status).toBe("UNDER_REVIEW");

      // Admin view
      const adminView = await requestService.getAdminRequest(created.id);
      expect(adminView?.adminNotes).toBe("Internal: Client requested discount");
    });

    it("supports admin proposing a property and client accepting it", async () => {
      const input = {
        rentalCategory: "summer" as const,
        fullName: "Test User",
        phone: "22 333 444",
        destination: "Mahdia",
        checkIn: "2026-07-10",
        checkOut: "2026-07-20",
        guests: 3,
        budgetPeriod: "week" as const,
        amenities: [],
      };

      const parsed = CreateRentalRequestSchema.parse(input);
      const created = await requestService.createRequest(parsed);

      // Admin attaches proposal
      await requestService.addProposal(created.id, {
        propertyId: "h1",
        proposedPrice: 1500,
        adminMessage: "Superbe villa proche plage.",
      });

      let updated = await HousingRequestModel.findOne({ id: created.id }).lean();
      expect(updated?.status).toBe("PROPERTY_PROPOSED");
      expect(updated?.proposedProperties?.[0]?.propertyId).toBe("h1");
      expect(updated?.proposedProperties?.[0]?.status).toBe("PENDING_CLIENT");

      // Client accepts proposal
      await requestService.respondToProposal(created.id, "h1", "ACCEPTED");

      updated = await HousingRequestModel.findOne({ id: created.id }).lean();
      expect(updated?.status).toBe("CONFIRMED");
      expect(updated?.selectedProperty).toBe("h1");
      expect(updated?.proposedProperties?.[0]?.status).toBe("ACCEPTED");
    });
  });
});
