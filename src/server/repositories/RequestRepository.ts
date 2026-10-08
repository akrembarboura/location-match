import connectToDatabase from "@/lib/mongoose";
import { HousingRequestModel } from "@/lib/models";

export class RequestRepository {
  async create(data: any) {
    await connectToDatabase();
    return await HousingRequestModel.create(data);
  }

  async findById(id: string) {
    await connectToDatabase();
    return await HousingRequestModel.findOne({ id }).lean().exec();
  }

  async findByCustomerId(customerId: string) {
    await connectToDatabase();
    return await HousingRequestModel.find({ customerId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findAll(filters: { status?: string; rentalCategory?: string; page?: number; limit?: number } = {}) {
    await connectToDatabase();
    const query: any = {};
    if (filters.status && filters.status !== "ALL") query.status = filters.status;
    if (filters.rentalCategory && filters.rentalCategory !== "ALL") query.rentalCategory = filters.rentalCategory;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(50, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      HousingRequestModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      HousingRequestModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateStatus(id: string, status: string, adminNotes?: string) {
    await connectToDatabase();
    const update: any = { status };
    if (adminNotes !== undefined) {
      update.adminNotes = adminNotes;
    }
    return await HousingRequestModel.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: "after" }
    )
      .lean()
      .exec();
  }

  async addProposal(id: string, proposal: {
    propertyId: string;
    proposedPrice?: number;
    checkIn?: string;
    checkOut?: string;
    adminMessage?: string;
  }) {
    await connectToDatabase();
    return await HousingRequestModel.findOneAndUpdate(
      { id },
      {
        $push: { proposedProperties: proposal },
        $set: { status: "PROPERTY_PROPOSED" },
      },
      { returnDocument: "after" }
    )
      .lean()
      .exec();
  }

  async updateProposalStatus(
    requestId: string,
    propertyId: string,
    proposalStatus: "ACCEPTED" | "REJECTED"
  ) {
    await connectToDatabase();
    const newRequestStatus =
      proposalStatus === "ACCEPTED" ? "CONFIRMED" : "PROPERTY_PROPOSED";

    return await HousingRequestModel.findOneAndUpdate(
      { id: requestId, "proposedProperties.propertyId": propertyId },
      {
        $set: {
          "proposedProperties.$.status": proposalStatus,
          status: newRequestStatus,
          ...(proposalStatus === "ACCEPTED" ? { selectedProperty: propertyId } : {}),
        },
      },
      { returnDocument: "after" }
    )
      .lean()
      .exec();
  }
}

export const requestRepository = new RequestRepository();
