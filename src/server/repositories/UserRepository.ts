import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { UserModel, OwnerModel } from "@/lib/models";

export class UserRepository {
  async findByEmail(email: string) {
    await connectToDatabase();
    return UserModel.findOne({ email }).lean().exec();
  }

  async findById(id: string) {
    await connectToDatabase();
    // Support either custom id field or _id safely
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    return UserModel.findOne(query).lean().exec();
  }

  async create(userData: any) {
    await connectToDatabase();
    return UserModel.create(userData);
  }

  async linkOwnerProfile(userId: string, ownerId: string) {
    await connectToDatabase();
    return OwnerModel.findOneAndUpdate({ id: ownerId }, { userId }, { returnDocument: "after" }).exec();
  }
}

export const userRepository = new UserRepository();
