import connectToDatabase from "@/lib/mongoose";
import { NotificationModel } from "@/lib/models";
import crypto from "crypto";

export interface CreateNotificationInput {
  type?:
    | "NEW_REQUEST"
    | "STATUS_CHANGE"
    | "PROPOSAL_ACCEPTED"
    | "PROPOSAL_REJECTED"
    | "PROPERTY_SUBMITTED"
    | "PROPERTY_APPROVED"
    | "PROPERTY_REJECTED"
    | "SYSTEM";
  title: string;
  message: string;
  requestId?: string;
  propertyId?: string;
  recipientRole?: string;
  recipientId?: string;
}

export class NotificationService {
  async createNotification(input: CreateNotificationInput) {
    await connectToDatabase();
    const id = crypto.randomUUID();
    return await NotificationModel.create({
      id,
      type: input.type || "NEW_REQUEST",
      title: input.title,
      message: input.message,
      requestId: input.requestId,
      propertyId: input.propertyId,
      recipientRole: input.recipientRole || "ADMIN",
      recipientId: input.recipientId,
      read: false,
    });
  }

  async getAdminNotifications(limit = 20) {
    await connectToDatabase();
    return await NotificationModel.find({ recipientRole: "ADMIN" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async getUnreadCount(role = "ADMIN") {
    await connectToDatabase();
    return await NotificationModel.countDocuments({
      recipientRole: role,
      read: false,
    });
  }

  async markAsRead(id: string) {
    await connectToDatabase();
    return await NotificationModel.findOneAndUpdate(
      { id },
      { $set: { read: true } },
      { returnDocument: "after" }
    )
      .lean()
      .exec();
  }

  async markAllAsRead(role = "ADMIN") {
    await connectToDatabase();
    await NotificationModel.updateMany(
      { recipientRole: role, read: false },
      { $set: { read: true } }
    );
    return { success: true };
  }
}

export const notificationService = new NotificationService();
