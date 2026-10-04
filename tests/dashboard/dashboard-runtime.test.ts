import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import {
  HousingRequestModel,
  NotificationModel,
  PropertyModel,
  OwnerModel,
  DealModel,
  UserModel,
} from "@/lib/models";
import { requestService } from "@/server/services/RequestService";
import { notificationService } from "@/server/services/NotificationService";
import { CreateRentalRequestSchema } from "@/lib/rentals/request-schema";
import { GET as getAdminOverview } from "@/app/api/admin/overview/route";
import { GET as getAdminProperties } from "@/app/api/admin/properties/route";
import {
  GET as getAdminNotifications,
  PATCH as markAllNotificationsRead,
} from "@/app/api/admin/notifications/route";
import { PATCH as markSingleNotificationRead } from "@/app/api/admin/notifications/[id]/read/route";
import { GET as getCustomerRequests } from "@/app/api/requests/route";
import { authService } from "@/server/services/AuthService";
import { NextRequest } from "next/server";
import crypto from "crypto";

describe("Dashboard & Notification Runtime Data Flow", () => {
  const customerId = "cust-user-123";

  const mockAdmin = {
    id: "admin-user",
    email: "admin@locmaison.com",
    role: "ADMIN" as const,
    firstName: "Admin",
    lastName: "System",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer = {
    id: customerId,
    email: "customer@test.com",
    role: "CUSTOMER" as const,
    firstName: "Test",
    lastName: "Customer",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    await connectToDatabase();

    // Create Admin User in MongoDB
    await UserModel.create({
      id: "admin-user",
      email: "admin@locmaison.com",
      passwordHash: "fakehash",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "System",
    });

    // Create Customer User in MongoDB
    await UserModel.create({
      id: customerId,
      email: "customer@test.com",
      passwordHash: "fakehash",
      role: "CUSTOMER",
      firstName: "Test",
      lastName: "Customer",
    });
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await HousingRequestModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await OwnerModel.deleteMany({});
    await DealModel.deleteMany({});
  });

  describe("1. Rental Request & Notification Creation", () => {
    it("persists a request and automatically creates an admin notification with correct references", async () => {
      const input = {
        rentalCategory: "summer" as const,
        fullName: "Yassine Mansour",
        phone: "22 345 678",
        destination: "Mahdia",
        checkIn: "2026-07-01",
        checkOut: "2026-07-15",
        guests: 4,
        budget: 1500,
        budgetPeriod: "week" as const,
        amenities: ["Climatisation"],
      };

      const parsed = CreateRentalRequestSchema.parse(input);
      const created = await requestService.createRequest(parsed, customerId);

      // Verify HousingRequest in MongoDB
      const reqInDb = await HousingRequestModel.findOne({ id: created.id }).lean();
      expect(reqInDb).toBeDefined();
      expect(reqInDb?.customer?.fullName).toBe("Yassine Mansour");
      expect(reqInDb?.customerId).toBe(customerId);
      expect(reqInDb?.status).toBe("PENDING");

      // Verify Notification in MongoDB
      const notifs = await NotificationModel.find({ recipientRole: "ADMIN" }).lean();
      expect(notifs.length).toBe(1);
      expect(notifs[0].requestId).toBe(created.id);
      expect(notifs[0].type).toBe("NEW_REQUEST");
      expect(notifs[0].read).toBe(false);
      expect(notifs[0].message).toContain("Yassine Mansour");
      expect(notifs[0].message).toContain("Mahdia");
    });
  });

  describe("2. Admin Notifications API", () => {
    it("returns notifications and unreadCount to authenticated admins", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockAdmin);

      await notificationService.createNotification({
        type: "NEW_REQUEST",
        title: "Demande test",
        message: "Message test",
        requestId: "REQ-001",
        recipientRole: "ADMIN",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/notifications");
      const res = await getAdminNotifications(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.notifications.length).toBe(1);
      expect(json.unreadCount).toBe(1);
      expect(json.notifications[0].requestId).toBe("REQ-001");
    });

    it("allows marking a single notification as read", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockAdmin);

      const created = await notificationService.createNotification({
        type: "NEW_REQUEST",
        title: "Demande à marquer",
        message: "Contenu",
        requestId: "REQ-002",
        recipientRole: "ADMIN",
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/notifications/${created.id}/read`, {
        method: "PATCH",
      });

      const res = await markSingleNotificationRead(req, {
        params: Promise.resolve({ id: created.id }),
      });
      expect(res.status).toBe(200);

      const inDb = await NotificationModel.findOne({ id: created.id }).lean();
      expect(inDb?.read).toBe(true);
    });

    it("allows marking all notifications as read", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockAdmin);

      await notificationService.createNotification({
        title: "N1",
        message: "M1",
        recipientRole: "ADMIN",
      });
      await notificationService.createNotification({
        title: "N2",
        message: "M2",
        recipientRole: "ADMIN",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/notifications", {
        method: "PATCH",
      });

      const res = await markAllNotificationsRead(req);
      expect(res.status).toBe(200);

      const unreadCount = await notificationService.getUnreadCount("ADMIN");
      expect(unreadCount).toBe(0);
    });

    it("rejects unauthenticated requests to notifications API with 401", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/admin/notifications");
      const res = await getAdminNotifications(req);
      expect(res.status).toBe(401);
    });

    it("rejects non-admin customer with 403", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockCustomer);
      const req = new NextRequest("http://localhost:3000/api/admin/notifications");
      const res = await getAdminNotifications(req);
      expect(res.status).toBe(403);
    });
  });

  describe("3. Admin Overview API & Real KPIs", () => {
    it("aggregates real KPIs from MongoDB collections", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockAdmin);

      // 1 open request, 1 completed request
      await HousingRequestModel.create({
        id: "REQ-OPEN",
        status: "PENDING",
        rentalCategory: "summer",
      });
      await HousingRequestModel.create({
        id: "REQ-DONE",
        status: "COMPLETED",
        rentalCategory: "summer",
      });

      // 2 properties (1 verified, 1 unverified)
      await PropertyModel.create({
        id: "PROP-1",
        title: "Villa 1",
        verified: true,
      });
      await PropertyModel.create({
        id: "PROP-2",
        title: "Villa 2",
        verified: false,
      });

      // 1 deal with 300 DT margin
      await DealModel.create({
        id: "DEAL-1",
        request: "REQ-OPEN",
        property: "PROP-1",
        ownerPrice: 1200,
        customerOffer: 1500,
        closed: "04/10/2026",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/overview");
      const res = await getAdminOverview(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.stats.openRequests).toBe(1);
      expect(json.stats.properties).toBe(2);
      expect(json.stats.unverifiedProperties).toBe(1);
      expect(json.stats.dealsCount).toBe(1);
      expect(json.stats.totalMargin).toBe(300);
      expect(json.recentDeals.length).toBe(1);
      expect(json.recentDeals[0].margin).toBe(300);
    });
  });

  describe("4. Admin Properties API", () => {
    it("returns real properties merged with owner details", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockAdmin);

      await OwnerModel.create({
        id: "OWNER-1",
        name: "Hedi Ben Salah",
        phone: "+216 98 111 222",
      });

      await PropertyModel.create({
        id: "PROP-100",
        title: "Appartement vue mer",
        type: "Appartement",
        area: "Zone touristique",
        summerPrice: 900,
        studentPrice: 450,
        verified: true,
        status: "DISPONIBLE",
        ownerId: "OWNER-1",
      });

      const req = new NextRequest("http://localhost:3000/api/admin/properties");
      const res = await getAdminProperties(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.totalCount).toBe(1);
      expect(json.properties[0].id).toBe("PROP-100");
      expect(json.properties[0].owner?.name).toBe("Hedi Ben Salah");
      expect(json.properties[0].owner?.phone).toBe("+216 98 111 222");
    });
  });

  describe("5. Customer Dashboard Demands API", () => {
    it("returns only requests belonging to the logged-in customer", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(mockCustomer);

      // Customer's request
      await HousingRequestModel.create({
        id: "REQ-MY",
        customerId: customerId,
        destination: "Mahdia",
        rentalCategory: "summer",
        status: "PENDING",
      });

      // Another user's request
      await HousingRequestModel.create({
        id: "REQ-OTHER",
        customerId: "other-user",
        destination: "Hammamet",
        rentalCategory: "summer",
        status: "PENDING",
      });

      const req = new NextRequest("http://localhost:3000/api/requests");
      const res = await getCustomerRequests(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.length).toBe(1);
      expect(json[0].id).toBe("REQ-MY");
      expect(json[0].destination).toBe("Mahdia");
    });

    it("returns 401 when customer is not authenticated", async () => {
      vi.spyOn(authService, "getCurrentUser").mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/requests");
      const res = await getCustomerRequests(req);
      expect(res.status).toBe(401);
    });
  });
});
