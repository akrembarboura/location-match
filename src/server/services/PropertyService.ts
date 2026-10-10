import { propertyRepository } from "../repositories/PropertyRepository";
import {
  mapPropertyToPublicDTO,
  mapPropertyToOwnerDTO,
  mapPropertyToAdminDTO,
} from "../dtos/property";
import type {
  PropertySearchInput,
  CreateOwnerPropertyInput,
  UpdateOwnerPropertyInput,
} from "../validations/property";
import { notificationService } from "./NotificationService";
import {
  OwnerModel,
  UserModel,
  HouseModel,
  ReservationModel,
  PaymentModel,
  FinancialLedgerModel,
  HousingRequestModel,
  AuditLogModel,
  PropertyModerationEventModel,
} from "@/lib/models";
import { analyticsRepository } from "../analytics/AnalyticsRepository";
import { deleteFromCloudinary } from "../utils/cloudinary";
import crypto from "crypto";

function generateSlug(title: string, city: string, id: string): string {
  const clean = `${title}-${city}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean}-${id.toLowerCase().slice(-4)}`;
}

export class PropertyService {
  /* =======================================================================
   * PUBLIC QUERIES
   * ======================================================================= */

  async searchProperties(filters: PropertySearchInput) {
    const rawProperties = await propertyRepository.search(filters);
    return rawProperties.map(mapPropertyToPublicDTO);
  }

  async searchPropertiesPage(filters: PropertySearchInput) {
    const limit = filters.limit ?? 50;
    const rawProperties = await propertyRepository.search(filters, true);
    return {
      properties: rawProperties.slice(0, limit).map(mapPropertyToPublicDTO),
      hasMore: rawProperties.length > limit,
    };
  }

  async getPropertyBySlug(slug: string) {
    const rawProperty = await propertyRepository.findBySlug(slug);
    if (!rawProperty) {
      // Try by ID as fallback
      const byId = await propertyRepository.findById(slug);
      if (byId && (byId.status === "PUBLISHED" || byId.isPublished)) {
        return mapPropertyToPublicDTO(byId);
      }
      // Try HouseModel as fallback
      const houseDoc: any = await HouseModel.findOne({ $or: [{ id: slug }, { slug }] }).lean().exec();
      if (houseDoc && houseDoc.isPublished) {
        return {
          id: houseDoc.id,
          title: houseDoc.title,
          slug: houseDoc.slug,
          rentalCategory: houseDoc.rentalCategory || "summer",
          propertyType: houseDoc.propertyType || "Maison",
          city: houseDoc.city,
          area: houseDoc.location,
          pricing: {
            price: houseDoc.pricePerNight,
            pricePeriod: "night",
            currency: "TND",
          },
          summerPrice: houseDoc.summerPrice,
          studentPrice: houseDoc.studentPrice,
          capacity: {
            guests: houseDoc.guests || 1,
            bedrooms: houseDoc.bedrooms || 1,
            bathrooms: houseDoc.bathrooms || 1,
          },
          amenities: houseDoc.amenities || [],
          images: houseDoc.images || [],
          coverImage: houseDoc.images?.[0]?.url || null,
          availabilityStatus: houseDoc.availabilityStatus || "AVAILABLE",
          reservation: houseDoc.reservation || null,
        } as any;
      }
      return null;
    }
    return mapPropertyToPublicDTO(rawProperty);
  }

  async getFeaturedProperties() {
    const rawProperties = await propertyRepository.findFeatured();
    return rawProperties.map(mapPropertyToPublicDTO);
  }

  async getCategories() {
    const rawCategories = await propertyRepository.getAllCategories();
    return rawCategories.map((c) => ({
      id: c.id,
      slug: c.slug,
      label: c.label,
      rentalCategory: c.rentalCategory,
      icon: c.icon,
    }));
  }

