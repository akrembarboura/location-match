import connectToDatabase from "@/lib/mongoose";
import { HouseModel, CategoryModel, DestinationModel } from "@/lib/models";
import type { PropertySearchInput } from "../validations/property";

export class PropertyRepository {
  async search(filters: PropertySearchInput) {
    await connectToDatabase();
    
    const query: any = { isPublished: true };

    if (filters.rentalCategory) {
      query.rentalCategory = filters.rentalCategory;
    }

    if (filters.city) {
      // Case insensitive exact match or regex
      query.city = { $regex: new RegExp(`^${filters.city}$`, "i") };
    }

    if (filters.category) {
      query.categoryIds = filters.category;
    }

    if (filters.guests) {
      query.guests = { $gte: filters.guests };
    }

    // Availability check in MongoDB
    if (filters.checkIn && filters.checkOut) {
      query.unavailable = {
        $not: {
          $elemMatch: {
            from: { $lt: filters.checkOut },
            to: { $gt: filters.checkIn },
          },
        },
      };
    }

    return await HouseModel.find(query).lean().exec();
  }

  async findBySlug(slug: string) {
    await connectToDatabase();
    return await HouseModel.findOne({ slug, isPublished: true }).lean().exec();
  }

  async findFeatured() {
    await connectToDatabase();
    return await HouseModel.find({ isPublished: true, isFeatured: true, rentalCategory: "summer" })
      .limit(8)
      .lean()
      .exec();
  }

  async getAllCategories() {
    await connectToDatabase();
    return await CategoryModel.find({}).lean().exec();
  }

  async getAllDestinations() {
    await connectToDatabase();
    return await DestinationModel.find({}).lean().exec();
  }
}

export const propertyRepository = new PropertyRepository();
