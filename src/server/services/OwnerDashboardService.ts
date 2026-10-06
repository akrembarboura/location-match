import { PropertyModel, NotificationModel } from "@/lib/models";
import { reservationRepository } from "../repositories/ReservationRepository";
import { paymentRepository } from "../repositories/PaymentRepository";
import { calculateRemainingDays, isSameDay, isWithinThisWeek, formatDateFr, formatDateRangeFr } from "@/lib/date-utils";
import connectToDatabase from "@/lib/mongoose";

export class OwnerDashboardService {
  async getDashboardOverview(ownerId: string) {
    await connectToDatabase();

    // 1. Fetch owner properties
    const properties = await PropertyModel.find({ ownerId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const totalProperties = properties.length;
    const publishedCount = properties.filter((p: any) => p.status === "PUBLISHED" || p.isPublished === true).length;
    const pendingCount = properties.filter(
      (p: any) => p.status === "PENDING_REVIEW" || p.status === "UNDER_REVIEW"
    ).length;

    // 2. Sync and fetch owner reservations
    const reservations = await reservationRepository.findByOwnerId(ownerId);

    const now = new Date();

    // Compute operational metrics
    let rentedCount = 0;
    let arrivalsThisWeekCount = 0;
    let departuresThisWeekCount = 0;
    let totalPaidRevenue = 0;
    let paymentsToReceive = 0;
    let arrivalsTodayCount = 0;
    let departuresTodayCount = 0;
    let pendingPaymentsCount = 0;

    const upcomingArrivals: any[] = [];
    const upcomingDepartures: any[] = [];
    const activeRentals: any[] = [];

    for (const res of reservations) {
      const remainingInfo = calculateRemainingDays(res.checkIn, res.checkOut, now);

      const checkInDate = new Date(res.checkIn);
      const checkOutDate = new Date(res.checkOut);

      // Revenue tracking
      const paid = (res.paymentSummary?.paidAmount || 0) + (res.paymentSummary?.reportedAmount || 0);
      const remaining = res.paymentSummary?.remainingAmount !== undefined
        ? res.paymentSummary.remainingAmount
        : Math.max(0, (res.pricing?.total || 0) - paid);
      totalPaidRevenue += paid;

      if (remainingInfo.status === "ACTIVE" || remainingInfo.status === "UPCOMING") {
        paymentsToReceive += remaining;
        if (res.paymentSummary?.status === "UNPAID" || res.paymentSummary?.status === "PARTIALLY_PAID") {
          pendingPaymentsCount++;
        }
      }

      if (remainingInfo.status === "ACTIVE") {
        rentedCount++;
        activeRentals.push({
          ...res,
          remainingInfo,
        });
      }

      if (isSameDay(checkInDate, now)) {
        arrivalsTodayCount++;
      }
      if (isSameDay(checkOutDate, now)) {
        departuresTodayCount++;
      }

      if (isWithinThisWeek(checkInDate, now)) {
        arrivalsThisWeekCount++;
        upcomingArrivals.push({
          ...res,
          remainingInfo,
          formattedCheckIn: formatDateFr(checkInDate),
          formattedCheckOut: formatDateFr(checkOutDate),
          formattedRange: formatDateRangeFr(checkInDate, checkOutDate),
        });
      }

      if (isWithinThisWeek(checkOutDate, now)) {
        departuresThisWeekCount++;
        upcomingDepartures.push({
          ...res,
          remainingInfo,
          formattedCheckIn: formatDateFr(checkInDate),
          formattedCheckOut: formatDateFr(checkOutDate),
          formattedRange: formatDateRangeFr(checkInDate, checkOutDate),
        });
      }
    }

    const availableCount = Math.max(0, publishedCount - rentedCount);

    // Notifications for owner
    const notifications = await NotificationModel.find({
      $or: [{ recipientId: ownerId }, { recipientRole: "OWNER" }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();

    // Map properties for UI overview
    const mappedProperties = properties.map((p: any) => {
      const coverUrl =
        p.images?.[0]?.url ||
        (typeof p.images?.[0] === "string" ? p.images[0] : null) ||
        "/placeholder-property.jpg";

      // Check if currently rented
      const activeRes = activeRentals.find((r) => r.propertyId === p.id);

      let availBadge = "AVAILABLE";
      if (activeRes) availBadge = "RENTED";
      else if (p.status === "PENDING_REVIEW" || p.status === "UNDER_REVIEW") availBadge = "PENDING";
      else if (p.status === "REJECTED") availBadge = "ACTION_REQUIRED";
      else if (p.status !== "PUBLISHED") availBadge = "UNAVAILABLE";

      return {
        id: p.id,
        title: p.title,
        city: p.city || p.location?.city || "Mahdia",
        propertyType: p.propertyType || "Logement",
        price: p.pricing?.price || p.pricePerNight || p.summerPrice || p.studentPrice || 0,
        pricePeriod: p.pricing?.pricePeriod || "semaine",
        bedrooms: p.capacity?.bedrooms || p.bedrooms || 1,
        guests: p.capacity?.guests || p.guests || 1,
        coverImage: coverUrl,
        status: p.status,
        availabilityBadge: availBadge,
        activeRental: activeRes
          ? {
              customerName: activeRes.customerName,
              checkOut: formatDateFr(activeRes.checkOut),
              remainingLabel: activeRes.remainingInfo.label,
            }
          : null,
      };
    });

    return {
      kpis: {
        totalProperties,
        availableProperties: availableCount,
        rentedProperties: rentedCount,
        pendingProperties: pendingCount,
        arrivalsThisWeek: arrivalsThisWeekCount,
        departuresThisWeek: departuresThisWeekCount,
        paymentsToReceive,
        confirmedReservations: reservations.length,
        grossRevenue: totalPaidRevenue,
      },
      today: {
        available: availableCount,
        rented: rentedCount,
        arrivalsToday: arrivalsTodayCount,
        departuresToday: departuresTodayCount,
        paymentsPending: pendingPaymentsCount,
      },
      upcomingArrivals,
      upcomingDepartures,
      activeRentals,
      properties: mappedProperties,
      notifications: notifications || [],
    };
  }

  async getCalendarData(ownerId: string, propertyId?: string, month?: number, year?: number) {
    await connectToDatabase();
    const reservations = await reservationRepository.findByOwnerId(ownerId, { propertyId });

    const properties = await PropertyModel.find({ ownerId })
      .select("id title city location coverImageId images availabilityStatus")
      .lean()
      .exec();

    const formattedEvents = reservations.map((res: any) => {
      const remainingInfo = calculateRemainingDays(res.checkIn, res.checkOut);
      return {
        id: res.id,
        propertyId: res.propertyId,
        propertyTitle: res.propertyTitle,
        customerName: res.customerName,
        customerPhone: res.customerPhone || null,
        customerEmail: res.customerEmail || null,
        contactVisibility: res.contactVisibility || "HIDDEN",
        guests: res.guests,
        checkIn: res.checkIn,
        checkOut: res.checkOut,
        formattedRange: formatDateRangeFr(res.checkIn, res.checkOut),
        totalAmount: res.pricing?.total || 0,
        paidAmount: res.paymentSummary?.paidAmount || 0,
        remainingAmount: res.paymentSummary?.remainingAmount || 0,
        paymentStatus: res.paymentSummary?.status || "UNPAID",
        status: res.status,
        remainingInfo,
      };
    });

    return {
      properties: properties.map((p: any) => ({
        id: p.id,
        title: p.title,
        city: p.city || p.location?.city || "Mahdia",
      })),
      events: formattedEvents,
    };
  }

  async getFinancialSummary(ownerId: string) {
    await connectToDatabase();
    const reservations = await reservationRepository.findByOwnerId(ownerId);
    const payments = await paymentRepository.findByOwnerId(ownerId);

    const properties = await PropertyModel.find({ ownerId }).select("id title city").lean().exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    let grossRevenue = 0;
    let totalPaid = 0;
    let totalToReceive = 0;

    const propertyFinancials: Record<string, { id: string; title: string; gross: number; paid: number; remaining: number; reservationsCount: number }> = {};

    for (const p of properties) {
      propertyFinancials[p.id] = {
        id: p.id,
        title: p.title,
        gross: 0,
        paid: 0,
        remaining: 0,
        reservationsCount: 0,
      };
    }

    for (const res of reservations) {
      const total = res.pricing?.total || 0;
      const paid = (res.paymentSummary?.paidAmount || 0) + (res.paymentSummary?.reportedAmount || 0);
      const remaining = res.paymentSummary?.remainingAmount !== undefined
        ? res.paymentSummary.remainingAmount
        : Math.max(0, total - paid);

      grossRevenue += total;
      totalPaid += paid;
      totalToReceive += remaining;

      if (propertyFinancials[res.propertyId]) {
        propertyFinancials[res.propertyId].gross += total;
        propertyFinancials[res.propertyId].paid += paid;
        propertyFinancials[res.propertyId].remaining += remaining;
        propertyFinancials[res.propertyId].reservationsCount += 1;
      }
    }

    return {
      summary: {
        grossRevenue,
        totalPaid,
        totalToReceive,
        confirmedCount: reservations.length,
      },
      propertyBreakdown: Object.values(propertyFinancials),
      recentPayments: payments.slice(0, 10),
    };
  }
}

export const ownerDashboardService = new OwnerDashboardService();