  async getDestinations() {
    const rawDestinations = await propertyRepository.getAllDestinations();
    if (!rawDestinations || rawDestinations.length === 0) {
      const { mockDestinations } = await import("@/lib/rentals/mock");
      return mockDestinations;
    }
    return rawDestinations.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      governorate: d.governorate || "Mahdia",
      propertyCount: d.propertyCount ?? 0,
      image: d.image || d.imageUrl,
      imageUrl: d.imageUrl || d.image,
      tagline: d.tagline || "",
      startingPrice: d.startingPrice,
      pricePeriod: d.pricePeriod || "nuit",
      propertyTypes: d.propertyTypes,
      badge: d.badge,
      tags: d.tags,
      href: d.href,
    }));
  }

  /* =======================================================================
   * OWNER WORKFLOW
   * ======================================================================= */

  async createOwnerProperty(input: CreateOwnerPropertyInput, ownerUserId: string) {
    const propId = `PROP-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const slug = generateSlug(input.title, input.city, propId);

    // If submitting for review immediately, must have at least 1 image
    if (!input.asDraft && (!input.images || input.images.length === 0)) {
      throw new Error("Au moins une photo est requise pour soumettre votre bien à la vérification.");
    }

    const status = input.asDraft ? "DRAFT" : "PENDING_REVIEW";
    const submittedAt = input.asDraft ? undefined : new Date();

    const price =
      input.pricing?.price ||
      input.summerPrice ||
      input.studentPrice ||
      0;

    const propertyDoc = await propertyRepository.create({
      id: propId,
      slug,
      ownerId: ownerUserId,
      title: input.title,
      description: input.description || "",
      rentalCategory: input.rentalCategory,
      rentalCategories: input.rentalCategories || [input.rentalCategory],
      propertyType: input.propertyType,
      type: input.type || input.propertyType,
      features: input.features || [],
      categoryIds: input.categoryIds || input.features || [input.rentalCategory],
      city: input.city,
      area: input.area,
      location: {
        country: "Tunisie",
        city: input.city,
        area: input.area,
        address: input.address || "",
      },
      pricing: {
        price,
        pricePeriod: input.pricing?.pricePeriod || "week",
        currency: input.pricing?.currency || "TND",
      },
      summerPrice: input.summerPrice || (input.rentalCategory === "summer" ? price : undefined),
      studentPrice: input.studentPrice || (input.rentalCategory === "student" ? price : undefined),
      capacity: {
        guests: input.capacity?.guests || 1,
        bedrooms: input.capacity?.bedrooms || 1,
        bathrooms: input.capacity?.bathrooms || 1,
        surface: input.capacity?.surface,
      },
      guests: input.capacity?.guests || 1,
      bedrooms: input.capacity?.bedrooms || 1,
      bathrooms: input.capacity?.bathrooms || 1,
      surface: input.capacity?.surface,
      amenities: input.amenities,
      images: input.images,
      coverImageId: input.images[0]?.id || (input.images[0] as any)?.publicId,
      availability: input.availability,
      status,
      isPublished: false,
      verified: false,
      moderation: {
        submittedAt,
      },
      submittedAt,
    });

    if (status === "PENDING_REVIEW") {
      await propertyRepository.recordModerationEvent({
        id: crypto.randomUUID(),
        propertyId: propId,
        adminId: "SYSTEM",
        action: "SUBMITTED",
        previousStatus: "DRAFT",
        newStatus: "PENDING_REVIEW",
        reason: "Soumission initiale par le propriétaire",
      });

      // Notify Admins
      await notificationService.createNotification({
        type: "PROPERTY_SUBMITTED",
        title: "Nouvelle annonce à vérifier",
        message: `Une nouvelle annonce "${input.title}" (${input.city} - ${input.area}) a été soumise pour vérification.`,
        propertyId: propId,
        recipientRole: "ADMIN",
      });

      // Record analytics
      try {
        await analyticsRepository.recordEvent({
          eventName: "property_created",
          propertyId: propId,
          city: input.city,
          rentalCategory: input.rentalCategory,
          propertyType: input.propertyType,
          actorType: "OWNER",
          occurredAt: new Date(),
        });

        if (status === "PENDING_REVIEW") {
          await analyticsRepository.recordEvent({
            eventName: "property_submitted",
            propertyId: propId,
            city: input.city,
            rentalCategory: input.rentalCategory,
            propertyType: input.propertyType,
            actorType: "OWNER",
            occurredAt: new Date(),
          });
        }
      } catch {
        /* Analytics failure must not break property creation */
      }
    }

    return mapPropertyToOwnerDTO(propertyDoc);
  }

  async updateOwnerProperty(
    id: string,
    input: UpdateOwnerPropertyInput,
    ownerUserId: string
  ) {
    const existing = await propertyRepository.findById(id);
    if (!existing) {
      throw new Error("Bien immobilier introuvable.");
    }

    if (existing.ownerId !== ownerUserId) {
      throw new Error("Vous n'êtes pas autorisé à modifier ce bien.");
    }

    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      throw new Error("Ce bien est déjà en cours d'examen ou publié et ne peut plus être modifié directement.");
    }

    const willSubmit = input.resubmit === true || (!input.asDraft && input.resubmit !== false && existing.status === "REJECTED");

    if (willSubmit) {
      const allImages = input.images || existing.images || [];
      if (!allImages || allImages.length === 0) {
        throw new Error("Au moins une photo est requise pour soumettre votre bien à la vérification.");
      }
    }

    const updateData: any = {};
    const unsetData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.rentalCategory !== undefined) updateData.rentalCategory = input.rentalCategory;
    if (input.rentalCategories !== undefined) updateData.rentalCategories = input.rentalCategories;
    if (input.propertyType !== undefined) {
      updateData.propertyType = input.propertyType;
      updateData.type = input.type || input.propertyType;
    }
    if (input.type !== undefined) updateData.type = input.type;
    if (input.features !== undefined) updateData.features = input.features;
    if (input.categoryIds !== undefined) updateData.categoryIds = input.categoryIds;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.area !== undefined) updateData.area = input.area;
    if (input.address !== undefined || input.city !== undefined || input.area !== undefined) {
      updateData.location = {
        country: "Tunisie",
        city: input.city || existing.city || "Mahdia",
        area: input.area || existing.area || "",
        address: input.address || existing.location?.address || "",
      };
    }
    if (input.pricing !== undefined) {
      updateData.pricing = input.pricing;
    }
    if (input.summerPrice !== undefined) updateData.summerPrice = input.summerPrice;
    if (input.studentPrice !== undefined) updateData.studentPrice = input.studentPrice;
    if (input.capacity !== undefined) {
      updateData.capacity = input.capacity;
      if (input.capacity.guests !== undefined) updateData.guests = input.capacity.guests;
      if (input.capacity.bedrooms !== undefined) updateData.bedrooms = input.capacity.bedrooms;
      if (input.capacity.bathrooms !== undefined) updateData.bathrooms = input.capacity.bathrooms;
      if (input.capacity.surface !== undefined) updateData.surface = input.capacity.surface;
    }
    if (input.amenities !== undefined) updateData.amenities = input.amenities;
    if (input.images !== undefined) {
      updateData.images = input.images;
      if (input.images.length > 0) {
        updateData.coverImageId = input.images[0]?.id || (input.images[0] as any)?.publicId;
      }
    }
    if (input.availability !== undefined) updateData.availability = input.availability;

    if (willSubmit) {
      updateData.status = "PENDING_REVIEW";
      updateData.submittedAt = new Date();
      updateData["moderation.submittedAt"] = new Date();
      unsetData.rejectionReason = 1;
      unsetData["moderation.rejectionReason"] = 1;
    }

    const updated = await propertyRepository.update(id, updateData, unsetData);

    if (willSubmit) {
      await propertyRepository.recordModerationEvent({
        id: crypto.randomUUID(),
        propertyId: id,
        adminId: "SYSTEM",
        action: "SUBMITTED",
        previousStatus: existing.status,
        newStatus: "PENDING_REVIEW",
        reason: "Resoumission suite à modifications",
      });

      await notificationService.createNotification({
        type: "PROPERTY_SUBMITTED",
        title: "Annonce resoumise pour vérification",
        message: `L'annonce "${updated.title}" a été modifiée et resoumise pour vérification.`,
        propertyId: id,
        recipientRole: "ADMIN",
      });
    }

    return mapPropertyToOwnerDTO(updated);
  }

  async submitOwnerProperty(id: string, ownerUserId: string) {
    const existing = await propertyRepository.findById(id);
    if (!existing) {
      throw new Error("Bien immobilier introuvable.");
    }

    if (existing.ownerId !== ownerUserId) {
      throw new Error("Vous n'êtes pas autorisé à soumettre ce bien.");
    }

    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      throw new Error("Ce bien a déjà été soumis pour vérification.");
    }

    if (!existing.images || existing.images.length === 0) {
      throw new Error("Au moins une photo est requise pour soumettre votre bien à la vérification.");
    }

    const updated = await propertyRepository.update(
      id,
      {
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
        "moderation.submittedAt": new Date(),
      },
      {
        rejectionReason: 1,
        "moderation.rejectionReason": 1,
      }
    );

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId: "SYSTEM",
      action: "SUBMITTED",
      previousStatus: existing.status,
      newStatus: "PENDING_REVIEW",
      reason: "Soumission pour vérification",
    });

    await notificationService.createNotification({
      type: "PROPERTY_SUBMITTED",
      title: "Nouvelle annonce à vérifier",
      message: `L'annonce "${updated.title}" a été soumise pour vérification.`,
      propertyId: id,
      recipientRole: "ADMIN",
    });

    try {
      await analyticsRepository.recordEvent({
        eventName: "property_submitted",
        propertyId: id,
        city: updated.city,
        rentalCategory: updated.rentalCategory,
        propertyType: updated.propertyType,
        actorType: "OWNER",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return mapPropertyToOwnerDTO(updated);
  }

  async getOwnerProperties(ownerUserId: string) {
    const properties = await propertyRepository.findByOwnerId(ownerUserId);
    return properties.map(mapPropertyToOwnerDTO);
  }

  async getOwnerProperty(id: string, ownerUserId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) return null;
    if (property.ownerId !== ownerUserId) {
      throw new Error("Accès refusé.");
    }
    return mapPropertyToOwnerDTO(property);
  }

  /* =======================================================================
   * ADMIN MODERATION WORKFLOW
   * ======================================================================= */

  async getAdminProperties(filters: { status?: string; search?: string; page?: number; limit?: number } = {}) {
    const [{ items: rawProperties, total, page, limit, totalPages }, counts] = await Promise.all([
      propertyRepository.findAdminProperties(filters),
      propertyRepository.countByStatus(),
    ]);

    // Fetch owners/users ONLY for property owners on this page (avoid loading all owners/users in DB)
    const pageOwnerIds = Array.from(
      new Set(rawProperties.map((p: any) => p.ownerId).filter(Boolean))
    ) as string[];

    const [rawOwners, rawUsers] = pageOwnerIds.length > 0
      ? await Promise.all([
          OwnerModel.find({
            $or: [{ id: { $in: pageOwnerIds } }, { userId: { $in: pageOwnerIds } }],
          })
            .select("id userId name phone email")
            .lean()
            .exec(),
          UserModel.find({ id: { $in: pageOwnerIds } })
            .select("id firstName lastName email phone")
            .lean()
            .exec(),
        ])
      : [[], []];

    const ownersMap = new Map();
    for (const o of rawOwners) {
      ownersMap.set(o.id, o);
      if (o.userId) ownersMap.set(o.userId, o);
    }

    const usersMap = new Map(rawUsers.map((u: any) => [u.id, u]));

    const properties = rawProperties.map((p: any) => {
      let ownerInfo = ownersMap.get(p.ownerId);
      if (!ownerInfo) {
        const user = usersMap.get(p.ownerId);
        if (user) {
          ownerInfo = {
            id: user.id,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            phone: user.phone || "—",
            email: user.email,
          };
        }
      }
      return mapPropertyToAdminDTO(p, ownerInfo);
    });

    return {
      properties,
      totalCount: total,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getAdminProperty(id: string) {
    const property = await propertyRepository.findById(id);
    if (!property) return null;

    let ownerInfo = await OwnerModel.findOne({
      $or: [{ id: property.ownerId }, { userId: property.ownerId }],
    }).lean().exec();

    if (!ownerInfo) {
      const user = await UserModel.findOne({ id: property.ownerId }).lean().exec();
      if (user) {
        ownerInfo = {
          id: user.id,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          phone: user.phone || "—",
          email: user.email,
        };
      }
    }

    const moderationEvents = await propertyRepository.getModerationEvents(id);

    return {
      property: mapPropertyToAdminDTO(property, ownerInfo),
      moderationEvents,
    };
  }

  async reviewProperty(id: string, adminId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    const updated = await propertyRepository.update(id, {
      status: "UNDER_REVIEW",
      "moderation.reviewedBy": adminId,
    });

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "UNDER_REVIEW",
      previousStatus: property.status,
      newStatus: "UNDER_REVIEW",
      reason: "Prise en charge de la vérification par l'administrateur",
    });

    return mapPropertyToAdminDTO(updated);
  }

  async approveProperty(id: string, adminId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    if (property.status === "PUBLISHED") {
      throw new Error("Ce bien est déjà publié.");
    }

    const now = new Date();
    const updated = await propertyRepository.update(
      id,
      {
        status: "PUBLISHED",
        isPublished: true,
        verified: true,
        reviewedBy: adminId,
        reviewedAt: now,
        "moderation.reviewedBy": adminId,
        "moderation.reviewedAt": now,
      },
      {
        rejectionReason: 1,
        "moderation.rejectionReason": 1,
      }
    );

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "APPROVED",
      previousStatus: property.status,
      newStatus: "PUBLISHED",
      reason: "Publication validée",
    });

    // Notify Owner
    await notificationService.createNotification({
      type: "PROPERTY_APPROVED",
      title: "Votre bien est maintenant publié !",
      message: `Félicitations ! Votre annonce "${property.title}" a été approuvée et est désormais visible par tous les locataires sur LOC MAISON.`,
      propertyId: id,
      recipientId: property.ownerId,
      recipientRole: "OWNER",
    });

    try {
      await analyticsRepository.recordEvent({
        eventName: "property_approved",
        propertyId: id,
        city: property.city,
        rentalCategory: property.rentalCategory,
        propertyType: property.propertyType,
        actorType: "ADMIN",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return mapPropertyToAdminDTO(updated);
  }

  async rejectProperty(id: string, adminId: string, rejectionReason: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    const now = new Date();
    const updated = await propertyRepository.update(id, {
      status: "REJECTED",
      isPublished: false,
      reviewedBy: adminId,
      reviewedAt: now,
      rejectionReason,
      "moderation.reviewedBy": adminId,
      "moderation.reviewedAt": now,
      "moderation.rejectionReason": rejectionReason,
    });

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "REJECTED",
      previousStatus: property.status,
      newStatus: "REJECTED",
      reason: rejectionReason,
    });

    // Notify Owner
    await notificationService.createNotification({
      type: "PROPERTY_REJECTED",
      title: "Demande de publication refusée",
      message: `Votre annonce "${property.title}" nécessite des corrections : ${rejectionReason}`,
      propertyId: id,
      recipientId: property.ownerId,
      recipientRole: "OWNER",
    });

    try {
      await analyticsRepository.recordEvent({
        eventName: "property_rejected",
        propertyId: id,
        city: property.city,
        rentalCategory: property.rentalCategory,
        propertyType: property.propertyType,
        actorType: "ADMIN",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return mapPropertyToAdminDTO(updated);
  }

  async archiveProperty(id: string, adminId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    const updated = await propertyRepository.update(id, {
      status: "ARCHIVED",
      isPublished: false,
    });

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "ARCHIVED",
      previousStatus: property.status,
      newStatus: "ARCHIVED",
      reason: "Archivage du bien",
    });

    return mapPropertyToAdminDTO(updated);
  }

  async reserveProperty(id: string, dates: { from: Date; to: Date }, adminId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    if (property.status !== "PUBLISHED") {
      throw new Error("Seul un bien publié peut être marqué comme réservé.");
    }

    if (dates.from >= dates.to) {
      throw new Error("La date d'arrivée doit être antérieure à la date de départ.");
    }

    const updated = await propertyRepository.reserve(id, {
      from: dates.from,
      to: dates.to,
      adminId,
    });

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "RESERVED",
      previousStatus: property.availabilityStatus || "AVAILABLE",
      newStatus: "RESERVED",
      reason: `Réservé du ${dates.from.toISOString().slice(0, 10)} au ${dates.to.toISOString().slice(0, 10)}`,
    });

    try {
      await analyticsRepository.recordEvent({
        eventName: "reservation_confirmed",
        propertyId: id,
        city: property.city,
        rentalCategory: property.rentalCategory,
        propertyType: property.propertyType,
        actorType: "ADMIN",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return mapPropertyToAdminDTO(updated);
  }

  async updateReservation(id: string, dates: { from: Date; to: Date }, adminId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    if (property.status !== "PUBLISHED") {
      throw new Error("Seul un bien publié peut être marqué comme réservé.");
    }

    if (dates.from >= dates.to) {
      throw new Error("La date d'arrivée doit être antérieure à la date de départ.");
    }

    const updated = await propertyRepository.reserve(id, {
      from: dates.from,
      to: dates.to,
      adminId,
    });

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "RESERVED",
      previousStatus: property.availabilityStatus || "RESERVED",
      newStatus: "RESERVED",
      reason: `Mise à jour des dates de réservation : du ${dates.from.toISOString().slice(0, 10)} au ${dates.to.toISOString().slice(0, 10)}`,
    });

    return mapPropertyToAdminDTO(updated);
  }

  async releaseReservation(id: string, adminId: string) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error("Bien introuvable.");
    }

    const updated = await propertyRepository.releaseReservation(id);

    await propertyRepository.recordModerationEvent({
      id: crypto.randomUUID(),
      propertyId: id,
      adminId,
      action: "RELEASED",
      previousStatus: property.availabilityStatus || "RESERVED",
      newStatus: "AVAILABLE",
      reason: "Libération de la réservation",
    });

    try {
      await analyticsRepository.recordEvent({
        eventName: "reservation_released",
        propertyId: id,
        city: property.city,
        rentalCategory: property.rentalCategory,
        propertyType: property.propertyType,
        actorType: "ADMIN",
        occurredAt: new Date(),
      });
    } catch {
      /* ignore */
    }

    return mapPropertyToAdminDTO(updated);
  }

  /* =======================================================================
   * PROPERTY DELETION WORKFLOW (OWNER / ADMIN)
   * ======================================================================= */

  async deleteProperty({
    id,
    userId,
    userRole,
    reason,
  }: {
    id: string;
    userId: string;
    userRole: "OWNER" | "ADMIN" | "SUPER_ADMIN";
    reason?: string;
  }): Promise<{
    action: "DELETED" | "ARCHIVED";
    message: string;
    propertyId: string;
  }> {
    const property = await propertyRepository.findById(id);
    if (!property) {
      const err = new Error("Bien introuvable.");
      (err as any).status = 404;
      throw err;
    }

    // IDOR Protection: Owner can only delete their own properties
    if (userRole === "OWNER" && property.ownerId !== userId) {
      const err = new Error("Accès refusé. Vous n'êtes pas le propriétaire de ce bien.");
      (err as any).status = 403;
      throw err;
    }

    // Case C: Active or upcoming confirmed reservations
    const now = new Date();
    const activeReservation = await ReservationModel.findOne({
      propertyId: property.id,
      status: "CONFIRMED",
      checkOut: { $gte: now },
    })
      .lean()
      .exec();

    if (activeReservation) {
      const err = new Error(
        "Impossible de supprimer ce bien : des réservations confirmées en cours ou à venir sont enregistrées."
      );
      (err as any).status = 400;
      throw err;
    }

    // Case D: Active housing request proposal or workflow
    const activeHousingRequest = await HousingRequestModel.findOne({
      $or: [
        { selectedProperty: property.id },
        { "propertyProposal.propertyId": property.id },
      ],
      status: {
        $in: [
          "CLIENT_CONFIRMATION",
          "VISIT_COORDINATION",
          "DOCS_PENDING",
          "PAYMENT_PENDING",
        ],
      },
    })
      .lean()
      .exec();

    if (activeHousingRequest) {
      const err = new Error(
        "Impossible de supprimer ce bien : une demande de logement active est en cours pour ce bien."
      );
      (err as any).status = 400;
      throw err;
    }

    // Case B: Historical records check (past reservations, payments, financial ledgers)
    const [pastReservationsCount, paymentsCount, financialLedgerCount] = await Promise.all([
      ReservationModel.countDocuments({ propertyId: property.id }),
      PaymentModel.countDocuments({ propertyId: property.id }),
      FinancialLedgerModel.countDocuments({ propertyId: property.id }),
    ]);

    const hasHistoricalRecords =
      pastReservationsCount > 0 || paymentsCount > 0 || financialLedgerCount > 0;

    if (hasHistoricalRecords) {
      // Archive / soft delete to protect historical ledger and reservations integrity
      await propertyRepository.update(property.id, {
        status: "ARCHIVED",
        isPublished: false,
        availabilityStatus: "AVAILABLE",
        reservation: null,
        "moderation.reviewedBy": userId,
        "moderation.reviewedAt": now,
      });

      await HouseModel.updateMany(
        { $or: [{ id: property.id }, { slug: property.id }] },
        { $set: { isPublished: false, unavailable: [] } }
      ).exec();

      await AuditLogModel.create({
        id: crypto.randomUUID(),
        action: "PROPERTY_ARCHIVED_ON_DELETE",
        actorId: userId,
        actorRole: userRole,
        targetType: "PROPERTY",
        targetId: property.id,
        reason:
          reason ||
          "Bien archivé suite à une demande de suppression car des historiques de réservations ou de paiements existent.",
        details: {
          propertyTitle: property.title,
          ownerId: property.ownerId,
          pastReservationsCount,
          paymentsCount,
          financialLedgerCount,
        },
        occurredAt: now,
      });

      await propertyRepository.recordModerationEvent({
        id: crypto.randomUUID(),
        propertyId: property.id,
        adminId: userId,
        action: "ARCHIVED",
        previousStatus: property.status,
        newStatus: "ARCHIVED",
        reason:
          reason ||
          "Archivé suite à une demande de suppression (historique financier et réservations conservé).",
      });

      return {
        action: "ARCHIVED",
        message:
          "Le bien a été désactivé et archivé car des historiques de réservations ou de paiements y sont associés. Il n'est plus visible publiquement.",
        propertyId: property.id,
      };
    }

    // Case A: No historical records - Permanent deletion
    await propertyRepository.deletePermanently(property.id);

    await PropertyModerationEventModel.deleteMany({ propertyId: property.id }).exec();

    await AuditLogModel.create({
      id: crypto.randomUUID(),
      action: "PROPERTY_DELETED",
      actorId: userId,
      actorRole: userRole,
      targetType: "PROPERTY",
      targetId: property.id,
      reason: reason || "Suppression définitive du bien.",
      details: {
        propertyTitle: property.title,
        ownerId: property.ownerId,
      },
      occurredAt: now,
    });

    // Cloudinary safe asset cleanup (never target seeds/placeholders/hero)
    if (Array.isArray(property.images)) {
      for (const img of property.images) {
        const publicId = typeof img === "object" ? img?.publicId : null;
        if (
          publicId &&
          typeof publicId === "string" &&
          publicId.startsWith("location-match/properties/") &&
          !publicId.includes("seed") &&
          !publicId.includes("placeholder") &&
          !publicId.includes("hero") &&
          !publicId.startsWith("prop-")
        ) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (err) {
            console.error(`Erreur lors du nettoyage de l'asset Cloudinary ${publicId}:`, err);
          }
        }
      }
    }

    return {
      action: "DELETED",
      message: "L'annonce a été définitivement supprimée avec succès.",
      propertyId: property.id,
    };
  }
}

export const propertyService = new PropertyService();
