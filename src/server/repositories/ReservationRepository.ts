import { ReservationModel, PropertyModel, HousingRequestModel, PaymentModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import { calculateNights } from "@/lib/date-utils";
import crypto from "node:crypto";
export function formatCustomerContactForOwner(res: {
  status?: string;
  paymentSummary?: { status?: string; paidAmount?: number };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}) {
  const isConfirmed = res.status === "CONFIRMED";
  const isPaymentValidated =
    res.paymentSummary?.status === "PAID" ||
    res.paymentSummary?.status === "PARTIALLY_PAID" ||
    (res.paymentSummary?.paidAmount || 0) > 0;

  const contactVisibility = isConfirmed && isPaymentValidated ? "RELEASED" : "HIDDEN";

  let customerName = res.customerName || "Client LOC MAISON";
  if (contactVisibility === "HIDDEN" && customerName) {
    const parts = customerName.trim().split(/\s+/);
    if (parts.length > 1) {
      customerName = `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
  }

  return {
    contactVisibility,
    customerName,
    customerPhone: contactVisibility === "RELEASED" ? res.customerPhone || null : null,
    customerEmail: contactVisibility === "RELEASED" ? res.customerEmail || null : null,
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
        const nightlyRate = prop.pricePerNight || prop.pricing?.price || prop.summerPrice || prop.studentPrice || 150;
        const total = nightlyRate * nights;

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
            pricePerNight: nightlyRate,
            totalNights: nights,
            subtotal: total,
            total,
            currency: "TND",
          },
          paymentSummary: {
            paidAmount,
            remainingAmount,
            status: payStatus,
          },
        });
      }
    }

    // 3. Also check properties with availabilityStatus === "RESERVED" that don't have a HousingRequest
    for (const prop of properties) {
      if (prop.availabilityStatus === "RESERVED" && prop.reservation?.from && prop.reservation?.to) {
        const checkInDate = new Date(prop.reservation.from);
        const checkOutDate = new Date(prop.reservation.to);

        const existingRes = await ReservationModel.findOne({
          propertyId: prop.id,
          checkIn: checkInDate,
        }).exec();

        if (!existingRes) {
          const nights = calculateNights(checkInDate, checkOutDate);
          const nightlyRate = prop.pricePerNight || prop.pricing?.price || prop.summerPrice || 150;
          const total = nightlyRate * nights;

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
              pricePerNight: nightlyRate,
              totalNights: nights,
              subtotal: total,
              total,
              currency: "TND",
            },
            paymentSummary: {
              paidAmount: 0,
              remainingAmount: total,
              status: "UNPAID",
            },
          });
        }
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

  async create(data: any): Promise<any> {
    await connectToDatabase();
    return await ReservationModel.create(data);
  }
}

export const reservationRepository = new ReservationRepository();
