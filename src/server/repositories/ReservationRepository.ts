import { ReservationModel, PropertyModel, HousingRequestModel, PaymentModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import { calculateNights } from "@/lib/date-utils";
import crypto from "node:crypto";
import { ContactReleasePolicy } from "../services/ContactReleasePolicy";
import { quoteForProperty } from "@/lib/pricing/pricing.service";
import { commissionPolicyService } from "../services/CommissionPolicyService";
import { financeLedgerService } from "../services/FinanceLedgerService";

export function formatCustomerContactForOwner(
  res: {
    status?: string;
    paymentSummary?: { status?: string; paidAmount?: number };
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    contactAccessOverride?: { enabled?: boolean; grantedBy?: string; grantedAt?: Date | string; reason?: string };
  },
  isAuthorizedOwner: boolean = true
) {
  const evalResult = ContactReleasePolicy.evaluate({
    reservationStatus: res.status,
    paymentStatus: res.paymentSummary?.status,
    paidAmount: res.paymentSummary?.paidAmount,
    isAuthorizedOwner,
    hasAdminOverride: Boolean(res.contactAccessOverride?.enabled),
  });

  let customerName = res.customerName || "Client LOC MAISON";
  if (!evalResult.visible && customerName) {
    const parts = customerName.trim().split(/\s+/);
    if (parts.length > 1) {
      customerName = `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
  }

  return {
    contactVisibility: evalResult.contactVisibility,
    visible: evalResult.visible,
    reason: evalResult.reason,
    customerName,
    customerPhone: evalResult.visible ? res.customerPhone || null : null,
    customerEmail: evalResult.visible ? res.customerEmail || null : null,
    contactAccessOverride: res.contactAccessOverride || null,
  };
}

export class ReservationRepository {
  /**
   * Syncs confirmed HousingRequests & Property reservations into ReservationModel documents for an owner
   */
  async syncOwnerReservations(ownerId: string): Promise<void> {
    await connectToDatabase();

    // 1. Get owner's property IDs
    const properties = await PropertyModel.find({ ownerId }).select("id title pricePerNight summerPrice studentPrice pricing availabilityStatus reservation").lean().exec();
    if (!properties || properties.length === 0) return;

    const propertyIds = properties.map((p: any) => p.id);
    const propertyMap = new Map(properties.map((p: any) => [p.id, p]));

    // 2. Find confirmed requests for these properties
    const confirmedRequests = await HousingRequestModel.find({
      $or: [{ propertyId: { $in: propertyIds } }, { selectedProperty: { $in: propertyIds } }],
      status: "CONFIRMED",
    }).lean().exec();

    for (const req of confirmedRequests) {
      const propId = req.propertyId || req.selectedProperty;
      if (!propId) continue;
      const prop = propertyMap.get(propId);
      if (!prop) continue;

      const checkInDate = req.checkIn ? new Date(req.checkIn) : new Date();
      const checkOutDate = req.checkOut ? new Date(req.checkOut) : new Date(Date.now() + 3 * 86400000);

      const existingRes = await ReservationModel.findOne({
        $or: [{ requestId: req.id }, { propertyId: propId, checkIn: checkInDate }],
      }).exec();

      if (!existingRes) {
        const nights = calculateNights(checkInDate, checkOutDate);
        let quote;
        try {
          quote = quoteForProperty(prop, checkInDate, checkOutDate);
        } catch (err) {
          console.error(`[pricing] skipped reservation for request ${req.id}:`, err);
          continue;
        }
        const total = quote.total;

        // Check if there are existing payment records
        const resId = `LM-${new Date().getFullYear()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
        const existingPayments = await PaymentModel.find({ reservationId: resId }).lean().exec();
        const paidAmount = existingPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        const remainingAmount = Math.max(0, total - paidAmount);

        let payStatus = "UNPAID";
        if (paidAmount >= total) payStatus = "PAID";
        else if (paidAmount > 0) payStatus = "PARTIALLY_PAID";

        await ReservationModel.create({
          id: resId,
          requestId: req.id,
          propertyId: propId,
          ownerId,
          customerId: req.customerId || undefined,
          customerName: req.customer?.fullName || req.customer?.name || "Client LOC MAISON",
          customerPhone: req.customer?.phone || req.phone || "",
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: req.guests || req.people || 1,
          status: "CONFIRMED",
          pricing: {
            pricePerNight: nights > 0 ? Math.round((total / nights) * 1000) / 1000 : 0,
            totalNights: nights,
            subtotal: total,
            total,
            unitPrice: quote.unitPrice,
            pricePeriod: quote.pricePeriod,
            quantity: quote.quantity,
            currency: quote.currency,
          },
          paymentSummary: {
            paidAmount,
            remainingAmount,
            status: payStatus,
          },
        });

        try {
          const snapshot = await commissionPolicyService.createSnapshotAtConfirmation({
            reservationId: resId,
            propertyId: propId,
            ownerId,
            rentalBasis: total,
            collectionFlow: "OWNER_DIRECT",
            confirmedAt: checkInDate,
          });
          await financeLedgerService.postCommissionObligation(
            { id: resId, propertyId: propId, ownerId, customerId: req.customerId || undefined },
            snapshot
          );
        } catch (finErr) {
          console.error("Failed to post commission obligation on reservation sync:", finErr);
        }
      }
    }

    // 3. Also check properties with availabilityStatus === "RESERVED" that don't have a HousingRequest
    for (const prop of properties) {
      if (prop.availabilityStatus === "RESERVED" && prop.reservation?.from && prop.reservation?.to) {
        const existingRes = await ReservationModel.findOne({
          propertyId: prop.id,
        }).exec();

        if (!existingRes) {
          const checkInDate = new Date(prop.reservation.from);
          const checkOutDate = new Date(prop.reservation.to);
          const nights = calculateNights(checkInDate, checkOutDate);
          let quote;
          try {
            quote = quoteForProperty(prop, checkInDate, checkOutDate);
          } catch (err) {
            console.error(`[pricing] skipped reservation for property ${prop.id}:`, err);
            continue;
          }
          const total = quote.total;

          const resId = `LM-${new Date().getFullYear()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

          await ReservationModel.create({
            id: resId,
            propertyId: prop.id,
            ownerId,
            customerName: "Client Confirmé",
            customerPhone: "",
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: prop.guests || 2,
            status: "CONFIRMED",
            pricing: {
              pricePerNight: nights > 0 ? Math.round((total / nights) * 1000) / 1000 : 0,
              totalNights: nights,
              subtotal: total,
              total,
              unitPrice: quote.unitPrice,
              pricePeriod: quote.pricePeriod,
              quantity: quote.quantity,
              currency: quote.currency,
            },
            paymentSummary: {
              paidAmount: 0,
              remainingAmount: total,
              status: "UNPAID",
            },
          });

          try {
            const snapshot = await commissionPolicyService.createSnapshotAtConfirmation({
              reservationId: resId,
              propertyId: prop.id,
              ownerId,
              rentalBasis: total,
              collectionFlow: "OWNER_DIRECT",
              confirmedAt: checkInDate,
            });
            await financeLedgerService.postCommissionObligation(
              { id: resId, propertyId: prop.id, ownerId },
              snapshot
            );
          } catch (finErr) {
            console.error("Failed to post commission obligation on property reservation sync:", finErr);
          }
        }
      }
    }

    // Clean up duplicate fallback reservations for properties that already have a real request reservation
    for (const prop of properties) {
      const realRes = await ReservationModel.findOne({ propertyId: prop.id, requestId: { $exists: true, $ne: null } }).exec();
      if (realRes) {
        await ReservationModel.deleteMany({
          propertyId: prop.id,
          customerName: "Client Confirmé",
          requestId: { $exists: false },
        }).exec();
      }
    }
  }

  async findByOwnerId(ownerId: string, filters?: { propertyId?: string; status?: string }): Promise<any[]> {
    await this.syncOwnerReservations(ownerId);

    const query: any = { ownerId };
    if (filters?.propertyId && filters.propertyId !== "ALL") {
      query.propertyId = filters.propertyId;
    }
    if (filters?.status && filters.status !== "ALL") {
      query.status = filters.status;
    }

    const reservations = await ReservationModel.find(query).sort({ checkIn: 1 }).lean().exec();

    // Populate property titles and images
    const propIds = Array.from(new Set(reservations.map((r: any) => r.propertyId)));
    const properties = await PropertyModel.find({ id: { $in: propIds } }).select("id title city location images coverImageId").lean().exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    return reservations.map((res: any) => {
      const prop = propMap.get(res.propertyId);
      const coverUrl = prop?.images?.[0]?.url || (typeof prop?.images?.[0] === "string" ? prop.images[0] : null) || "/placeholder-property.jpg";
      const contactInfo = formatCustomerContactForOwner(res);

      return {
        ...res,
        customerName: contactInfo.customerName,
        customerPhone: contactInfo.customerPhone,
        customerEmail: contactInfo.customerEmail,
        contactVisibility: contactInfo.contactVisibility,
        propertyTitle: prop?.title || "Logement",
        propertyCity: prop?.city || prop?.location?.city || "Mahdia",
        propertyCoverImage: coverUrl,
      };
    });
  }

  async findById(id: string, ownerId: string): Promise<any | null> {
    await connectToDatabase();
    const res = await ReservationModel.findOne({ id, ownerId }).lean().exec();
    if (!res) return null;

    const prop = await PropertyModel.findOne({ id: res.propertyId }).select("id title city location images ownerId").lean().exec();

    // Enforce ownership
    if (prop && prop.ownerId !== ownerId && res.ownerId !== ownerId) {
      return null;
    }

    const payments = await PaymentModel.find({ reservationId: id }).sort({ paidAt: -1 }).lean().exec();

    const coverUrl = prop?.images?.[0]?.url || (typeof prop?.images?.[0] === "string" ? prop.images[0] : null) || "/placeholder-property.jpg";
    const contactInfo = formatCustomerContactForOwner(res);

    return {
      ...res,
      customerName: contactInfo.customerName,
      customerPhone: contactInfo.customerPhone,
      customerEmail: contactInfo.customerEmail,
      contactVisibility: contactInfo.contactVisibility,
      propertyTitle: prop?.title || "Logement",
      propertyCity: prop?.city || prop?.location?.city || "Mahdia",
      propertyCoverImage: coverUrl,
      payments: payments || [],
    };
  }

  async findByCustomerId(customerId: string): Promise<any[]> {
    await connectToDatabase();
    const reservations = await ReservationModel.find({ customerId }).sort({ checkIn: -1 }).lean().exec();

    const propIds = Array.from(new Set(reservations.map((r: any) => r.propertyId)));
    const properties = await PropertyModel.find({ id: { $in: propIds } }).select("id title city location images coverImageId").lean().exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    return await Promise.all(
      reservations.map(async (res: any) => {
        const prop = propMap.get(res.propertyId);
        const coverUrl = prop?.images?.[0]?.url || (typeof prop?.images?.[0] === "string" ? prop.images[0] : null) || "/placeholder-property.jpg";
        const payments = await PaymentModel.find({ reservationId: res.id }).sort({ createdAt: -1 }).lean().exec();
        const latestPayment = payments[0] || null;

        return {
          ...res,
          propertyTitle: prop?.title || "Logement",
          propertyCity: prop?.city || prop?.location?.city || "Mahdia",
          propertyCoverImage: coverUrl,
          payments: payments || [],
          payment: latestPayment
            ? {
                id: latestPayment.id,
                status: latestPayment.status,
                method: latestPayment.method || "CASH",
                amount: latestPayment.amount,
                currency: latestPayment.currency || "TND",
                confirmedAt: latestPayment.verifiedAt || latestPayment.reportedAt || null,
              }
            : {
                id: null,
                status: res.paymentSummary?.status || "UNPAID",
                method: "CASH",
                amount: res.pricing?.total || 0,
                currency: "TND",
                confirmedAt: null,
              },
        };
      })
    );
  }

  async findCustomerReservationById(id: string, customerId: string): Promise<any | null> {
    await connectToDatabase();
    const res = await ReservationModel.findOne({ id, customerId }).lean().exec();
    if (!res) return null;

    const prop = await PropertyModel.findOne({ id: res.propertyId }).select("id title city location images").lean().exec();
    const payments = await PaymentModel.find({ reservationId: id }).sort({ createdAt: -1 }).lean().exec();
    const latestPayment = payments[0] || null;
    const coverUrl = prop?.images?.[0]?.url || (typeof prop?.images?.[0] === "string" ? prop.images[0] : null) || "/placeholder-property.jpg";

    return {
      ...res,
      propertyTitle: prop?.title || "Logement",
      propertyCity: prop?.city || prop?.location?.city || "Mahdia",
      propertyCoverImage: coverUrl,
      payments: payments || [],
      payment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            method: latestPayment.method || "CASH",
            amount: latestPayment.amount,
            currency: latestPayment.currency || "TND",
            confirmedAt: latestPayment.verifiedAt || latestPayment.reportedAt || null,
          }
        : {
            id: null,
            status: res.paymentSummary?.status || "UNPAID",
            method: "CASH",
            amount: res.pricing?.total || 0,
            currency: "TND",
            confirmedAt: null,
          },
    };
  }

  async create(data: any): Promise<any> {
    await connectToDatabase();
    return await ReservationModel.create(data);
  }
}

export const reservationRepository = new ReservationRepository();
