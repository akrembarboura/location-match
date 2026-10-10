import { requestRepository } from "../repositories/RequestRepository";
import { propertyRepository } from "../repositories/PropertyRepository";
import { notificationService } from "./NotificationService";
import { HouseModel, PropertyModel, HousingRequestModel, UserModel, ReservationModel } from "@/lib/models";
import { emailService } from "../notifications/email.service";
import connectToDatabase from "@/lib/mongoose";
import type { CreateRentalRequestInput } from "@/lib/rentals/request-schema";
import { normalizeTunisianPhone } from "@/lib/rentals/request-schema";
import { analyticsRepository } from "../analytics/AnalyticsRepository";
import crypto from "crypto";
import { resolvePropertyPricing } from "@/lib/pricing/pricing.service";
import { commissionPolicyService } from "./CommissionPolicyService";
import { financeLedgerService } from "./FinanceLedgerService";

export class RequestService {
  /**
   * Generates a clean, readable reference code e.g. "REQ-2026-7B2F"
   */
  private generateReferenceId(): string {
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `REQ-${year}-${rand}`;
  }

  async createRequest(input: CreateRentalRequestInput, customerId?: string) {
    const id = this.generateReferenceId();
    const phone = normalizeTunisianPhone(input.phone) || input.phone;

    // Check if this is a property-specific reservation request
    const isPropertySpecific = "propertyId" in input && Boolean(input.propertyId);

    if (isPropertySpecific) {
      await connectToDatabase();
      const propId = (input as any).propertyId;

      let property: any = await PropertyModel.findOne({
        $or: [{ id: propId }, { slug: propId }],
      }).lean().exec();

      if (!property) {
        property = await HouseModel.findOne({
          $or: [{ id: propId }, { slug: propId }],
        }).lean().exec();
      }

      if (!property) {
        const err: any = new Error("Logement introuvable.");
        err.statusCode = 404;
        throw err;
      }

      // Verify property is published
      const isPublished = property.status === "PUBLISHED" || property.isPublished === true;
      if (!isPublished) {
        const err: any = new Error("Ce logement n'est pas disponible pour la réservation.");
        err.statusCode = 400;
        throw err;
      }

      // Verify rental category matches property
      const propCategory = (property.rentalCategory || (property.summerPrice ? "summer" : "student")).toLowerCase();
      const rawCategory = (input.rentalCategory || "summer").toLowerCase();
      const reqCategory = rawCategory === "universe" ? "student" : rawCategory;

      if (propCategory !== reqCategory) {
        const err: any = new Error("La catégorie demandée ne correspond pas à ce logement.");
        err.statusCode = 400;
        throw err;
      }

      // Validate capacity
      const maxGuests = property.capacity?.guests || property.guests || property.people || 1;
      const requestedGuests = (input as any).guests || 1;
      if (requestedGuests > maxGuests) {
        const err: any = new Error(
          `Le nombre de personnes (${requestedGuests}) dépasse la capacité maximale de ce logement (${maxGuests} personnes).`
        );
        err.statusCode = 400;
        throw err;
      }

      // Validate availability date overlap
      if (input.checkIn && (input as any).checkOut) {
        const reqStart = new Date(input.checkIn);
        const reqEnd = new Date((input as any).checkOut);

        if (!isNaN(reqStart.getTime()) && !isNaN(reqEnd.getTime())) {
          // 1. Check property reservation
          if (
            property.availabilityStatus === "RESERVED" &&
            property.reservation?.from &&
            property.reservation?.to
          ) {
            const resStart = new Date(property.reservation.from);
            const resEnd = new Date(property.reservation.to);
            if (reqStart < resEnd && reqEnd > resStart) {
              const err: any = new Error("Ce logement n'est pas disponible pour ces dates (déjà réservé).");
              err.statusCode = 409;
              throw err;
            }
          }

          // 2. Check property unavailable periods
          if (Array.isArray(property.unavailable)) {
            for (const unav of property.unavailable) {
              if (unav.from && unav.to) {
                const uStart = new Date(unav.from);
                const uEnd = new Date(unav.to);
                if (reqStart < uEnd && reqEnd > uStart) {
                  const err: any = new Error("Ce logement n'est pas disponible pour ces dates.");
                  err.statusCode = 409;
                  throw err;
                }
              }
            }
          }

          // 3. Check any confirmed reservation for this property
          const overlappingConfirmed = await HousingRequestModel.findOne({
            $or: [{ propertyId: property.id }, { selectedProperty: property.id }],
            status: "CONFIRMED",
            checkIn: { $lt: (input as any).checkOut },
            checkOut: { $gt: input.checkIn },
          }).lean().exec();

          if (overlappingConfirmed) {
            const err: any = new Error("Ce logement a déjà une réservation confirmée pour ces dates.");
            err.statusCode = 409;
            throw err;
          }
        }
      }

      const resolvedPricing = resolvePropertyPricing(property);
      const propPrice = resolvedPricing.unitPrice;
      const propPeriod = resolvedPricing.pricePeriod;

      const data: any = {
        id,
        customerId: customerId || undefined,
        customer: {
          fullName: input.fullName,
          phone,
        },
        propertyId: property.id,
        selectedProperty: property.id,
        rentalCategory: reqCategory,
        destination: property.city || property.location?.city || "Mahdia",
        area: property.area || property.location?.area || "",
        propertyType: property.propertyType || property.type || "Logement",
        checkIn: input.checkIn,
        checkOut: (input as any).checkOut,
        guests: requestedGuests,
        bedrooms: property.capacity?.bedrooms?.toString() || property.bedrooms?.toString(),
        budget: propPrice,
        budgetPeriod: propPeriod,
        amenities: property.amenities || [],
        message: (input as any).message || undefined,
        note: (input as any).message || undefined,
        status: "PENDING",
        proposedProperties: [],
        kind: reqCategory,
        people: requestedGuests,
      };

      const doc = await requestRepository.create(data);

      try {
        await notificationService.createNotification({
          type: "NEW_REQUEST",
          title: "Nouvelle demande de réservation",
          message: `${input.fullName} a envoyé une demande de réservation pour "${property.title}".`,
          requestId: doc.id,
          propertyId: property.id,
          recipientRole: "ADMIN",
        });
      } catch (notifErr) {
        console.error("Failed to create admin notification:", notifErr);
      }

      return {
        id: doc.id,
        fullName: doc.customer?.fullName,
        destination: doc.destination,
        area: doc.area,
        budgetPeriod: doc.budgetPeriod,
        rentalCategory: doc.rentalCategory,
        checkIn: doc.checkIn,
        checkOut: doc.checkOut,
        status: doc.status,
        propertyId: property.id,
        createdAt: doc.createdAt,
      };
    }

    // Generic Request Flow
    const genericInput = input as any;
    const reqCategory = (genericInput.rentalCategory === "universe" ? "student" : genericInput.rentalCategory) || "summer";

    const data: any = {
      id,
      customerId: customerId || undefined,
      customer: {
        fullName: genericInput.fullName,
        phone,
      },
      rentalCategory: reqCategory,
      destination: genericInput.destination || "Mahdia",
      amenities: genericInput.amenities || [],
      status: "PENDING",
      proposedProperties: [],
    };

    if (reqCategory === "summer") {
      data.area = genericInput.area;
      data.flexibleLocation = Boolean(genericInput.flexibleLocation);
      data.propertyType = genericInput.propertyType;
      data.bedrooms = genericInput.bedrooms;
      data.checkIn = genericInput.checkIn;
      data.checkOut = genericInput.checkOut;
      data.guests = genericInput.guests;
      data.budget = genericInput.budget;
      data.budgetPeriod = genericInput.budgetPeriod || "week";
      // Legacy fields
      data.kind = "summer";
      data.people = genericInput.guests;
      data.customer_name = genericInput.fullName;
    } else {
      data.checkIn = genericInput.checkIn;
      data.checkOut = genericInput.checkOut;
      data.guests = genericInput.students || genericInput.guests;
      data.budget = genericInput.budget;
      data.budgetPeriod = genericInput.budgetPeriod || "month";
      data.propertyType = genericInput.propertyType;
      data.genderPreference = genericInput.genderPreference;
      // Legacy fields
      data.kind = "student";
      data.people = genericInput.students || genericInput.guests;
    }

    const doc = await requestRepository.create(data);

    // Persist real notification for administrators
    try {
      const categoryLabel = reqCategory === "summer" ? "Été" : "Étudiant";
      const destArea = reqCategory === "summer" ? genericInput.area : undefined;
      const destLabel = genericInput.destination || destArea || "Tunisie";
      await notificationService.createNotification({
        type: "NEW_REQUEST",
        title: "Nouvelle demande reçue",
        message: `${genericInput.fullName} a envoyé une demande (${categoryLabel}) pour ${destLabel}.`,
        requestId: doc.id,
        recipientRole: "ADMIN",
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification:", notifErr);
    }

    return {
      id: doc.id,
      fullName: doc.customer?.fullName,
      destination: doc.destination,
      area: doc.area,
      budgetPeriod: doc.budgetPeriod,
      rentalCategory: doc.rentalCategory,
      checkIn: doc.checkIn,
      checkOut: doc.checkOut,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  }

  private async attachPropertyDetails(targetPropId: string | undefined) {
    if (!targetPropId) return null;
    await connectToDatabase();
    let selectedPropertyDoc: any = await PropertyModel.findOne({
      $or: [{ id: targetPropId }, { slug: targetPropId }],
    }).lean();
    if (!selectedPropertyDoc) {
      selectedPropertyDoc = await HouseModel.findOne({
        $or: [{ id: targetPropId }, { slug: targetPropId }],
      }).lean();
    }
    if (!selectedPropertyDoc) return null;

    return {
      id: selectedPropertyDoc.id,
      title: selectedPropertyDoc.title,
      slug: selectedPropertyDoc.slug,
      city: selectedPropertyDoc.city || selectedPropertyDoc.location?.city,
      area: selectedPropertyDoc.area || selectedPropertyDoc.location?.area,
      propertyType: selectedPropertyDoc.propertyType || selectedPropertyDoc.type,
      bedrooms: selectedPropertyDoc.capacity?.bedrooms || selectedPropertyDoc.bedrooms,
      bathrooms: selectedPropertyDoc.capacity?.bathrooms || selectedPropertyDoc.bathrooms,
      guests: selectedPropertyDoc.capacity?.guests || selectedPropertyDoc.guests || selectedPropertyDoc.people,
      pricing: {
        price: resolvePropertyPricing(selectedPropertyDoc).unitPrice,
        pricePeriod: resolvePropertyPricing(selectedPropertyDoc).pricePeriod,
        currency: resolvePropertyPricing(selectedPropertyDoc).currency,
      },
      availabilityStatus: selectedPropertyDoc.availabilityStatus || "AVAILABLE",
      reservation: selectedPropertyDoc.reservation || null,
      coverImage: selectedPropertyDoc.images?.[0]?.url || (typeof selectedPropertyDoc.images?.[0] === "string" ? selectedPropertyDoc.images?.[0] : null),
      images: (selectedPropertyDoc.images || []).map((img: any) =>
        typeof img === "string" ? img : img.url
      ),
    };
  }

  async getCustomerRequests(customerId: string) {
    const { ReservationModel, PaymentModel } = await import("@/lib/models");
    const list = await requestRepository.findByCustomerId(customerId);
    return await Promise.all(
      list.map(async (r: any) => {
        const propId = r.propertyId || r.selectedProperty;
        const selectedPropertyDetails = propId ? await this.attachPropertyDetails(propId) : null;

        const linkedRes = await ReservationModel.findOne({
          $or: [{ requestId: r.id }, { id: r.id }],
        }).lean().exec();

        let paymentInfo = null;
        let paymentSummary = r.paymentSummary || null;

        if (linkedRes) {
          paymentSummary = linkedRes.paymentSummary || paymentSummary;
          const latestPayment = await PaymentModel.findOne({ reservationId: linkedRes.id })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

          paymentInfo = {
            id: latestPayment?.id || null,
            reservationId: linkedRes.id,
            status: latestPayment?.status || linkedRes.paymentSummary?.status || "UNPAID",
            method: latestPayment?.method || "CASH",
            amount: linkedRes.pricing?.total || r.budget || 0,
            currency: linkedRes.pricing?.currency || "TND",
            paidAmount: linkedRes.paymentSummary?.paidAmount || 0,
            reportedAmount: linkedRes.paymentSummary?.reportedAmount || 0,
            remainingAmount: linkedRes.paymentSummary?.remainingAmount ?? (linkedRes.pricing?.total || 0),
            confirmedAt: latestPayment?.verifiedAt || latestPayment?.reportedAt || null,
          };
        } else if (r.paymentSummary) {
          paymentInfo = {
            id: null,
            status: r.paymentSummary.status || "UNPAID",
            method: "CASH",
            amount: r.budget || 0,
            currency: "TND",
            paidAmount: r.paymentSummary.paidAmount || 0,
            reportedAmount: r.paymentSummary.reportedAmount || 0,
            remainingAmount: r.paymentSummary.remainingAmount || 0,
            confirmedAt: null,
          };
        }

        return {
          ...r,
          propertyId: propId,
          selectedProperty: propId,
          selectedPropertyDetails,
          payment: paymentInfo,
          paymentSummary,
        };
      })
    );
  }

  async getClientRequest(id: string) {
    const req = await requestRepository.findById(id);
    if (!req) return null;

    // Populate proposed houses with real photos, titles, slugs
    await connectToDatabase();
    const populatedProposals = await Promise.all(
      (req.proposedProperties || []).map(async (p: any) => {
        const house = await HouseModel.findOne({
          $or: [{ id: p.propertyId }, { slug: p.propertyId }],
        }).lean();

        return {
          propertyId: p.propertyId,
          proposedPrice: p.proposedPrice,
          checkIn: p.checkIn,
          checkOut: p.checkOut,
          adminMessage: p.adminMessage,
          status: p.status,
          createdAt: p.createdAt,
          house: house
            ? {
                id: house.id,
                title: house.title,
                slug: house.slug,
                location: house.location,
                city: house.city,
                pricePerNight: house.pricePerNight,
                bedrooms: house.bedrooms,
                bathrooms: house.bathrooms,
                coverImage: house.images?.[0]?.url || null,
                images: (house.images || []).map((img: any) => img.url),
              }
            : null,
        };
      })
    );

    const targetPropId = req.propertyId || req.selectedProperty;
    const selectedPropertyDetails = await this.attachPropertyDetails(targetPropId);

    // Fetch linked ReservationModel & PaymentModel to get the authoritative payment state
    const { ReservationModel, PaymentModel } = await import("@/lib/models");
    const linkedRes = await ReservationModel.findOne({
      $or: [{ requestId: req.id }, { id: req.id }],
    }).lean().exec();

    let paymentInfo = null;
    let paymentSummary = req.paymentSummary || null;

    if (linkedRes) {
      paymentSummary = linkedRes.paymentSummary || paymentSummary;
      const latestPayment = await PaymentModel.findOne({ reservationId: linkedRes.id })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      paymentInfo = {
        id: latestPayment?.id || null,
        reservationId: linkedRes.id,
        status: latestPayment?.status || linkedRes.paymentSummary?.status || "UNPAID",
        method: latestPayment?.method || "CASH",
        amount: linkedRes.pricing?.total || req.budget || 0,
        currency: linkedRes.pricing?.currency || "TND",
        paidAmount: linkedRes.paymentSummary?.paidAmount || 0,
        reportedAmount: linkedRes.paymentSummary?.reportedAmount || 0,
        remainingAmount: linkedRes.paymentSummary?.remainingAmount ?? (linkedRes.pricing?.total || 0),
        confirmedAt: latestPayment?.verifiedAt || latestPayment?.reportedAt || null,
      };
    } else if (req.paymentSummary) {
      paymentInfo = {
        id: null,
        status: req.paymentSummary.status || "UNPAID",
        method: "CASH",
        amount: req.budget || 0,
        currency: "TND",
        paidAmount: req.paymentSummary.paidAmount || 0,
        reportedAmount: req.paymentSummary.reportedAmount || 0,
        remainingAmount: req.paymentSummary.remainingAmount || 0,
        confirmedAt: null,
      };
    }

    // Strip internal adminNotes from client view
    return {
      id: req.id,
      customer: {
        fullName: req.customer?.fullName || req.customer,
        phone: req.customer?.phone || req.phone,
      },
      rentalCategory: req.rentalCategory || req.kind,
      destination: req.destination || req.area,
      area: req.area,
      flexibleLocation: req.flexibleLocation,
      propertyType: req.propertyType,
      checkIn: req.checkIn || req.period,
      checkOut: req.checkOut,
      guests: req.guests || req.people,
      bedrooms: req.bedrooms,
      budget: req.budget,
      budgetPeriod: req.budgetPeriod,
      amenities: req.amenities || req.preferences || [],
      university: req.university,
      genderPreference: req.genderPreference,
      status: req.status || req.stage || "PENDING",
      proposedProperties: populatedProposals,
      propertyId: req.propertyId || req.selectedProperty,
      selectedProperty: req.selectedProperty || req.propertyId,
      selectedPropertyDetails,
      payment: paymentInfo,
      paymentSummary,
      reservationId: linkedRes?.id || req.id,
      contactAccessOverride: linkedRes?.contactAccessOverride || req.contactAccessOverride || null,
      message: req.message || req.note,
      createdAt: req.createdAt,
    };
  }

  async getAdminRequest(id: string) {
    const req = await requestRepository.findById(id);
    if (!req) return null;

    await connectToDatabase();
    const populatedProposals = await Promise.all(
      (req.proposedProperties || []).map(async (p: any) => {
        const house = await HouseModel.findOne({
          $or: [{ id: p.propertyId }, { slug: p.propertyId }],
        }).lean();

        return {
          propertyId: p.propertyId,
          proposedPrice: p.proposedPrice,
          checkIn: p.checkIn,
          checkOut: p.checkOut,
          adminMessage: p.adminMessage,
          status: p.status,
          createdAt: p.createdAt,
          house: house
            ? {
                id: house.id,
                title: house.title,
                slug: house.slug,
                city: house.city,
                pricePerNight: house.pricePerNight,
                coverImage: house.images?.[0]?.url || null,
              }
            : null,
        };
      })
    );

    const targetPropId = req.propertyId || req.selectedProperty;
    const selectedPropertyDetails = await this.attachPropertyDetails(targetPropId);

    return {
      ...req,
      propertyId: req.propertyId || req.selectedProperty,
      selectedProperty: req.selectedProperty || req.propertyId,
      selectedPropertyDetails,
      message: req.message || req.note,
      proposedProperties: populatedProposals,
    };
  }

  async getAdminRequests(filters?: any) {
    const { items, total, page, limit, totalPages } = await requestRepository.findAll(filters);

    // Collect all property IDs to batch-fetch and eliminate N+1 queries
    const propIds = Array.from(
      new Set(items.map((r: any) => r.propertyId || r.selectedProperty).filter(Boolean))
    ) as string[];

    let propMap = new Map<string, any>();
    if (propIds.length > 0) {
      await connectToDatabase();
      const [props, houses] = await Promise.all([
        PropertyModel.find({
          $or: [{ id: { $in: propIds } }, { slug: { $in: propIds } }],
        })
          .select("id title slug city location area propertyType type capacity pricing availabilityStatus reservation images")
          .lean()
          .exec(),
        HouseModel.find({
          $or: [{ id: { $in: propIds } }, { slug: { $in: propIds } }],
        })
          .select("id title slug city location area propertyType type bedrooms bathrooms guests pricePerNight availabilityStatus reservation images")
          .lean()
          .exec(),
      ]);

      const allPropDocs = [...props, ...houses];
      for (const p of allPropDocs) {
        const details = {
          id: p.id,
          title: p.title,
          slug: p.slug,
          city: p.city || p.location?.city,
          area: p.area || p.location?.area,
          propertyType: p.propertyType || p.type,
          bedrooms: p.capacity?.bedrooms || p.bedrooms,
          bathrooms: p.capacity?.bathrooms || p.bathrooms,
          guests: p.capacity?.guests || p.guests || p.people,
          pricing: {
            price: resolvePropertyPricing(p).unitPrice,
            pricePeriod: resolvePropertyPricing(p).pricePeriod,
            currency: resolvePropertyPricing(p).currency,
          },
          availabilityStatus: p.availabilityStatus || "AVAILABLE",
          reservation: p.reservation || null,
          coverImage: p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : null),
          images: (p.images || []).map((img: any) => (typeof img === "string" ? img : img.url)),
        };
        if (p.id) propMap.set(p.id, details);
        if (p.slug) propMap.set(p.slug, details);
      }
    }

    const formattedItems = items.map((r: any) => {
      const propId = r.propertyId || r.selectedProperty;
      const selectedPropertyDetails = propId ? propMap.get(propId) || null : null;
      return {
        ...r,
        propertyId: propId,
        selectedProperty: propId,
        selectedPropertyDetails,
      };
    });

    return {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async updateRequestStatus(
    id: string,
    status: string,
    adminNotes?: string,
    adminId = "admin",
    options?: { skipCommissionCheck?: boolean; waiverReason?: string }
  ) {
    await connectToDatabase();
    const existingReq = await HousingRequestModel.findOne({ id }).exec();
    if (!existingReq) return null;

    const targetPropId = existingReq.propertyId || existingReq.selectedProperty;

    if (status === "CONFIRMED") {
      // Stage F Prerequisite Enforcement
      if (!targetPropId) {
        const err: any = new Error("Impossible de confirmer une demande sans logement sélectionné.");
        err.statusCode = 400;
        throw err;
      }

      const commissionTerms = existingReq.negotiation?.commissionTerms;
      const paymentVerif = existingReq.negotiation?.paymentVerification;

      const isCommissionTermsAgreed =
        commissionTerms?.status === "AGREED" ||
        commissionTerms?.status === "WAIVED" ||
        Boolean(options?.skipCommissionCheck);

      if (!isCommissionTermsAgreed) {
        const err: any = new Error(
          "Impossible de confirmer la réservation : les termes de la commission doivent d'abord être convenus ou exonérés."
        );
        err.statusCode = 400;
        throw err;
      }

      const isCommissionPaymentVerified =
        paymentVerif?.status === "VERIFIED" ||
        paymentVerif?.status === "WAIVED" ||
        commissionTerms?.status === "WAIVED" ||
        Boolean(options?.skipCommissionCheck);

      if (!isCommissionPaymentVerified) {
        const err: any = new Error(
          "Impossible de confirmer la réservation : le paiement de la commission doit d'abord être vérifié ou exonéré."
        );
        err.statusCode = 400;
        throw err;
      }

      if (targetPropId && existingReq.checkIn && existingReq.checkOut) {
        const fromDate = new Date(existingReq.checkIn);
        const toDate = new Date(existingReq.checkOut);
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
          try {
            await propertyRepository.reserve(targetPropId, {
              from: fromDate,
              to: toDate,
              adminId,
            });
            await propertyRepository.recordModerationEvent({
              id: crypto.randomUUID(),
              propertyId: targetPropId,
              adminId,
              action: "RESERVED",
              previousStatus: "AVAILABLE",
              newStatus: "RESERVED",
              reason: `Réservation confirmée suite à la demande ${id} (du ${existingReq.checkIn} au ${existingReq.checkOut})`,
            });
          } catch (reserveErr) {
            console.error("Failed to mark property reserved on request confirmation:", reserveErr);
          }
        }
      }

      // Finance & Commission Ledger Integration
      try {
        const propDoc = targetPropId ? await PropertyModel.findOne({ id: targetPropId }).lean().exec() : null;
        const ownerId = propDoc?.ownerId || "owner-default";
        const rentalBasis =
          commissionTerms?.rentalBasis ||
          (typeof existingReq.budget === "number"
            ? existingReq.budget
            : propDoc?.pricing?.price || propDoc?.pricePerNight || 0);

        const rateOverride = commissionTerms?.rate;
        const commissionBasis = commissionTerms?.basis || "FIRST_MONTH_RENT";

        const snapshot = await commissionPolicyService.createSnapshotAtConfirmation({
          reservationId: existingReq.id,
          propertyId: targetPropId || undefined,
          ownerId,
          rentalBasis,
          rateOverride,
          commissionBasis,
          collectionFlow: commissionTerms?.collectionFlow || "OWNER_DIRECT",
          status: paymentVerif?.status === "VERIFIED" ? "VERIFIED" : "AGREED",
          verifiedCommission: paymentVerif?.verifiedAmount || 0,
          confirmedAt: new Date(),
        });

        await financeLedgerService.postCommissionObligation(
          {
            id: existingReq.id,
            propertyId: targetPropId || "prop-default",
            ownerId,
            customerId: existingReq.customerId,
          },
          snapshot
        );
      } catch (finErr) {
        console.error("Failed to post commission obligation on request confirmation:", finErr);
      }

      // Stage G Notifications to Owner and Customer
      try {
        let propTitle = "votre logement sélectionné";
        let propOwnerId: string | undefined;
        if (targetPropId) {
          const propDoc = await PropertyModel.findOne({ id: targetPropId }).lean().exec();
          if (propDoc?.title) propTitle = propDoc.title;
          if (propDoc?.ownerId) propOwnerId = propDoc.ownerId;
        }

        let clientEmail = existingReq.customer?.email || (existingReq as any).email;
        let clientName = existingReq.customer?.fullName || existingReq.customer?.name || "Cher Client";

        if (!clientEmail && existingReq.customerId) {
          const userDoc = await UserModel.findOne({ id: existingReq.customerId }).lean().exec();
          if (userDoc?.email) clientEmail = userDoc.email;
          if (userDoc && (!clientName || clientName === "Cher Client")) {
            clientName = `${userDoc.firstName || ""} ${userDoc.lastName || ""}`.trim() || clientName;
          }
        }

        // Notify Owner
        if (propOwnerId) {
          await notificationService.createNotification({
            type: "STATUS_CHANGE",
            title: "Réservation confirmée",
            message: `La réservation #${existingReq.id} pour "${propTitle}" (${existingReq.checkIn} au ${existingReq.checkOut}) est officiellement confirmée.`,
            requestId: existingReq.id,
            propertyId: targetPropId,
            recipientRole: "OWNER",
            recipientId: propOwnerId,
          });
        }

        // Notify Customer in-app & via email
        if (existingReq.customerId) {
          await notificationService.createNotification({
            type: "STATUS_CHANGE",
            title: "Réservation confirmée !",
            message: `Votre demande de réservation pour "${propTitle}" a été confirmée pour les dates ${existingReq.checkIn} au ${existingReq.checkOut}.`,
            requestId: existingReq.id,
            propertyId: targetPropId,
            recipientRole: "CUSTOMER",
            recipientId: existingReq.customerId,
          });
        }

        if (clientEmail) {
          await emailService.sendReservationConfirmedNotification(
            clientEmail,
            clientName,
            propTitle,
            { checkIn: existingReq.checkIn, checkOut: existingReq.checkOut }
          );
        }
      } catch (notifErr) {
        console.error("Failed to send party notifications on confirmation:", notifErr);
      }
    } else if (status === "CANCELLED" || status === "REJECTED") {
      if (targetPropId) {
        try {
          await propertyRepository.releaseReservation(targetPropId);
        } catch (releaseErr) {
          console.error("Failed to release property reservation on cancel/reject:", releaseErr);
        }
      }
    }

    const updated = await requestRepository.updateStatus(id, status, adminNotes);
    return updated;
  }

  // --- STAGE B: Customer Verification ---
  async recordCustomerVerification(
    id: string,
    data: { status: "PENDING" | "CONTACTED" | "CONFIRMED" | "DECLINED"; notes?: string },
    adminId: string
  ) {
    await connectToDatabase();
    const req = await HousingRequestModel.findOne({ id }).exec();
    if (!req) return null;

    if (!req.negotiation) req.negotiation = {};
    req.negotiation.customerVerification = {
      status: data.status,
      notes: data.notes || "",
      verifiedAt: new Date(),
      verifiedBy: adminId,
    };

    if (data.status === "CONFIRMED" && req.status === "PENDING") {
      req.status = "UNDER_REVIEW";
    }

    req.markModified("negotiation");
    await req.save();
    return req.toObject();
  }

  // --- STAGE C: Owner Negotiation ---
  async recordOwnerNegotiation(
    id: string,
    data: {
      status: "PENDING" | "CONTACTED" | "AGREED" | "REJECTED";
      proposedRate?: number;
      proposedBasis?: "FIRST_MONTH_RENT" | "FIRST_AGREED_PAYMENT" | "TOTAL_RENTAL_VALUE";
      collectionFlow?: "OWNER_DIRECT" | "PLATFORM_COLLECTS" | "MIXED";
      notes?: string;
    },
    adminId: string
  ) {
    await connectToDatabase();
    const req = await HousingRequestModel.findOne({ id }).exec();
    if (!req) return null;

    if (!req.negotiation) req.negotiation = {};
    req.negotiation.ownerNegotiation = {
      status: data.status,
      proposedRate: data.proposedRate ?? 10,
      proposedBasis: data.proposedBasis || "FIRST_MONTH_RENT",
      collectionFlow: data.collectionFlow || "OWNER_DIRECT",
      notes: data.notes || "",
      negotiatedAt: new Date(),
      negotiatedBy: adminId,
    };

    req.markModified("negotiation");
    await req.save();
    return req.toObject();
  }

  // --- STAGE D: Confirm Commission Terms ---
  async confirmCommissionTerms(
    id: string,
    data: {
      rate: number;
      basis: "FIRST_MONTH_RENT" | "FIRST_AGREED_PAYMENT" | "TOTAL_RENTAL_VALUE";
      rentalBasis?: number;
      collectionFlow?: "OWNER_DIRECT" | "PLATFORM_COLLECTS" | "MIXED";
      waivedReason?: string;
    },
    adminId: string
  ) {
    await connectToDatabase();
    const req = await HousingRequestModel.findOne({ id }).exec();
    if (!req) return null;

    const targetPropId = req.propertyId || req.selectedProperty;
    const propDoc = targetPropId ? await PropertyModel.findOne({ id: targetPropId }).lean().exec() : null;

    const rentalBasis =
      typeof data.rentalBasis === "number" && data.rentalBasis > 0
        ? data.rentalBasis
        : typeof req.budget === "number" && req.budget > 0
        ? req.budget
        : propDoc?.pricing?.price || propDoc?.pricePerNight || 600;

    const calculatedCommission = commissionPolicyService.calculateCommission(
      rentalBasis,
      data.rate,
      "PERCENTAGE",
      data.basis
    );

    const isWaived = Boolean(data.waivedReason);
    const termsStatus = isWaived ? "WAIVED" : "AGREED";

    if (!req.negotiation) req.negotiation = {};
    req.negotiation.commissionTerms = {
      status: termsStatus,
      rate: data.rate,
      basis: data.basis,
      rentalBasis,
      calculatedCommission: isWaived ? 0 : calculatedCommission,
      collectionFlow: data.collectionFlow || "OWNER_DIRECT",
      waivedReason: data.waivedReason,
      confirmedAt: new Date(),
      confirmedBy: adminId,
    };

    if (isWaived) {
      req.negotiation.paymentVerification = {
        status: "WAIVED",
        reportedAmount: 0,
        verifiedAmount: 0,
        remainingAmount: 0,
        paymentMethod: "CASH",
        verifiedAt: new Date(),
        verifiedBy: adminId,
      };
    }

    req.markModified("negotiation");
    await req.save();

    // Create immutable snapshot
    const ownerId = propDoc?.ownerId || "owner-default";
    await commissionPolicyService.createSnapshotAtConfirmation({
      reservationId: req.id,
      propertyId: targetPropId || undefined,
      ownerId,
      rentalBasis,
      rateOverride: data.rate,
      commissionBasis: data.basis,
      collectionFlow: data.collectionFlow || "OWNER_DIRECT",
      status: termsStatus,
      waivedBy: isWaived ? adminId : undefined,
      waivedReason: data.waivedReason,
      confirmedAt: new Date(),
    });

    return req.toObject();
  }

  // --- STAGE E: Record & Verify Commission Payment ---
  async recordCommissionPayment(
    id: string,
    data: { amount: number; paymentMethod?: string; reference?: string },
    actor: { userId: string; role: string }
  ) {
    await connectToDatabase();
    const req = await HousingRequestModel.findOne({ id }).exec();
    if (!req) return null;

    const targetPropId = req.propertyId || req.selectedProperty;
    const propDoc = targetPropId ? await PropertyModel.findOne({ id: targetPropId }).lean().exec() : null;
    const ownerId = propDoc?.ownerId || "owner-default";

    if (!req.negotiation) req.negotiation = {};
    const expected = req.negotiation.commissionTerms?.calculatedCommission || 0;

    req.negotiation.paymentVerification = {
      status: "REPORTED",
      reportedAmount: Math.round(data.amount * 1000) / 1000,
      verifiedAmount: req.negotiation.paymentVerification?.verifiedAmount || 0,
      remainingAmount: Math.max(0, Math.round((expected - (req.negotiation.paymentVerification?.verifiedAmount || 0)) * 1000) / 1000),
      paymentMethod: data.paymentMethod || "CASH",
      reference: data.reference,
      reportedAt: new Date(),
    };

    req.markModified("negotiation");
    await req.save();

    await financeLedgerService.recordPaymentTransaction({
      reservationId: req.id,
      propertyId: targetPropId || "prop-default",
      ownerId,
      customerId: req.customerId,
      type: "COMMISSION_REMITTANCE",
      direction: "CREDIT",
      amount: data.amount,
      paymentMethod: data.paymentMethod || "CASH",
      status: "REPORTED",
      reference: data.reference,
      reportedBy: actor,
      notes: `Versement de commission déclaré (${data.amount} TND via ${data.paymentMethod || "CASH"}).`,
    });

    return req.toObject();
  }

  async verifyCommissionPayment(
    id: string,
    data: { verifiedAmount?: number; transactionId?: string },
    adminId: string
  ) {
    await connectToDatabase();
    const req = await HousingRequestModel.findOne({ id }).exec();
    if (!req) return null;

    const targetPropId = req.propertyId || req.selectedProperty;
    const propDoc = targetPropId ? await PropertyModel.findOne({ id: targetPropId }).lean().exec() : null;
    const ownerId = propDoc?.ownerId || "owner-default";

    if (!req.negotiation) req.negotiation = {};
    const expected = req.negotiation.commissionTerms?.calculatedCommission || 0;
    const verifiedAmount =
      typeof data.verifiedAmount === "number" && data.verifiedAmount > 0
        ? data.verifiedAmount
        : req.negotiation.paymentVerification?.reportedAmount || expected;

    const remainingAmount = Math.max(0, Math.round((expected - verifiedAmount) * 1000) / 1000);

    req.negotiation.paymentVerification = {
      ...req.negotiation.paymentVerification,
      status: "VERIFIED",
      verifiedAmount,
      remainingAmount,
      verifiedAt: new Date(),
      verifiedBy: adminId,
    };

    req.markModified("negotiation");
    await req.save();

    // Verify corresponding ledger transaction or record verified remittance
    if (data.transactionId) {
      await financeLedgerService.verifyTransaction(adminId, data.transactionId);
    } else {
      await financeLedgerService.recordPaymentTransaction({
        reservationId: req.id,
        propertyId: targetPropId || "prop-default",
        ownerId,
        customerId: req.customerId,
        type: "COMMISSION_REMITTANCE",
        direction: "CREDIT",
        amount: verifiedAmount,
        paymentMethod: req.negotiation.paymentVerification?.paymentMethod || "CASH",
        status: "VERIFIED",
        reference: `VERIF-${req.id}`,
        reportedBy: { userId: adminId, role: "ADMIN" },
        notes: `Paiement de commission vérifié par admin (${verifiedAmount} TND).`,
      });
    }

    return req.toObject();
  }

  async addProposal(
    id: string,
    proposal: {
      propertyId: string;
      proposedPrice?: number;
      checkIn?: string;
      checkOut?: string;
      adminMessage?: string;
    }
  ) {
    const request = await requestRepository.findById(id);
    if (!request) {
      return null;
    }

    const property = await propertyRepository.findById(proposal.propertyId);

    if (
      property &&
      property.availabilityStatus === "RESERVED" &&
      property.reservation?.from &&
      property.reservation?.to
    ) {
      const checkInStr = proposal.checkIn || request.checkIn;
      const checkOutStr = proposal.checkOut || request.checkOut;
      if (checkInStr && checkOutStr) {
        const reqStart = new Date(checkInStr);
        const reqEnd = new Date(checkOutStr);
        const resStart = new Date(property.reservation.from);
        const resEnd = new Date(property.reservation.to);
        if (!isNaN(reqStart.getTime()) && !isNaN(reqEnd.getTime())) {
          if (reqStart < resEnd && reqEnd > resStart) {
            const conflictErr: any = new Error("Ce logement est déjà réservé pour cette période.");
            conflictErr.statusCode = 409;
            throw conflictErr;
          }
        }
      }
    }

    const result = await requestRepository.addProposal(id, proposal);

    try {
      await analyticsRepository.recordEvent({
        eventName: "proposal_created",
        propertyId: proposal.propertyId,
        actorType: "ADMIN",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return result;
  }

  async respondToProposal(
    requestId: string,
    propertyId: string,
    action: "ACCEPTED" | "REJECTED"
  ) {
    const result = await requestRepository.updateProposalStatus(requestId, propertyId, action);

    try {
      await analyticsRepository.recordEvent({
        eventName: action === "ACCEPTED" ? "proposal_accepted" : "proposal_rejected",
        propertyId,
        actorType: "CUSTOMER",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return result;
  }
}

export const requestService = new RequestService();
