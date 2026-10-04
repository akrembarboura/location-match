import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import connectToDatabase from "@/lib/mongoose";
import {
  PropertyModel,
  HousingRequestModel,
  AnalyticsEventModel,
  UserModel,
} from "@/lib/models";
import { analyticsRepository } from "@/server/analytics/AnalyticsRepository";
import { analyticsService } from "@/server/analytics/AnalyticsService";
import { propertyService } from "@/server/services/PropertyService";
import { requestService } from "@/server/services/RequestService";
import { TrackEventInputSchema } from "@/lib/analytics/validations";
import { AuthorizationError } from "@/server/utils/auth-guards";

describe("Production Analytics & Property Performance System", () => {
  const adminUser = {
    id: "admin-analytics-01",
    email: "admin@locmaison.com",
    role: "ADMIN" as const,
    firstName: "Admin",
    lastName: "Platform",
  };

  const ownerA = {
    id: "owner-usr-A",
    email: "ownerA@locmaison.com",
    role: "OWNER" as const,
    firstName: "Hichem",
    lastName: "Mahdia",
  };

  const ownerB = {
    id: "owner-usr-B",
    email: "ownerB@locmaison.com",
    role: "OWNER" as const,
    firstName: "Karim",
    lastName: "Sousse",
  };

  beforeAll(async () => {
    await connectToDatabase();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await PropertyModel.deleteMany({});
    await HousingRequestModel.deleteMany({});
    await AnalyticsEventModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  describe("1. Validation & Privacy Protection", () => {
    it("rejects unknown event names", () => {
      const parsed = TrackEventInputSchema.safeParse({
        eventName: "hacked_event_unregistered",
      });
      expect(parsed.success).toBe(false);
    });

    it("sanitizes and strips forbidden sensitive fields from properties metadata", () => {
      const parsed = TrackEventInputSchema.safeParse({
        eventName: "search_performed",
        city: "Mahdia",
        properties: {
          destination: "Mahdia",
          guests: 4,
          password: "mySecretPassword123",
          token: "eyJhbGciOi...",
          jwt: "secret_jwt",
          phone: "+21622123456",
          email: "customer@private.com",
        },
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.properties).toBeDefined();
        const props: any = parsed.data.properties;
        expect(props.destination).toBe("Mahdia");
        expect(props.guests).toBe(4);
        expect(props.password).toBeUndefined();
        expect(props.token).toBeUndefined();
        expect(props.jwt).toBeUndefined();
        expect(props.phone).toBeUndefined();
        expect(props.email).toBeUndefined();
      }
    });
  });

  describe("2. Behavioral Event Ingestion & Repository", () => {
    it("successfully records analytics events with unique identifiers", async () => {
      await analyticsRepository.recordEvent({
        eventName: "property_viewed",
        propertyId: "PROP-TEST-01",
        city: "Mahdia",
        rentalCategory: "summer",
        anonymousId: "anon-uuid-1",
        sessionId: "sess-uuid-1",
        actorType: "CUSTOMER",
      });

      const count = await AnalyticsEventModel.countDocuments({
        propertyId: "PROP-TEST-01",
        eventName: "property_viewed",
      });
      expect(count).toBe(1);

      const views = await analyticsRepository.getPropertyViews("PROP-TEST-01");
      expect(views).toBe(1);
    });

    it("aggregates net favorites (favorited minus unfavorited)", async () => {
      // 3 favorites, 1 unfavorite = net 2
      await analyticsRepository.recordEvent({
        eventName: "property_favorited",
        propertyId: "PROP-TEST-FAV",
        anonymousId: "user-1",
      });
      await analyticsRepository.recordEvent({
        eventName: "property_favorited",
        propertyId: "PROP-TEST-FAV",
        anonymousId: "user-2",
      });
      await analyticsRepository.recordEvent({
        eventName: "property_favorited",
        propertyId: "PROP-TEST-FAV",
        anonymousId: "user-3",
      });
      await analyticsRepository.recordEvent({
        eventName: "property_unfavorited",
        propertyId: "PROP-TEST-FAV",
        anonymousId: "user-2",
      });

      const netFavs = await analyticsRepository.getPropertyFavorites("PROP-TEST-FAV");
      expect(netFavs).toBe(2);
    });
  });

  describe("3. Property Performance Calculation & Conversion Rates", () => {
    it("computes accurate performance and conversions from real events and business state", async () => {
      const propId = "PROP-MAHDIA-99";

      // 1. Create published property
      await PropertyModel.create({
        id: propId,
        title: "Villa Les Palmiers Mahdia",
        city: "Mahdia",
        rentalCategory: "summer",
        propertyType: "Villa",
        ownerId: ownerA.id,
        status: "PUBLISHED",
        isPublished: true,
        availabilityStatus: "RESERVED",
        reservation: {
          from: new Date("2026-07-01"),
          to: new Date("2026-07-08"),
          updatedAt: new Date(),
          updatedBy: adminUser.id,
        },
      });

      // 2. Add 20 views
      for (let i = 0; i < 20; i++) {
        await analyticsRepository.recordEvent({
          eventName: "property_viewed",
          propertyId: propId,
          city: "Mahdia",
          anonymousId: `anon-${i}`,
        });
      }

      // 3. Add 4 rental requests targeting this property
      for (let i = 0; i < 4; i++) {
        await HousingRequestModel.create({
          id: `REQ-2026-00${i}`,
          propertyId: propId,
          customer: { fullName: `Client ${i}`, phone: "22123456" },
          destination: "Mahdia",
          rentalCategory: "summer",
          checkIn: "2026-07-01",
          checkOut: "2026-07-08",
          status: "CONFIRMED",
          proposedProperties: [
            {
              propertyId: propId,
              proposedPrice: 1800,
              status: i === 0 ? "ACCEPTED" : "PENDING_CLIENT",
            },
          ],
        });
      }

      const perf = await analyticsService.getPropertyPerformance(propId);
      expect(perf).not.toBeNull();
      if (perf) {
        expect(perf.views).toBe(20);
        expect(perf.requests).toBe(4);
        expect(perf.proposals).toBe(4);
        expect(perf.acceptedProposals).toBe(1);
        expect(perf.reservations).toBe(1);

        // View -> Request = (4 / 20) * 100 = 20%
        expect(perf.conversionRates.viewToRequest).toBe(20);
        // Request -> Proposal = (4 / 4) * 100 = 100%
        expect(perf.conversionRates.requestToProposal).toBe(100);
        // Proposal -> Reservation = (1 / 4) * 100 = 25%
        expect(perf.conversionRates.proposalToReservation).toBe(25);
        // View -> Reservation = (1 / 20) * 100 = 5%
        expect(perf.conversionRates.viewToReservation).toBe(5);
      }
    });

    it("handles zero views and zero requests without NaN or crash", async () => {
      const propId = "PROP-EMPTY-01";
      await PropertyModel.create({
        id: propId,
        title: "Appartement Neuf",
        city: "Mahdia",
        ownerId: ownerA.id,
        status: "PUBLISHED",
        isPublished: true,
      });

      const perf = await analyticsService.getPropertyPerformance(propId);
      expect(perf).not.toBeNull();
      if (perf) {
        expect(perf.views).toBe(0);
        expect(perf.requests).toBe(0);
        expect(perf.conversionRates.viewToRequest).toBe(0);
        expect(perf.conversionRates.requestToProposal).toBe(0);
        expect(perf.conversionRates.proposalToReservation).toBe(0);
        expect(perf.conversionRates.viewToReservation).toBe(0);
      }
    });
  });

  describe("4. Owner Access Control & IDOR Prevention", () => {
    it("allows owner to view analytics of their own property", async () => {
      const propId = "PROP-OWNER-A-01";
      await PropertyModel.create({
        id: propId,
        title: "Maison S+2 Mahdia",
        city: "Mahdia",
        ownerId: ownerA.id,
        status: "PUBLISHED",
        isPublished: true,
      });

      const data = await analyticsService.getOwnerPropertyPerformance(propId, ownerA);
      expect(data).toBeDefined();
      expect(data.propertyId).toBe(propId);
      expect(data.title).toBe("Maison S+2 Mahdia");
    });

    it("prevents Owner B from viewing Owner A's property analytics (IDOR check)", async () => {
      const propId = "PROP-OWNER-A-02";
      await PropertyModel.create({
        id: propId,
        title: "Villa Privée",
        city: "Mahdia",
        ownerId: ownerA.id,
        status: "PUBLISHED",
        isPublished: true,
      });

      await expect(
        analyticsService.getOwnerPropertyPerformance(propId, ownerB)
      ).rejects.toThrow(AuthorizationError);
    });

    it("allows ADMIN to inspect analytics of any owner's property", async () => {
      const propId = "PROP-OWNER-A-03";
      await PropertyModel.create({
        id: propId,
        title: "Villa de Luxe",
        city: "Mahdia",
        ownerId: ownerA.id,
        status: "PUBLISHED",
        isPublished: true,
      });

      const data = await analyticsService.getOwnerPropertyPerformance(propId, adminUser);
      expect(data).toBeDefined();
      expect(data.propertyId).toBe(propId);
    });
  });

  describe("5. Lifecycle Event Dispatchers", () => {
    it("records reservation_confirmed and reservation_released on admin reservation actions", async () => {
      const propId = "PROP-RESERVE-EVT";
      await PropertyModel.create({
        id: propId,
        title: "Villa Bord de Mer",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
        availabilityStatus: "AVAILABLE",
        ownerId: ownerA.id,
      });

      // 1. Reserve
      await propertyService.reserveProperty(
        propId,
        { from: new Date("2026-08-01"), to: new Date("2026-08-08") },
        adminUser.id
      );

      const confirmedEvents = await AnalyticsEventModel.countDocuments({
        propertyId: propId,
        eventName: "reservation_confirmed",
      });
      expect(confirmedEvents).toBe(1);

      // 2. Release
      await propertyService.releaseReservation(propId, adminUser.id);

      const releasedEvents = await AnalyticsEventModel.countDocuments({
        propertyId: propId,
        eventName: "reservation_released",
      });
      expect(releasedEvents).toBe(1);
    });

    it("records proposal_created and proposal_accepted on proposal actions", async () => {
      const propId = "PROP-PROP-EVT";
      await PropertyModel.create({
        id: propId,
        title: "Appartement Zone Tour",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
        ownerId: ownerA.id,
      });

      const req = await HousingRequestModel.create({
        id: "REQ-PROP-01",
        customer: { fullName: "Ali", phone: "22000111" },
        destination: "Mahdia",
        status: "PENDING",
      });

      // 1. Add proposal
      await requestService.addProposal(req.id, {
        propertyId: propId,
        proposedPrice: 1200,
        adminMessage: "Disponible pour vous",
      });

      const createdProps = await AnalyticsEventModel.countDocuments({
        propertyId: propId,
        eventName: "proposal_created",
      });
      expect(createdProps).toBe(1);

      // 2. Respond to proposal
      await requestService.respondToProposal(req.id, propId, "ACCEPTED");

      const acceptedProps = await AnalyticsEventModel.countDocuments({
        propertyId: propId,
        eventName: "proposal_accepted",
      });
      expect(acceptedProps).toBe(1);
    });
  });

  describe("6. Admin Overview Aggregation & Funnels", () => {
    it("aggregates overview metrics, funnels, and identifies low-conversion properties", async () => {
      // Create high-view property with 0 requests
      const propLowConv = "PROP-LOW-CONV";
      await PropertyModel.create({
        id: propLowConv,
        title: "Villa Trop Chère",
        city: "Mahdia",
        status: "PUBLISHED",
        isPublished: true,
        ownerId: ownerA.id,
      });

      for (let i = 0; i < 15; i++) {
        await analyticsRepository.recordEvent({
          eventName: "property_viewed",
          propertyId: propLowConv,
          city: "Mahdia",
          anonymousId: `anon-${i}`,
        });
      }

      // Record searches
      await analyticsRepository.recordEvent({
        eventName: "search_performed",
        city: "Mahdia",
        anonymousId: "searcher-1",
      });

      const overview = await analyticsService.getAdminOverview("30d");

      expect(overview.period).toBe("30d");
      expect(overview.stats.propertyViews).toBe(15);
      expect(overview.stats.searches).toBe(1);

      // Verify low conversion alert contains this property
      expect(overview.lowConversionProperties.some((p) => p.propertyId === propLowConv)).toBe(true);

      // Verify customer funnel metrics
      expect(overview.customerFunnel.propertyViews).toBe(15);
      expect(overview.customerFunnel.conversions).toBeDefined();
    });
  });

  describe("5. Cookie Consent & Privacy Controls", () => {
    it("manages cookie consent lifecycle (default undecided, grant, deny, and reset)", async () => {
      const {
        getConsentStatus,
        setConsentStatus,
        resetConsent,
        hasAnalyticsConsent,
      } = await import("@/lib/analytics/consent");

      // In node env without window, defaults to undecided
      expect(getConsentStatus()).toBe("undecided");
      expect(hasAnalyticsConsent()).toBe(false);

      // Mock browser window & storage
      const mockStorage: Record<string, string> = {};
      const mockListeners: Record<string, Function[]> = {};
      const mockWindow = {
        localStorage: {
          getItem: (k: string) => mockStorage[k] || null,
          setItem: (k: string, v: string) => {
            mockStorage[k] = v;
          },
          removeItem: (k: string) => {
            delete mockStorage[k];
          },
        },
        document: {
          cookie: "",
        },
        addEventListener: (event: string, fn: Function) => {
          mockListeners[event] = mockListeners[event] || [];
          mockListeners[event].push(fn);
        },
        removeEventListener: (event: string, fn: Function) => {
          if (mockListeners[event]) {
            mockListeners[event] = mockListeners[event].filter((f) => f !== fn);
          }
        },
        dispatchEvent: (evt: any) => {
          const fns = mockListeners[evt.type] || [];
          fns.forEach((fn) => fn(evt));
          return true;
        },
      };

      vi.stubGlobal("window", mockWindow);
      vi.stubGlobal("localStorage", mockWindow.localStorage);
      vi.stubGlobal("document", mockWindow.document);

      // Initially undecided
      expect(getConsentStatus()).toBe("undecided");
      expect(hasAnalyticsConsent()).toBe(false);

      // Grant consent
      setConsentStatus("granted");
      expect(getConsentStatus()).toBe("granted");
      expect(hasAnalyticsConsent()).toBe(true);

      // Deny consent
      setConsentStatus("denied");
      expect(getConsentStatus()).toBe("denied");
      expect(hasAnalyticsConsent()).toBe(false);

      // Reset consent back to undecided
      resetConsent();
      expect(getConsentStatus()).toBe("undecided");
      expect(hasAnalyticsConsent()).toBe(false);

      vi.unstubAllGlobals();
    });
  });
});

