import { resolvePropertyPricing } from "@/lib/pricing/pricing.service";

export function normalizeImages(images: any[]) {
  if (!images || !Array.isArray(images)) return [];
  return images.map((img: any, idx: number) => {
    if (typeof img === "string") {
      return {
        id: `img-${idx}`,
        url: img,
        alt: `Photo ${idx + 1}`,
        position: idx,
        sortOrder: idx,
      };
    }
    return {
      id: img.id || `img-${idx}`,
      url: img.url,
      publicId: img.publicId,
      alt: img.alt || `Photo ${idx + 1}`,
      position: img.position ?? idx,
      sortOrder: img.sortOrder ?? idx,
      width: img.width,
      height: img.height,
    };
  });
}

/**
 * Public DTO — returned to regular visitors and customers.
 * Excludes all internal moderation details and admin-only metadata.
 */
export function mapPropertyToPublicDTO(doc: any) {
  const normalizedImages = normalizeImages(doc.images);
  const resolvedPricing = resolvePropertyPricing(doc);

  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug || doc.id,
    description: doc.description || "",
    location: doc.location?.area || doc.area || doc.location?.city || doc.city || "Mahdia",
    city: doc.city || doc.location?.city || "Mahdia",
    governorate: doc.governorate || doc.location?.governorate || "Mahdia",
    area: doc.area || doc.location?.area || "",
    rentalCategory: doc.rentalCategory || "summer",
    rentalCategories: doc.rentalCategories || [doc.rentalCategory || "summer"],
    pricePerNight: doc.pricePerNight || (resolvedPricing.pricePeriod === "night" ? resolvedPricing.unitPrice : resolvedPricing.unitPrice),
    pricing: {
      price: resolvedPricing.unitPrice,
      pricePeriod: resolvedPricing.pricePeriod,
      currency: resolvedPricing.currency,
    },
    currency: resolvedPricing.currency,
    guests: doc.capacity?.guests || doc.guests || 1,
    bedrooms: doc.capacity?.bedrooms || doc.bedrooms || 1,
    bathrooms: doc.capacity?.bathrooms || doc.bathrooms || 1,
    surface: doc.capacity?.surface || doc.surface,
    propertyType: doc.propertyType || doc.type || "Appartement",
    type: doc.type || (doc.propertyType === "Villa" ? "villa" : doc.propertyType === "Maison" ? "house" : "apartment"),
    features: doc.features || doc.categoryIds || [],
    categoryIds: doc.categoryIds || doc.features || [doc.rentalCategory || "summer"],
    coverImageId: doc.coverImageId || normalizedImages[0]?.id,
    images: normalizedImages,
    amenities: doc.amenities || [],
    rating: doc.rating,
    reviewCount: doc.reviewCount || 0,
    isFeatured: Boolean(doc.isFeatured),
    isPublished: doc.status === "PUBLISHED" || Boolean(doc.isPublished),
    availabilityStatus: doc.availabilityStatus || "AVAILABLE",
    reservation: doc.availabilityStatus === "RESERVED" && doc.reservation?.from && doc.reservation?.to
      ? {
          from: new Date(doc.reservation.from).toISOString(),
          to: new Date(doc.reservation.to).toISOString(),
        }
      : null,
    unavailable: doc.unavailable?.map((u: any) => ({
      from: u.from,
      to: u.to,
    })) || [],
  };
}

/**
 * Owner DTO — returned to the property owner.
 * Contains moderation status and rejection reason if rejected.
 */
