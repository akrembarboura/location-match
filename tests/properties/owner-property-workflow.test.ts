import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import {
  PropertyModel,
  UserModel,
  OwnerModel,
  NotificationModel,
  PropertyModerationEventModel,
} from "@/lib/models";
import { propertyService } from "@/server/services/PropertyService";
import { authService } from "@/server/services/AuthService";
import { NextRequest } from "next/server";
import { GET as getOwnerProperties, POST as createOwnerProperty } from "@/app/api/owner/properties/route";
import { GET as getOwnerProperty, PATCH as updateOwnerProperty } from "@/app/api/owner/properties/[id]/route";
import { POST as submitOwnerProperty } from "@/app/api/owner/properties/[id]/submit/route";
import { GET as getAdminProperties } from "@/app/api/admin/properties/route";
import { GET as getAdminProperty } from "@/app/api/admin/properties/[id]/route";
import { POST as reviewAdminProperty } from "@/app/api/admin/properties/[id]/review/route";
import { POST as approveAdminProperty } from "@/app/api/admin/properties/[id]/approve/route";
import { POST as rejectAdminProperty } from "@/app/api/admin/properties/[id]/reject/route";
import { POST as archiveAdminProperty } from "@/app/api/admin/properties/[id]/archive/route";
import { GET as getPublicProperties } from "@/app/api/properties/route";
import { GET as getPublicPropertyBySlug } from "@/app/api/properties/[slug]/route";

