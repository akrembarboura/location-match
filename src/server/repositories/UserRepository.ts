import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { UserModel, OwnerModel } from "@/lib/models";

function buildUserQuery(userId: string) {
  if (!userId) return { id: "__invalid_id__" };
  const isHex = typeof userId === "string" && /^[0-9a-fA-F]{24}$/.test(userId);
  const clauses: any[] = [{ id: userId }];
  if (isHex) {
    clauses.push({ _id: new mongoose.Types.ObjectId(userId) });
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

export class UserRepository {
  async findByEmail(email: string) {
    await connectToDatabase();
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    // Search exact match or case-insensitive regex for database resilience
    return UserModel.findOne({
      $or: [{ email: cleanEmail }, { email: new RegExp(`^${cleanEmail}$`, "i") }],
    }).lean().exec();
  }

  async findById(id: string) {
    await connectToDatabase();
    return UserModel.findOne(buildUserQuery(id)).lean().exec();
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
    return UserModel.findOneAndUpdate(buildUserQuery(userId), { $set: { status } }, { returnDocument: "after" }).exec();
  }

  async setResetToken(userId: string, token: string, expires: Date) {
    await connectToDatabase();
    return UserModel.findOneAndUpdate(
      buildUserQuery(userId),
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
    return UserModel.findOneAndUpdate(
      buildUserQuery(userId),
      {
        $set: { passwordHash: newPasswordHash },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      },
      { returnDocument: "after" }
    ).exec();
  }
}

export const userRepository = new UserRepository();
