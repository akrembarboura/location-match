import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { UserModel, OwnerModel } from "@/lib/models";

export class UserRepository {
  async findByEmail(email: string) {
    await connectToDatabase();
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    // Search exact match or case-insensitive regex for database resilience
    return UserModel.findOne({
      $or: [{ email: cleanEmail }, { email: new RegExp(`^${cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") }],
    }).lean().exec();
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

  async updateStatus(userId: string, status: string) {
    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    const query = isObjectId ? { $or: [{ id: userId }, { _id: userId }] } : { id: userId };
    return UserModel.findOneAndUpdate(query, { $set: { status } }, { returnDocument: "after" }).exec();
  }

  async setResetToken(userId: string, token: string, expires: Date) {
    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    const query = isObjectId ? { $or: [{ id: userId }, { _id: userId }] } : { id: userId };
    return UserModel.findOneAndUpdate(
      query,
      { $set: { resetPasswordToken: token, resetPasswordExpires: expires } },
      { returnDocument: "after" }
    ).exec();
  }

  async findByResetToken(token: string) {
    await connectToDatabase();
    if (!token) return null;
    return UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).exec();
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    const query = isObjectId ? { $or: [{ id: userId }, { _id: userId }] } : { id: userId };
    return UserModel.findOneAndUpdate(
      query,
      {
        $set: { passwordHash: newPasswordHash },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      },
      { returnDocument: "after" }
    ).exec();
  }
}

export const userRepository = new UserRepository();
