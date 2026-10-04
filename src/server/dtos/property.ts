export function mapHouseToDTO(houseDoc: any) {
  // Convert Mongoose document to plain object and remove internal fields
  return {
    id: houseDoc.id,
    title: houseDoc.title,
    slug: houseDoc.slug,
    description: houseDoc.description,
    location: houseDoc.location,
    city: houseDoc.city,
    governorate: houseDoc.governorate,
    rentalCategory: houseDoc.rentalCategory,
    pricePerNight: houseDoc.pricePerNight,
    currency: houseDoc.currency,
    guests: houseDoc.guests,
    bedrooms: houseDoc.bedrooms,
    bathrooms: houseDoc.bathrooms,
    propertyType: houseDoc.propertyType,
    categoryIds: houseDoc.categoryIds,
    coverImageId: houseDoc.coverImageId,
    images: houseDoc.images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
      width: img.width,
      height: img.height,
    })) || [],
    amenities: houseDoc.amenities || [],
    rating: houseDoc.rating,
    reviewCount: houseDoc.reviewCount,
    isFeatured: houseDoc.isFeatured,
    isPublished: houseDoc.isPublished,
    unavailable: houseDoc.unavailable?.map((u: any) => ({
      from: u.from,
      to: u.to,
    })) || [],
  };
}
