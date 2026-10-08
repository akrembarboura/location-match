export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import connectToDatabase from "@/lib/mongoose";
import {
  HousingRequestModel,
  PropertyModel,
  DealModel,
  ReservationModel,
  NotificationModel,
  PropertyModerationEventModel,
} from "@/lib/models";

function getPropertyCoverImage(p: any): string {
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    const firstImg = p.images[0];
    if (typeof firstImg === "string" && firstImg.startsWith("http")) return firstImg;
    if (firstImg && typeof firstImg === "object" && firstImg.url) return firstImg.url;
  }
  if (p.coverImageId && typeof p.coverImageId === "string" && p.coverImageId.startsWith("http")) {
    return p.coverImageId;
  }
  return "";
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(20, parseInt(req.nextUrl.searchParams.get("limit") || "6", 10)));

    const [
      totalRequestsCount,
      openRequestsCount,
      totalPropertiesCount,
      publishedPropertiesCount,
      pausedPropertiesCount,
      unverifiedPropertiesCount,
      pendingPropertiesCount,
      unpaidReservationsCount,
      dealsCount,
      marginAggregate,
      deals,
      recentRequests,
      recentProperties,
      propertiesPage,
      requestStatusAggregate,
      paymentStatusAggregate,
      destinationDemandAggregate,
      notifications,
      moderationEvents,
    ] = await Promise.all([
      HousingRequestModel.countDocuments({}),
      HousingRequestModel.countDocuments({
        status: { $nin: ["COMPLETED", "REJECTED", "CANCELLED"] },
      }),
      PropertyModel.countDocuments({}),
      PropertyModel.countDocuments({ $or: [{ isPublished: true }, { status: "PUBLISHED" }] }),
      PropertyModel.countDocuments({ status: { $in: ["DRAFT", "ARCHIVED"] } }),
      PropertyModel.countDocuments({ verified: false }),
      PropertyModel.countDocuments({ status: { $in: ["PENDING_REVIEW", "UNDER_REVIEW"] } }),
      ReservationModel.countDocuments({ "paymentSummary.status": { $in: ["UNPAID", "REPORTED"] } }),
      DealModel.countDocuments({}),
      DealModel.aggregate([
        {
          $group: {
            _id: null,
            totalMargin: {
              $sum: { $subtract: ["$customerOffer", "$ownerPrice"] },
            },
          },
        },
      ]),
      DealModel.find({})
        .select("id property ownerPrice customerOffer closed createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      HousingRequestModel.find({})
        .select("id customer customerName phone rentalCategory kind destination area status stage createdAt submitted")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      PropertyModel.find({})
        .select("id title city area location rentalCategory pricing summerPrice studentPrice pricePerNight status verified images coverImageId createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      PropertyModel.find({})
        .select("id title city area location rentalCategory pricing summerPrice studentPrice pricePerNight status verified images coverImageId createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      HousingRequestModel.aggregate([
        { $group: { _id: { $ifNull: ["$status", "PENDING"] }, count: { $sum: 1 } } },
      ]),
      ReservationModel.aggregate([
        { $group: { _id: { $ifNull: ["$paymentSummary.status", "UNPAID"] }, count: { $sum: 1 } } },
      ]),
      HousingRequestModel.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$destination", { $ifNull: ["$area", "Mahdia"] }] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      NotificationModel.find({})
        .select("id title message type read createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      PropertyModerationEventModel.find({})
        .select("id propertyId action previousStatus newStatus reason createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate total margin from DB aggregation or fallback to recent deals
    const aggregatedMargin = marginAggregate[0]?.totalMargin;
    const totalMargin =
      typeof aggregatedMargin === "number" && aggregatedMargin >= 0
        ? aggregatedMargin
        : deals.reduce((acc, d: any) => {
            const margin = (d.customerOffer || 0) - (d.ownerPrice || 0);
            return acc + (margin > 0 ? margin : 0);
          }, 0);

    const conversionRate = totalRequestsCount > 0 ? Math.round((dealsCount / totalRequestsCount) * 100) : 0;

    // Build distributions
    const requestStatusDist: Record<string, number> = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      PROPERTY_PROPOSED: 0,
      CLIENT_CONFIRMATION: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    requestStatusAggregate.forEach((item: any) => {
      if (item._id) requestStatusDist[item._id] = item.count;
    });

    const paymentStatusDist: Record<string, number> = {
      UNPAID: 0,
      REPORTED: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      REFUNDED: 0,
    };
    paymentStatusAggregate.forEach((item: any) => {
      if (item._id) paymentStatusDist[item._id] = item.count;
    });

    const destinationDemand = destinationDemandAggregate.map((item: any) => ({
      destination: item._id || "Mahdia",
      count: item.count,
    }));

    // Build property performance items with attributed request & reservation counts
    const propertyPerformanceItems = await Promise.all(
      propertiesPage.map(async (p: any) => {
        const [resCount, reqCount] = await Promise.all([
          ReservationModel.countDocuments({ propertyId: p.id }),
          HousingRequestModel.countDocuments({
            $or: [{ selectedProperty: p.id }, { propertyId: p.id }, { "proposedProperties.propertyId": p.id }],
          }),
        ]);
        return {
          id: p.id,
          title: p.title || "Bien sans titre",
          city: p.city || p.location?.city || p.area || "Mahdia",
          rentalCategory: p.rentalCategory || "summer",
          price: p.pricing?.price || p.summerPrice || p.studentPrice || p.pricePerNight || 0,
          status: p.status || "DRAFT",
          verified: Boolean(p.verified),
          coverImage: getPropertyCoverImage(p),
          requestCount: reqCount,
          reservationCount: resCount,
          createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—",
        };
      })
    );

    // Format activity timeline
    const formattedNotifications = notifications.map((n: any) => ({
      id: n.id || String(n._id),
      title: n.title || "Notification Système",
      message: n.message || "",
      timestamp: n.createdAt ? new Date(n.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—",
      type: n.type || "SYSTEM",
    }));

    const formattedModeration = moderationEvents.map((m: any) => ({
      id: m.id || String(m._id),
      title: `Modération: Bien ${m.propertyId}`,
      message: `Action: ${m.action} → Status: ${m.newStatus}${m.reason ? ` (${m.reason})` : ""}`,
      timestamp: m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—",
      type: "MODERATION",
    }));

    let recentActivity = [...formattedNotifications, ...formattedModeration];
    if (recentActivity.length === 0) {
      recentActivity = recentRequests.slice(0, 4).map((r: any) => ({
        id: `act-req-${r.id}`,
        title: `Nouvelle demande ${r.id}`,
        message: `Demande de logement soumise pour ${r.destination || "Mahdia"}`,
        timestamp: r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—",
        type: "NEW_REQUEST",
      }));
    }

    const totalPages = Math.max(1, Math.ceil(totalPropertiesCount / limit));

    return NextResponse.json({
      actionNeeded: {
        pendingProperties: pendingPropertiesCount,
        openRequests: openRequestsCount,
        unpaidReservations: unpaidReservationsCount,
      },
      stats: {
        openRequests: openRequestsCount,
        properties: totalPropertiesCount,
        unverifiedProperties: unverifiedPropertiesCount,
        dealsCount: dealsCount,
        totalMargin: totalMargin,
      },
      marketplacePerformance: {
        totalInventory: totalPropertiesCount,
        publishedProperties: publishedPropertiesCount,
        pausedProperties: pausedPropertiesCount,
        activeRequests: openRequestsCount,
        confirmedReservations: dealsCount,
        totalMargin: totalMargin,
        conversionRate: conversionRate,
      },
      distributions: {
        requestStatus: requestStatusDist,
        paymentStatus: paymentStatusDist,
        destinationDemand: destinationDemand,
      },
      propertyPerformance: {
        properties: propertyPerformanceItems,
        pagination: {
          page,
          limit,
          total: totalPropertiesCount,
          totalPages,
        },
      },
      recentRequests: recentRequests.map((r: any) => ({
        id: r.id,
        customerName:
          (typeof r.customer === "string" && r.customer) ||
          r.customer?.fullName ||
          r.customerName ||
          (typeof r.customer === "object" && r.customer ? Object.values(r.customer).find((v) => typeof v === "string" && v) : null) ||
          "Client anonyme",
        customerPhone:
          (typeof r.customer === "object" && r.customer?.phone) ||
          r.phone ||
          "—",
        rentalCategory: r.rentalCategory || r.kind || "summer",
        destination: r.destination || r.area || "Mahdia",
        status: r.status || r.stage || "PENDING",
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : (r.submitted || "—"),
      })),
      recentProperties: recentProperties.map((p: any) => ({
        id: p.id,
        title: p.title || "Bien sans titre",
        city: p.city || p.location?.city || p.area || "Mahdia",
        rentalCategory: p.rentalCategory || "summer",
        price: p.pricing?.price || p.summerPrice || p.studentPrice || p.pricePerNight || 0,
        status: p.status || "DRAFT",
        verified: Boolean(p.verified),
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—",
      })),
      recentDeals: deals.map((d: any) => ({
        id: d.id,
        property: d.property,
        ownerPrice: d.ownerPrice,
        customerOffer: d.customerOffer,
        margin: (d.customerOffer || 0) - (d.ownerPrice || 0),
        closed: d.closed || (d.createdAt ? new Date(d.createdAt).toLocaleDateString("fr-FR") : "—"),
      })),
      recentActivity,
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/overview error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