export function mapPropertyToOwnerDTO(doc: any) {
  const normalizedImages = normalizeImages(doc.images);
  const resolvedPricing = resolvePropertyPricing(doc);

  return {
    id: doc.id,
    slug: doc.slug,
    ownerId: doc.ownerId,
    title: doc.title,
    description: doc.description || "",
    rentalCategory: doc.rentalCategory || "summer",
    rentalCategories: doc.rentalCategories || [doc.rentalCategory || "summer"],
    propertyType: doc.propertyType || doc.type || "Appartement",
    type: doc.type || (doc.propertyType === "Villa" ? "villa" : doc.propertyType === "Maison" ? "house" : "apartment"),
    features: doc.features || doc.categoryIds || [],
    categoryIds: doc.categoryIds || doc.features || [doc.rentalCategory || "summer"],
    city: doc.city || doc.location?.city || "Mahdia",
    area: doc.area || doc.location?.area || "",
    address: doc.location?.address || "",
    location: doc.location || {
      city: doc.city || "Mahdia",
      area: doc.area || "",
      country: "Tunisie",
      governorate: "Mahdia",
    },
    pricing: {
      price: resolvedPricing.unitPrice,
      pricePeriod: resolvedPricing.pricePeriod,
      currency: resolvedPricing.currency,
    },
    pricePerNight: doc.pricePerNight || (resolvedPricing.pricePeriod === "night" ? resolvedPricing.unitPrice : resolvedPricing.unitPrice),
    summerPrice: doc.summerPrice,
    studentPrice: doc.studentPrice,
    capacity: {
      guests: doc.capacity?.guests || doc.guests || 1,
      bedrooms: doc.capacity?.bedrooms || doc.bedrooms || 1,
      bathrooms: doc.capacity?.bathrooms || doc.bathrooms || 1,
      surface: doc.capacity?.surface || doc.surface,
    },
    amenities: doc.amenities || [],
    images: normalizedImages,
    status: doc.status || (doc.isPublished ? "PUBLISHED" : "DRAFT"),
    availabilityStatus: doc.availabilityStatus || "AVAILABLE",
    reservation: doc.availabilityStatus === "RESERVED" && doc.reservation?.from && doc.reservation?.to
      ? {
          from: new Date(doc.reservation.from).toISOString(),
          to: new Date(doc.reservation.to).toISOString(),
        }
      : null,
    verified: Boolean(doc.verified),
    isPublished: doc.status === "PUBLISHED",
    moderation: {
      submittedAt: doc.submittedAt || doc.moderation?.submittedAt,
      reviewedAt: doc.reviewedAt || doc.moderation?.reviewedAt,
      rejectionReason: doc.rejectionReason || doc.moderation?.rejectionReason,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Admin DTO — returned to administrators for moderation and management.
 * Includes complete owner information and full moderation data.
 */
export function mapPropertyToAdminDTO(doc: any, ownerDoc?: any) {
  const normalizedImages = normalizeImages(doc.images);
  const resolvedPricing = resolvePropertyPricing(doc);

  return {
    id: doc.id,
    slug: doc.slug,
    ownerId: doc.ownerId,
    title: doc.title,
    description: doc.description || "",
    rentalCategory: doc.rentalCategory || "summer",
    rentalCategories: doc.rentalCategories || [doc.rentalCategory || "summer"],
    propertyType: doc.propertyType || doc.type || "Appartement",
    type: doc.type || (doc.propertyType === "Villa" ? "villa" : doc.propertyType === "Maison" ? "house" : "apartment"),
    features: doc.features || doc.categoryIds || [],
    categoryIds: doc.categoryIds || doc.features || [doc.rentalCategory || "summer"],
    city: doc.city || doc.location?.city || "Mahdia",
    area: doc.area || doc.location?.area || "",
    address: doc.location?.address || "",
    location: doc.location || {
      city: doc.city || "Mahdia",
      area: doc.area || "",
      country: "Tunisie",
      governorate: "Mahdia",
    },
    pricing: {
      price: resolvedPricing.unitPrice,
      pricePeriod: resolvedPricing.pricePeriod,
      currency: resolvedPricing.currency,
    },
    pricePerNight: doc.pricePerNight || (resolvedPricing.pricePeriod === "night" ? resolvedPricing.unitPrice : resolvedPricing.unitPrice),
    summerPrice: doc.summerPrice || (doc.rentalCategory === "summer" ? doc.pricing?.price : undefined),
    studentPrice: doc.studentPrice || (doc.rentalCategory === "student" ? doc.pricing?.price : undefined),
    capacity: {
      guests: doc.capacity?.guests || doc.guests || 1,
      bedrooms: doc.capacity?.bedrooms || doc.bedrooms || 1,
      bathrooms: doc.capacity?.bathrooms || doc.bathrooms || 1,
      surface: doc.capacity?.surface || doc.surface,
    },
    bedrooms: doc.capacity?.bedrooms || doc.bedrooms || 1,
    bathrooms: doc.capacity?.bathrooms || doc.bathrooms || 1,
    surface: doc.capacity?.surface || doc.surface,
    amenities: doc.amenities || [],
    images: normalizedImages,
    status: doc.status || (doc.isPublished ? "PUBLISHED" : "DRAFT"),
    availabilityStatus: doc.availabilityStatus || "AVAILABLE",
    reservation: doc.reservation?.from && doc.reservation?.to
      ? {
          from: new Date(doc.reservation.from).toISOString(),
          to: new Date(doc.reservation.to).toISOString(),
          updatedAt: doc.reservation.updatedAt ? new Date(doc.reservation.updatedAt).toISOString() : undefined,
          updatedBy: doc.reservation.updatedBy,
        }
      : null,
    verified: Boolean(doc.verified),
    isPublished: doc.status === "PUBLISHED" || Boolean(doc.isPublished),
    moderation: {
      submittedAt: doc.submittedAt || doc.moderation?.submittedAt,
      reviewedAt: doc.reviewedAt || doc.moderation?.reviewedAt,
      reviewedBy: doc.reviewedBy || doc.moderation?.reviewedBy,
      rejectionReason: doc.rejectionReason || doc.moderation?.rejectionReason,
    },
    owner: ownerDoc
      ? {
          id: ownerDoc.id,
          name: ownerDoc.name || `${ownerDoc.firstName || ""} ${ownerDoc.lastName || ""}`.trim(),
          phone: ownerDoc.phone,
          email: ownerDoc.email,
        }
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Backward compatibility alias for rentals module
 */
export const mapHouseToDTO = mapPropertyToPublicDTO;

