import { propertyRepository } from "../repositories/PropertyRepository";
import { mapHouseToDTO } from "../dtos/property";
import type { PropertySearchInput } from "../validations/property";

export class PropertyService {
  async searchProperties(filters: PropertySearchInput) {
    const rawProperties = await propertyRepository.search(filters);
    return rawProperties.map(mapHouseToDTO);
  }

  async getPropertyBySlug(slug: string) {
    const rawProperty = await propertyRepository.findBySlug(slug);
    if (!rawProperty) {
      return null;
    }
    return mapHouseToDTO(rawProperty);
  }

  async getFeaturedProperties() {
    const rawProperties = await propertyRepository.findFeatured();
    return rawProperties.map(mapHouseToDTO);
  }

  async getCategories() {
    const rawCategories = await propertyRepository.getAllCategories();
    return rawCategories.map(c => ({
      id: c.id,
      slug: c.slug,
      label: c.label,
      rentalCategory: c.rentalCategory,
      icon: c.icon,
    }));
  }

  async getDestinations() {
    const rawDestinations = await propertyRepository.getAllDestinations();
    return rawDestinations.map(d => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      propertyCount: d.propertyCount,
      image: d.image,
    }));
  }
}

export const propertyService = new PropertyService();
