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

  async findAll(filters: { status?: string; rentalCategory?: string } = {}) {
    await connectToDatabase();
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.rentalCategory) query.rentalCategory = filters.rentalCategory;
    return await HousingRequestModel.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
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