describe("Owner Property Submission → Admin Verification → Publication Workflow", () => {
  const ownerUser = {
    id: "owner-usr-001",
    email: "owner@locmaison.com",
    role: "OWNER" as const,
    firstName: "Salah",
    lastName: "Trabelsi",
    phone: "21698123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const otherOwnerUser = {
    id: "owner-usr-002",
    email: "otherowner@locmaison.com",
    role: "OWNER" as const,
    firstName: "Mounir",
    lastName: "Gharbi",
    phone: "21698654321",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await PropertyModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await PropertyModerationEventModel.deleteMany({});
    await OwnerModel.deleteMany({});
  });

  describe("1. Property Creation as Draft & Direct Submission", () => {
    it("allows owner to save a property as DRAFT without publishing", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const payload = {
        title: "Villa Dar Ennour",
        description: "Superbe villa familiale à 2 minutes de la plage de Hiboun.",
        rentalCategory: "summer" as const,
        propertyType: "Villa",
        city: "Mahdia",
        area: "Hiboun",
        pricing: {
          price: 1800,
          pricePeriod: "week" as const,
        },
        capacity: {
          guests: 6,
          bedrooms: 3,
          bathrooms: 2,
        },
        amenities: ["Climatisation", "Piscine", "Wi-Fi"],
        images: [
          {
            url: "https://res.cloudinary.com/kyiccgx3/image/upload/v1/test.jpg",
            publicId: "location-match/test1",
          },
        ],
        asDraft: true,
      };

      const req = new NextRequest("http://localhost:3000/api/owner/properties", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await createOwnerProperty(req);
      expect(res.status).toBe(201);
      const json = await res.json();

      expect(json.id).toBeDefined();
      expect(json.status).toBe("DRAFT");
      expect(json.isPublished).toBe(false);
      expect(json.ownerId).toBe(ownerUser.id);

      const inDb = await PropertyModel.findOne({ id: json.id }).lean();
      expect(inDb?.status).toBe("DRAFT");
      expect(inDb?.isPublished).toBe(false);
    });

    it("allows owner to submit a property for review (PENDING_REVIEW) and notifies admin", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const payload = {
        title: "Appartement S+2 Corniche",
        rentalCategory: "summer" as const,
        propertyType: "Appartement",
        city: "Mahdia",
        area: "Zone Touristique",
        pricing: {
          price: 1200,
          pricePeriod: "week" as const,
        },
        capacity: {
          guests: 4,
          bedrooms: 2,
          bathrooms: 1,
        },
        amenities: ["Vue mer", "Climatisation"],
        images: [
          {
            url: "https://res.cloudinary.com/kyiccgx3/image/upload/v1/prop1.jpg",
            publicId: "location-match/prop1",
          },
        ],
        asDraft: false,
      };

      const req = new NextRequest("http://localhost:3000/api/owner/properties", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await createOwnerProperty(req);
      expect(res.status).toBe(201);
      const json = await res.json();

      expect(json.status).toBe("PENDING_REVIEW");
      expect(json.moderation?.submittedAt).toBeDefined();

      // Check MongoDB
      const inDb = await PropertyModel.findOne({ id: json.id }).lean();
      expect(inDb?.status).toBe("PENDING_REVIEW");
      expect(inDb?.isPublished).toBe(false);

      // Check Admin Notification in MongoDB
      const notifs = await NotificationModel.find({ recipientRole: "ADMIN" }).lean();
      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe("PROPERTY_SUBMITTED");
      expect(notifs[0].propertyId).toBe(json.id);

      // Check Moderation Event
      const events = await PropertyModerationEventModel.find({ propertyId: json.id }).lean();
      expect(events.length).toBe(1);
      expect(events[0].action).toBe("SUBMITTED");
    });
  });

  describe("2. Owner Cannot Bypass Moderation to Publish", () => {
    it("ignores or rejects client attempting to submit status=PUBLISHED", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const payload = {
        title: "Tentative de piratage publication",
        rentalCategory: "summer" as const,
        propertyType: "Villa",
        city: "Mahdia",
        area: "Hiboun",
        pricing: { price: 2000, pricePeriod: "week" as const },
        images: [{ url: "https://res.cloudinary.com/test.jpg" }],
        status: "PUBLISHED", // Malicious attempt to self-publish
        asDraft: false,
      };

      const req = new NextRequest("http://localhost:3000/api/owner/properties", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await createOwnerProperty(req);
      expect(res.status).toBe(201);
      const json = await res.json();

      // Backend authoritative rule: status MUST be PENDING_REVIEW, not PUBLISHED!
      expect(json.status).toBe("PENDING_REVIEW");
      expect(json.isPublished).toBe(false);

      const inDb = await PropertyModel.findOne({ id: json.id }).lean();
      expect(inDb?.status).toBe("PENDING_REVIEW");
      expect(inDb?.isPublished).toBe(false);
    });
  });

  describe("3. Admin Review & Approval Flow", () => {
    let propId: string;

    beforeEach(async () => {
      // Create a pending property
      const created = await propertyService.createOwnerProperty(
        {
          title: "Maison S+3 Rejiche Plage",
          rentalCategory: "summer",
          propertyType: "Maison",
          city: "Mahdia",
          area: "Rejiche",
          pricing: { price: 1500, pricePeriod: "week" },
          capacity: { guests: 6, bedrooms: 3, bathrooms: 2 },
          amenities: ["Accès plage"],
          images: [{ url: "https://res.cloudinary.com/rejiche.jpg" }],
          asDraft: false,
        },
        ownerUser.id
      );
      propId = created.id;
    });

    it("allows admin to take charge of review (status -> UNDER_REVIEW)", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);

      const req = new NextRequest(`http://localhost:3000/api/admin/properties/${propId}/review`, {
        method: "POST",
      });

      const res = await reviewAdminProperty(req, {
        params: Promise.resolve({ id: propId }),
      });
      expect(res.status).toBe(200);

      const inDb = await PropertyModel.findOne({ id: propId }).lean();
      expect(inDb?.status).toBe("UNDER_REVIEW");
      expect(inDb?.isPublished).toBe(false);
    });

    it("allows admin to approve property (status -> PUBLISHED) and notifies owner", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);

      const req = new NextRequest(`http://localhost:3000/api/admin/properties/${propId}/approve`, {
        method: "POST",
      });

      const res = await approveAdminProperty(req, {
        params: Promise.resolve({ id: propId }),
      });
      expect(res.status).toBe(200);

      const inDb = await PropertyModel.findOne({ id: propId }).lean();
      expect(inDb?.status).toBe("PUBLISHED");
      expect(inDb?.isPublished).toBe(true);
      expect(inDb?.verified).toBe(true);
      expect(inDb?.reviewedBy).toBe(adminUser.id);
      expect(inDb?.reviewedAt).toBeDefined();

      // Check Owner Notification in MongoDB
      const notifs = await NotificationModel.find({ recipientId: ownerUser.id }).lean();
      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe("PROPERTY_APPROVED");
      expect(notifs[0].title).toContain("publié");
    });
  });

  describe("4. Public Visibility Enforcement", () => {
    it("public API only returns PUBLISHED properties and excludes DRAFT, PENDING, REJECTED", async () => {
      // 1. Published property
      await PropertyModel.create({
        id: "PUB-001",
        slug: "pub-villa-001",
        title: "Villa Publique",
        status: "PUBLISHED",
        isPublished: true,
        rentalCategory: "summer",
        city: "Mahdia",
        area: "Hiboun",
        ownerId: ownerUser.id,
      });

      // 2. Pending property
      await PropertyModel.create({
        id: "PEND-002",
        slug: "pend-villa-002",
        title: "Villa En Attente",
        status: "PENDING_REVIEW",
        isPublished: false,
        rentalCategory: "summer",
        city: "Mahdia",
        ownerId: ownerUser.id,
      });

      // 3. Draft property
      await PropertyModel.create({
        id: "DRAFT-003",
        slug: "draft-villa-003",
        title: "Villa Brouillon",
        status: "DRAFT",
        isPublished: false,
        rentalCategory: "summer",
        city: "Mahdia",
        ownerId: ownerUser.id,
      });

      // 4. Rejected property
      await PropertyModel.create({
        id: "REJ-004",
        slug: "rej-villa-004",
        title: "Villa Refusée",
        status: "REJECTED",
        isPublished: false,
        rentalCategory: "summer",
        city: "Mahdia",
        ownerId: ownerUser.id,
      });

      // Test Public Listing API
      const req = new NextRequest("http://localhost:3000/api/properties");
      const res = await getPublicProperties(req);
      expect(res.status).toBe(200);
      const list = await res.json();

      expect(list.length).toBe(1);
      expect(list[0].id).toBe("PUB-001");

      // Test Public Detail By Slug
      const pubReq = new NextRequest("http://localhost:3000/api/properties/pub-villa-001");
      const pubRes = await getPublicPropertyBySlug(pubReq, {
        params: Promise.resolve({ slug: "pub-villa-001" }),
      });
      expect(pubRes.status).toBe(200);

      // Attempt to access pending property detail as public visitor -> 404
      const pendReq = new NextRequest("http://localhost:3000/api/properties/pend-villa-002");
      const pendRes = await getPublicPropertyBySlug(pendReq, {
        params: Promise.resolve({ slug: "pend-villa-002" }),
      });
      expect(pendRes.status).toBe(404);
    });
  });

  describe("5. Rejection & Resubmission Workflow", () => {
    it("admin rejects property with reason and owner resubmits successfully", async () => {
      // 1. Owner creates and submits property
      const created = await propertyService.createOwnerProperty(
        {
          title: "Studio S+1 Centre Ville",
          rentalCategory: "student",
          propertyType: "Studio",
          city: "Mahdia",
          area: "Mahdia Ville",
          pricing: { price: 450, pricePeriod: "month" },
          images: [{ url: "https://res.cloudinary.com/dark.jpg" }],
          asDraft: false,
        },
        ownerUser.id
      );

      // 2. Admin rejects with reason
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(adminUser);
      const rejectReq = new NextRequest(
        `http://localhost:3000/api/admin/properties/${created.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            rejectionReason: "Photos trop sombres et floues. Merci de fournir des photos nettes en plein jour.",
          }),
        }
      );

      const rejectRes = await rejectAdminProperty(rejectReq, {
        params: Promise.resolve({ id: created.id }),
      });
      expect(rejectRes.status).toBe(200);

      // Verify rejected state in MongoDB
      const inDbRejected = await PropertyModel.findOne({ id: created.id }).lean();
      expect(inDbRejected?.status).toBe("REJECTED");
      expect(inDbRejected?.rejectionReason).toContain("Photos trop sombres");

      // 3. Owner gets their property and inspects rejection reason
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);
      const getOwnerReq = new NextRequest(
        `http://localhost:3000/api/owner/properties/${created.id}`
      );
      const getOwnerRes = await getOwnerProperty(getOwnerReq, {
        params: Promise.resolve({ id: created.id }),
      });
      const ownerJson = await getOwnerRes.json();
      expect(ownerJson.status).toBe("REJECTED");
      expect(ownerJson.moderation?.rejectionReason).toContain("Photos trop sombres");

      // 4. Owner corrects photos and resubmits
      const updateReq = new NextRequest(
        `http://localhost:3000/api/owner/properties/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            images: [
              {
                url: "https://res.cloudinary.com/bright_clean.jpg",
                publicId: "location-match/bright1",
              },
            ],
            resubmit: true,
          }),
        }
      );

      const updateRes = await updateOwnerProperty(updateReq, {
        params: Promise.resolve({ id: created.id }),
      });
      expect(updateRes.status).toBe(200);
      const updatedJson = await updateRes.json();

      // State is now back in PENDING_REVIEW, rejectionReason cleared
      expect(updatedJson.status).toBe("PENDING_REVIEW");
      expect(updatedJson.moderation?.rejectionReason).toBeUndefined();

      const inDbResubmitted = await PropertyModel.findOne({ id: created.id }).lean();
      expect(inDbResubmitted?.status).toBe("PENDING_REVIEW");
      expect(inDbResubmitted?.rejectionReason).toBeUndefined();
    });
  });

  describe("6. Role-Based Authorization Security", () => {
    it("owner cannot edit another owner's property", async () => {
      const created = await propertyService.createOwnerProperty(
        {
          title: "Propriété de Salah",
          rentalCategory: "summer",
          propertyType: "Maison",
          city: "Mahdia",
          area: "Hiboun",
          pricing: { price: 1000, pricePeriod: "week" },
          images: [{ url: "https://test.com/img.jpg" }],
          asDraft: true,
        },
        ownerUser.id
      );

      // Attempt to edit as otherOwnerUser
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(otherOwnerUser);
      const editReq = new NextRequest(
        `http://localhost:3000/api/owner/properties/${created.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: "Hack title" }),
        }
      );

      const editRes = await updateOwnerProperty(editReq, {
        params: Promise.resolve({ id: created.id }),
      });
      expect(editRes.status).toBe(400); // Service throws ownership error
      const json = await editRes.json();
      expect(json.error).toContain("pas autorisé");
    });

    it("owner cannot call admin approve endpoint (returns 403)", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(ownerUser);

      const approveReq = new NextRequest(
        "http://localhost:3000/api/admin/properties/PROP-XYZ/approve",
        { method: "POST" }
      );

      const res = await approveAdminProperty(approveReq, {
        params: Promise.resolve({ id: "PROP-XYZ" }),
      });
      expect(res.status).toBe(403);
    });

    it("customer cannot call admin review endpoint (returns 403)", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(customerUser);

      const reviewReq = new NextRequest(
        "http://localhost:3000/api/admin/properties/PROP-XYZ/review",
        { method: "POST" }
      );

      const res = await reviewAdminProperty(reviewReq, {
        params: Promise.resolve({ id: "PROP-XYZ" }),
      });
      expect(res.status).toBe(403);
    });
  });
});

