import connectToDatabase from "@/lib/mongoose";
import {
  PropertyModel,
  HouseModel,
  CategoryModel,
  DestinationModel,
  PropertyModerationEventModel,
} from "@/lib/models";
import type { PropertySearchInput } from "../validations/property";

export class PropertyRepository {
  /**
   * Search for public properties (strictly PUBLISHED only).
   */
  async search(filters: PropertySearchInput) {
    await connectToDatabase();

    const query: any = {
      $or: [
        { status: "PUBLISHED" },
        { isPublished: true, status: { $in: ["PUBLISHED", undefined, null] } },
      ],
    };

    if (filters.rentalCategory) {
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { rentalCategory: filters.rentalCategory },
          { rentalCategories: filters.rentalCategory },
        ],
      });
    }

    if (filters.city) {
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { city: { $regex: new RegExp(`^${filters.city}$`, "i") } },
          { "location.city": { $regex: new RegExp(`^${filters.city}$`, "i") } },
        ],
      });
    }

    if (filters.category) {
      if (!query.$and) query.$and = [];
      const cat = filters.category.toLowerCase();
      if (cat === "villa") {
        query.$and.push({
          $or: [
            { categoryIds: "villa" },
            { features: "villa" },
            { propertyType: { $regex: /villa/i } },
            { type: { $regex: /villa/i } },
          ],
        });
      } else if (cat === "house") {
        query.$and.push({
          $or: [
            { categoryIds: "house" },
            { features: "house" },
            { categoryIds: "maison" },
            { propertyType: { $regex: /maison|house/i } },
            { type: { $regex: /maison|house/i } },
          ],
        });
      } else if (cat === "apartment") {
        query.$and.push({
          $or: [
            { categoryIds: "apartment" },
            { features: "apartment" },
            { categoryIds: "appartement" },
            { propertyType: { $regex: /appartement|apartment|studio|s\+[1234]/i } },
            { type: { $regex: /appartement|apartment|studio|s\+[1234]/i } },
          ],
        });
      } else if (cat === "beach") {
        query.$and.push({
          $or: [
            { categoryIds: "beach" },
            { features: "beach" },
            { categoryIds: "bord-de-mer" },
            { amenities: { $regex: /mer|plage|beach|bord-de-mer|pieds dans l'eau/i } },
            { description: { $regex: /pieds dans l'eau|plage|mer/i } },
            { title: { $regex: /pieds dans l'eau|plage|mer/i } },
          ],
        });
      } else if (cat === "family") {
        query.$and.push({
          $or: [
            { categoryIds: "family" },
            { features: "family" },
            { categoryIds: "familles" },
            { guests: { $gte: 4 } },
            { "capacity.guests": { $gte: 4 } },
          ],
        });
      } else if (cat === "pool") {
        query.$and.push({
          $or: [
            { categoryIds: "pool" },
            { features: "pool" },
            { categoryIds: "piscine" },
            { amenities: { $regex: /piscine|pool/i } },
            { title: { $regex: /piscine|pool/i } },
            { description: { $regex: /piscine|pool/i } },
          ],
        });
      } else {
        query.$and.push({
          $or: [
            { categoryIds: filters.category },
            { features: filters.category },
          ],
        });
      }
    }

    if (filters.guests) {
      query.$or = [
        { guests: { $gte: filters.guests } },
        { "capacity.guests": { $gte: filters.guests } },
      ];
    }

    // Availability check
    if (filters.checkIn && filters.checkOut) {
      const checkInDate = new Date(filters.checkIn);
      const checkOutDate = new Date(filters.checkOut);
      const validDates = !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime());

      const availabilityConditions: any[] = [
        {
          unavailable: {
            $not: {
              $elemMatch: {
                from: { $lt: filters.checkOut },
                to: { $gt: filters.checkIn },
              },
            },
          },
        },
      ];

      if (validDates) {
        availabilityConditions.push({
          $nor: [
            {
              availabilityStatus: "RESERVED",
              "reservation.from": { $lt: checkOutDate },
              "reservation.to": { $gt: checkInDate },
            },
          ],
        });
      }

      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push(...availabilityConditions);
    }

    return await PropertyModel.find(query).sort({ createdAt: -1 }).lean().exec();
  }

  async findBySlug(slug: string) {
    await connectToDatabase();
    return await PropertyModel.findOne({
      slug,
      $or: [
        { status: "PUBLISHED" },
        { isPublished: true, status: { $in: ["PUBLISHED", undefined, null] } },
      ],
    })
      .lean()
      .exec();
  }

  async findById(id: string) {
    await connectToDatabase();
    return await PropertyModel.findOne({ id }).lean().exec();
  }

  async findFeatured() {
    await connectToDatabase();
    return await PropertyModel.find({
      $or: [
        { status: "PUBLISHED" },
        { isPublished: true, status: { $in: ["PUBLISHED", undefined, null] } },
      ],
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(8)
      .lean()
      .exec();
  }

  async findByOwnerId(ownerId: string) {
    await connectToDatabase();
    return await PropertyModel.find({ ownerId }).sort({ createdAt: -1 }).lean().exec();
  }

  async findAdminProperties(filters: { status?: string } = {}) {
    await connectToDatabase();
    const query: any = {};
    if (filters.status && filters.status !== "ALL") {
      query.status = filters.status;
    }
    return await PropertyModel.find(query).sort({ createdAt: -1 }).lean().exec();
  }

  async countByStatus() {
    await connectToDatabase();
    const [all, pending, underReview, published, rejected, archived] = await Promise.all([
      PropertyModel.countDocuments({}),
      PropertyModel.countDocuments({ status: "PENDING_REVIEW" }),
      PropertyModel.countDocuments({ status: "UNDER_REVIEW" }),
      PropertyModel.countDocuments({
        $or: [
          { status: "PUBLISHED" },
          { isPublished: true, status: { $in: ["PUBLISHED", undefined, null] } },
        ],
      }),
      PropertyModel.countDocuments({ status: "REJECTED" }),
      PropertyModel.countDocuments({ status: "ARCHIVED" }),
    ]);

    return {
      all,
      pending,
      underReview,
      published,
      rejected,
      archived,
    };
  }

  async create(data: any) {
    await connectToDatabase();
    return await PropertyModel.create(data);
  }

  async update(id: string, updateData: any, unsetData?: any) {
    await connectToDatabase();
    const updateOp: any = { $set: updateData };
    if (unsetData && Object.keys(unsetData).length > 0) {
      updateOp.$unset = unsetData;
    }
    return await PropertyModel.findOneAndUpdate(
      { id },
      updateOp,
      { returnDocument: "after" }
    )
      .lean()
      .exec();
  }

  async reserve(id: string, reservation: { from: Date; to: Date; adminId: string }) {
    await connectToDatabase();
    let updated = await PropertyModel.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      {
        $set: {
          availabilityStatus: "RESERVED",
          reservation: {
            from: reservation.from,
            to: reservation.to,
            updatedAt: new Date(),
            updatedBy: reservation.adminId,
          },
        },
      },
      { returnDocument: "after" }
    )
      .lean()
      .exec();

    if (!updated) {
      await HouseModel.findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        {
          $push: {
            unavailable: {
              from: reservation.from.toISOString().slice(0, 10),
              to: reservation.to.toISOString().slice(0, 10),
            },
          },
        },
        { returnDocument: "after" }
      )
        .lean()
        .exec();
    }

    return updated;
  }

  async releaseReservation(id: string) {
    await connectToDatabase();
    const updated = await PropertyModel.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      {
        $set: {
          availabilityStatus: "AVAILABLE",
        },
        $unset: {
          reservation: 1,
        },
      },
      { returnDocument: "after" }
    )
      .lean()
      .exec();

    return updated;
  }

  async recordModerationEvent(eventData: any) {
    await connectToDatabase();
    return await PropertyModerationEventModel.create(eventData);
  }

  async getModerationEvents(propertyId: string) {
    await connectToDatabase();
    return await PropertyModerationEventModel.find({ propertyId })
      .sort({ createdAt: -1 })
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
