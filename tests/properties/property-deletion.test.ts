import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import {
  PropertyModel,
  HouseModel,
  ReservationModel,
  PaymentModel,
  FinancialLedgerModel,
  HousingRequestModel,
  AuditLogModel,
  PropertyModerationEventModel,
} from "@/lib/models";
import { propertyService } from "@/server/services/PropertyService";
import { authService } from "@/server/services/AuthService";
import * as cloudinaryUtils from "@/server/utils/cloudinary";
import { NextRequest } from "next/server";
import { DELETE as deleteOwnerProperty } from "@/app/api/owner/properties/[id]/route";
import { DELETE as deleteAdminProperty } from "@/app/api/admin/properties/[id]/route";
import { GET as getPublicProperties } from "@/app/api/properties/route";
import { GET as getPublicPropertyBySlug } from "@/app/api/properties/[slug]/route";

describe("Property Deletion & Verification Workflow (Owner & Admin)", () => {
  const ownerUser = {
    id: "owner-usr-101",
    email: "owner1@locmaison.com",
    role: "OWNER" as const,
    firstName: "Sami",
    lastName: "Mahjoub",
  };

  const otherOwnerUser = {
    id: "owner-usr-102",
    email: "owner2@locmaison.com",
    role: "OWNER" as const,
    firstName: "Kamel",
    lastName: "Ben Salem",
  };

  const adminUser = {
    id: "admin-usr-999",
    email: "admin@locmaison.com",
    role: "ADMIN" as const,
    firstName: "Admin",
    lastName: "LOC MAISON",
  };

  const superAdminUser = {
    id: "superadmin-usr-001",
    email: "superadmin@locmaison.com",
    role: "SUPER_ADMIN" as const,
    firstName: "Super",
    lastName: "Admin",
  };

  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await PropertyModel.deleteMany({});
    await HouseModel.deleteMany({});
    await ReservationModel.deleteMany({});
    await PaymentModel.deleteMany({});
    await FinancialLedgerModel.deleteMany({});
    await HousingRequestModel.deleteMany({});
    await AuditLogModel.deleteMany({});
    await PropertyModerationEventModel.deleteMany({});
  });

  describe("1. Case A: Permanent Deletion (No Historical Records)", () => {
    it("owner successfully deletes own property with no history, removing it from DB & audit logging", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);
      const deleteCloudinarySpy = vi.spyOn(cloudinaryUtils, "deleteFromCloudinary").mockResolvedValue();

      const propertyId = "prop-delete-001";
      await PropertyModel.create({
        id: propertyId,
        slug: "villa-jasmin-mahdia-001",
        ownerId: ownerUser.id,
        title: "Villa Jasmin",
        rentalCategory: "summer",
        propertyType: "Villa",
        city: "Mahdia",
        status: "DRAFT",
        isPublished: false,
        pricing: { price: 1200, pricePeriod: "week", currency: "TND" },
        images: [
          {
            url: "https://res.cloudinary.com/kyiccgx3/image/upload/v1/test.jpg",
            publicId: "location-match/properties/villa-jasmin-1",
          },
        ],
      });

      await HouseModel.create({
        id: propertyId,
        slug: "villa-jasmin-mahdia-001",
        title: "Villa Jasmin",
        isPublished: false,
      });

      const req = new NextRequest(`http://localhost:3000/api/owner/properties/${propertyId}`, {
        method: "DELETE",
      });

      const res = await deleteOwnerProperty(req, { params: Promise.resolve({ id: propertyId }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.action).toBe("DELETED");

      // Verify DB removal
      const propInDb = await PropertyModel.findOne({ id: propertyId }).lean();
      expect(propInDb).toBeNull();
      const houseInDb = await HouseModel.findOne({ id: propertyId }).lean();
      expect(houseInDb).toBeNull();

      // Verify Audit Log was recorded
      const auditLog = await AuditLogModel.findOne({
        targetId: propertyId,
        action: "PROPERTY_DELETED",
      }).lean();
      expect(auditLog).toBeDefined();
      expect(auditLog.actorId).toBe(ownerUser.id);
      expect(auditLog.actorRole).toBe("OWNER");

      // Verify Cloudinary asset cleanup was invoked for genuine property asset
      expect(deleteCloudinarySpy).toHaveBeenCalledWith("location-match/properties/villa-jasmin-1");
    });

    it("does not delete seed or placeholder assets from Cloudinary on property deletion", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);
      const deleteCloudinarySpy = vi.spyOn(cloudinaryUtils, "deleteFromCloudinary").mockResolvedValue();

      const propertyId = "prop-seed-safety-001";
      await PropertyModel.create({
        id: propertyId,
        slug: "villa-safety-001",
        ownerId: ownerUser.id,
        title: "Villa Safety",
        rentalCategory: "summer",
        status: "PUBLISHED",
        isPublished: true,
        images: [
          {
            url: "/placeholder-property.jpg",
            publicId: "placeholder-property",
          },
          {
            url: "https://res.cloudinary.com/seed.jpg",
            publicId: "seed-villa-1",
          },
          {
            url: "https://res.cloudinary.com/hero.jpg",
            publicId: "hero-banner",
          },
        ],
      });

      const req = new NextRequest(`http://localhost:3000/api/owner/properties/${propertyId}`, {
        method: "DELETE",
      });

      const res = await deleteOwnerProperty(req, { params: Promise.resolve({ id: propertyId }) });
      expect(res.status).toBe(200);

      // Cloudinary deletion must NOT have been called for seeds/placeholders/hero
      expect(deleteCloudinarySpy).not.toHaveBeenCalled();
    });
  });

  describe("2. IDOR Security: Unauthorized Owner Access Forbidden", () => {
    it("blocks owner from deleting another owner's property with 403 Forbidden", async () => {
      // Authenticated as ownerUser
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const propertyId = "prop-other-owner-001";
      // Property belongs to otherOwnerUser
      await PropertyModel.create({
        id: propertyId,
        slug: "appartement-kamel-001",
        ownerId: otherOwnerUser.id,
        title: "Appartement de Kamel",
        rentalCategory: "student",
        status: "PUBLISHED",
        isPublished: true,
      });

      const req = new NextRequest(`http://localhost:3000/api/owner/properties/${propertyId}`, {
        method: "DELETE",
      });

      const res = await deleteOwnerProperty(req, { params: Promise.resolve({ id: propertyId }) });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error).toMatch(/Accès refusé/i);

      // Verify property is intact in DB
      const propInDb = await PropertyModel.findOne({ id: propertyId }).lean();
      expect(propInDb).not.toBeNull();
    });
  });

  describe("3. Case C: Active or Future Confirmed Reservations Block Deletion", () => {
    it("blocks deletion when confirmed reservation exists with future checkout date", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const propertyId = "prop-with-active-res-001";
      await PropertyModel.create({
        id: propertyId,
        slug: "villa-active-res-001",
        ownerId: ownerUser.id,
        title: "Villa Active",
        rentalCategory: "summer",
        status: "PUBLISHED",
        isPublished: true,
      });

      // Active confirmed reservation ending in 5 days
      const futureCheckout = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      await ReservationModel.create({
        id: "res-active-001",
        propertyId,
        ownerId: ownerUser.id,
        customerName: "Mohamed Ali",
        checkIn: new Date(),
        checkOut: futureCheckout,
        status: "CONFIRMED",
      });

      const req = new NextRequest(`http://localhost:3000/api/owner/properties/${propertyId}`, {
        method: "DELETE",
      });

      const res = await deleteOwnerProperty(req, { params: Promise.resolve({ id: propertyId }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/réservations confirmées en cours ou à venir/i);

      // Verify property still exists and is not deleted
      const propInDb = await PropertyModel.findOne({ id: propertyId }).lean();
      expect(propInDb).not.toBeNull();
    });
  });

  describe("4. Case B: Historical Records Preserve Financial & Reservation Audit (Soft Delete / Archive)", () => {
    it("archives property when past completed reservations or payments exist, removing from public discovery", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const propertyId = "prop-historical-001";
      await PropertyModel.create({
        id: propertyId,
        slug: "dar-salem-mahdia-001",
        ownerId: ownerUser.id,
        title: "Dar Salem",
        rentalCategory: "summer",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
        pricing: { price: 900, pricePeriod: "week", currency: "TND" },
      });

      await HouseModel.create({
        id: propertyId,
        slug: "dar-salem-mahdia-001",
        title: "Dar Salem",
        isPublished: true,
      });

      // Past reservation completed 30 days ago
      const pastCheckOut = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pastCheckIn = new Date(Date.now() - 37 * 24 * 60 * 60 * 1000);
      await ReservationModel.create({
        id: "res-past-001",
        propertyId,
        ownerId: ownerUser.id,
        customerName: "Ahmed Sassi",
        checkIn: pastCheckIn,
        checkOut: pastCheckOut,
        status: "COMPLETED",
      });

      // Payment record associated with the past reservation
      await PaymentModel.create({
        id: "pay-past-001",
        reservationId: "res-past-001",
        propertyId,
        ownerId: ownerUser.id,
        amount: 900,
        status: "VERIFIED",
      });

      const req = new NextRequest(`http://localhost:3000/api/owner/properties/${propertyId}`, {
        method: "DELETE",
      });

      const res = await deleteOwnerProperty(req, { params: Promise.resolve({ id: propertyId }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.action).toBe("ARCHIVED");
      expect(json.message).toMatch(/archivé/i);

      // Verify property is ARCHIVED, not destroyed, and isPublished is false
      const propInDb = await PropertyModel.findOne({ id: propertyId }).lean();
      expect(propInDb).not.toBeNull();
      expect(propInDb.status).toBe("ARCHIVED");
      expect(propInDb.isPublished).toBe(false);

      // Verify HouseModel is un-published
      const houseInDb = await HouseModel.findOne({ id: propertyId }).lean();
      expect(houseInDb.isPublished).toBe(false);

      // Verify historical reservation and payment records were preserved intact
      const resCount = await ReservationModel.countDocuments({ propertyId });
      expect(resCount).toBe(1);
      const payCount = await PaymentModel.countDocuments({ propertyId });
      expect(payCount).toBe(1);

      // Verify Audit Log records archival on delete
      const auditLog = await AuditLogModel.findOne({
        targetId: propertyId,
        action: "PROPERTY_ARCHIVED_ON_DELETE",
      }).lean();
      expect(auditLog).toBeDefined();
      expect(auditLog.actorId).toBe(ownerUser.id);
    });
  });

  describe("5. Admin & Super Admin Deletion Permissions", () => {
    it("admin can delete any property and record an optional moderation reason", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);

      const propertyId = "prop-admin-delete-001";
      await PropertyModel.create({
        id: propertyId,
        slug: "villa-admin-delete-001",
        ownerId: "some-owner-id",
        title: "Villa Spam",
        rentalCategory: "summer",
        status: "PENDING_REVIEW",
        isPublished: false,
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/properties/${propertyId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: "Annonce publicitaire non autorisée" }),
      });

      const res = await deleteAdminProperty(req, { params: Promise.resolve({ id: propertyId }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.action).toBe("DELETED");

      // Verify DB removal
      const propInDb = await PropertyModel.findOne({ id: propertyId }).lean();
      expect(propInDb).toBeNull();

      // Verify audit log has the admin ID and reason
      const auditLog = await AuditLogModel.findOne({
        targetId: propertyId,
        action: "PROPERTY_DELETED",
      }).lean();
      expect(auditLog).toBeDefined();
      expect(auditLog.actorRole).toBe("ADMIN");
      expect(auditLog.reason).toBe("Annonce publicitaire non autorisée");
    });
  });

  describe("6. Exclusion from Public Discovery, Search & Slug Lookups", () => {
    it("verifies deleted and archived properties never appear in public search or slug pages", async () => {
      const activeSlug = "villa-active-discovery";
      const archivedSlug = "villa-archived-discovery";

      // 1. Create one active published property
      await PropertyModel.create({
        id: "prop-active-disc",
        slug: activeSlug,
        ownerId: ownerUser.id,
        title: "Active Villa Discovery",
        rentalCategory: "summer",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
        pricing: { price: 1000, pricePeriod: "week", currency: "TND" },
      });

      // 2. Create one archived property
      await PropertyModel.create({
        id: "prop-archived-disc",
        slug: archivedSlug,
        ownerId: ownerUser.id,
        title: "Archived Villa Discovery",
        rentalCategory: "summer",
        city: "Mahdia",
        status: "ARCHIVED",
        isPublished: false,
        pricing: { price: 1000, pricePeriod: "week", currency: "TND" },
      });

      // Search query
      const searchReq = new NextRequest("http://localhost:3000/api/properties?city=Mahdia");
      const searchRes = await getPublicProperties(searchReq);
      const searchJson = await searchRes.json();

      expect(searchRes.status).toBe(200);
      const propertyList = Array.isArray(searchJson) ? searchJson : searchJson.properties || [];
      const foundSlugs = propertyList.map((p: any) => p.slug);
      expect(foundSlugs).toContain(activeSlug);
      expect(foundSlugs).not.toContain(archivedSlug);

      // Slug lookup for archived property must return 404
      const slugReq = new NextRequest(`http://localhost:3000/api/properties/${archivedSlug}`);
      const slugRes = await getPublicPropertyBySlug(slugReq, {
        params: Promise.resolve({ slug: archivedSlug }),
      });
      expect(slugRes.status).toBe(404);
    });
  });
});
