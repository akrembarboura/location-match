import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import { UserModel, OwnerModel, PropertyModel } from "@/lib/models";
import { adminOwnerService } from "@/server/services/AdminOwnerService";
import { GET as getAdminOwnersRoute } from "@/app/api/admin/owners/route";
import { NextRequest } from "next/server";
import { getSession } from "@/server/utils/auth";

vi.mock("@/server/utils/auth", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

describe("Admin Propriétaires Management API & Service", () => {
  const adminSession = { sub: "admin-id-123", role: "ADMIN", email: "admin@locmaison.tn" };
  const ownerSession = { sub: "owner-id-123", role: "OWNER", email: "owner@locmaison.tn" };
  const customerSession = { sub: "customer-id-123", role: "CUSTOMER", email: "customer@locmaison.tn" };

  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await UserModel.deleteMany({});
    await OwnerModel.deleteMany({});
    await PropertyModel.deleteMany({});

    // Create Admin User
    await UserModel.create({
      id: "admin-id-123",
      email: "admin@locmaison.tn",
      passwordHash: "$2b$10$hashedpassword",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "System",
      status: "ACTIVE",
    });
  });

  it("1. Only authorized ADMIN or SUPER_ADMIN can access GET /api/admin/owners", async () => {
    // Create Owner User & Customer User for authorization test
    await UserModel.create({
      id: "owner-id-123",
      email: "owner@locmaison.tn",
      passwordHash: "$2b$10$hashedpassword",
      role: "OWNER",
      firstName: "Owner",
      lastName: "User",
      status: "ACTIVE",
    });
    await UserModel.create({
      id: "customer-id-123",
      email: "customer@locmaison.tn",
      passwordHash: "$2b$10$hashedpassword",
      role: "CUSTOMER",
      firstName: "Customer",
      lastName: "User",
      status: "ACTIVE",
    });

    // Unauthenticated
    vi.mocked(getSession).mockResolvedValue(null);
    const req1 = new NextRequest("http://localhost/api/admin/owners");
    const res1 = await getAdminOwnersRoute(req1);
    expect(res1.status).toBe(401);

    // CUSTOMER role
    vi.mocked(getSession).mockResolvedValue(customerSession as any);
    const req2 = new NextRequest("http://localhost/api/admin/owners");
    const res2 = await getAdminOwnersRoute(req2);
    expect(res2.status).toBe(403);

    // OWNER role
    vi.mocked(getSession).mockResolvedValue(ownerSession as any);
    const req3 = new NextRequest("http://localhost/api/admin/owners");
    const res3 = await getAdminOwnersRoute(req3);
    expect(res3.status).toBe(403);

    // ADMIN role
    vi.mocked(getSession).mockResolvedValue(adminSession as any);
    const req4 = new NextRequest("http://localhost/api/admin/owners");
    const res4 = await getAdminOwnersRoute(req4);
    expect(res4.status).toBe(200);
  });

  it("2. Accurately calculates owner metrics and includes owners with 0 properties", async () => {
    // Create Owner 1 (2 published, 1 draft)
    await UserModel.create({
      id: "owner-1",
      email: "hedi@locmaison.tn",
      passwordHash: "$2b$10$secret",
      role: "OWNER",
      firstName: "Hedi",
      lastName: "Trabelsi",
      phone: "+21620000001",
      status: "ACTIVE",
    });

    await PropertyModel.create([
      {
        id: "prop-101",
        ownerId: "owner-1",
        title: "Villa Bord de Mer",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
      },
      {
        id: "prop-102",
        ownerId: "owner-1",
        title: "Appartement Corniche",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
      },
      {
        id: "prop-103",
        ownerId: "owner-1",
        title: "Brouillon Villa",
        city: "Mahdia",
        status: "DRAFT",
        isPublished: false,
      },
    ]);

    // Create Owner 2 (0 properties, pending status)
    await UserModel.create({
      id: "owner-2",
      email: "sonia@locmaison.tn",
      passwordHash: "$2b$10$secret",
      role: "OWNER",
      firstName: "Sonia",
      lastName: "Ben Salem",
      phone: "+21620000002",
      status: "PENDING",
    });

    const result = await adminOwnerService.getAdminOwners({ page: 1, limit: 10 });

    expect(result.metrics.totalOwners).toBe(2);
    expect(result.metrics.publishedProperties).toBe(2);
    expect(result.metrics.pendingVerification).toBe(1);

    expect(result.owners).toHaveLength(2);

    const owner1 = result.owners.find((o) => o.id === "owner-1");
    expect(owner1).toBeDefined();
    expect(owner1?.totalProperties).toBe(3);
    expect(owner1?.publishedProperties).toBe(2);
    expect(owner1?.draftProperties).toBe(1);

    const owner2 = result.owners.find((o) => o.id === "owner-2");
    expect(owner2).toBeDefined();
    expect(owner2?.totalProperties).toBe(0);
    expect(owner2?.publishedProperties).toBe(0);
    expect(owner2?.status).toBe("PENDING");
  });

  it("3. Filters by search query matching name, email, or phone", async () => {
    await UserModel.create([
      {
        id: "owner-a",
        email: "karim@gmail.com",
        passwordHash: "hash",
        role: "OWNER",
        firstName: "Karim",
        lastName: "Gharbi",
        phone: "+21650111222",
      },
      {
        id: "owner-b",
        email: "salma@yahoo.fr",
        passwordHash: "hash",
        role: "OWNER",
        firstName: "Salma",
        lastName: "Ayari",
        phone: "+21698765432",
      },
    ]);

    // Search by email
    const resEmail = await adminOwnerService.getAdminOwners({ search: "salma@yahoo" });
    expect(resEmail.owners).toHaveLength(1);
    expect(resEmail.owners[0].id).toBe("owner-b");

    // Search by name
    const resName = await adminOwnerService.getAdminOwners({ search: "Karim" });
    expect(resName.owners).toHaveLength(1);
    expect(resName.owners[0].id).toBe("owner-a");

    // Search by phone
    const resPhone = await adminOwnerService.getAdminOwners({ search: "50111222" });
    expect(resPhone.owners).toHaveLength(1);
    expect(resPhone.owners[0].id).toBe("owner-a");
  });

  it("4. Filters by account status and portfolio composition", async () => {
    await UserModel.create([
      {
        id: "owner-active",
        email: "active@owner.com",
        passwordHash: "hash",
        role: "OWNER",
        firstName: "Active",
        lastName: "Owner",
        status: "ACTIVE",
      },
      {
        id: "owner-pending",
        email: "pending@owner.com",
        passwordHash: "hash",
        role: "OWNER",
        firstName: "Pending",
        lastName: "Owner",
        status: "PENDING",
      },
    ]);

    await PropertyModel.create([
      {
        id: "prop-active-1",
        ownerId: "owner-active",
        title: "Prop Active",
        status: "PUBLISHED",
        isPublished: true,
      },
    ]);

    // Filter status
    const statusRes = await adminOwnerService.getAdminOwners({ status: "PENDING" });
    expect(statusRes.owners).toHaveLength(1);
    expect(statusRes.owners[0].id).toBe("owner-pending");

    // Portfolio filter: WITH_PUBLISHED
    const portfolioPublished = await adminOwnerService.getAdminOwners({ portfolio: "WITH_PUBLISHED" });
    expect(portfolioPublished.owners).toHaveLength(1);
    expect(portfolioPublished.owners[0].id).toBe("owner-active");

    // Portfolio filter: NO_PROPERTIES
    const portfolioEmpty = await adminOwnerService.getAdminOwners({ portfolio: "NO_PROPERTIES" });
    expect(portfolioEmpty.owners).toHaveLength(1);
    expect(portfolioEmpty.owners[0].id).toBe("owner-pending");
  });

  it("5. Excludes passwordHash, reset tokens, and sensitive credentials from output DTO", async () => {
    await UserModel.create({
      id: "owner-secret",
      email: "secret@owner.com",
      passwordHash: "$2b$10$SUPER_SECRET_HASH",
      resetPasswordToken: "TOKEN123",
      role: "OWNER",
      firstName: "Secret",
      lastName: "Owner",
    });

    const result = await adminOwnerService.getAdminOwners({});
    expect(result.owners).toHaveLength(1);
    const ownerObj = result.owners[0] as any;
    expect(ownerObj.passwordHash).toBeUndefined();
    expect(ownerObj.resetPasswordToken).toBeUndefined();
  });
});
