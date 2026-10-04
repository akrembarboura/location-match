import { AnalyticsEventModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import type { TrackEventInput } from "@/lib/analytics/validations";
import crypto from "crypto";

export class AnalyticsRepository {
  getDateFilter(period: "7d" | "30d" | "90d" | "all" = "30d"): { $gte?: Date } {
    if (period === "all") return {};

    const now = new Date();
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { $gte: past };
  }

  async recordEvent(input: TrackEventInput): Promise<void> {
    await connectToDatabase();
    const id = `EVT-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;

    await AnalyticsEventModel.create({
      id,
      eventName: input.eventName,
      propertyId: input.propertyId,
      rentalCategory: input.rentalCategory,
      propertyType: input.propertyType,
      city: input.city,
      anonymousId: input.anonymousId,
      sessionId: input.sessionId,
      actorType: input.actorType || "ANONYMOUS",
      properties: input.properties || {},
      occurredAt: input.occurredAt || new Date(),
    });
  }

  async countUniqueVisitors(period: "7d" | "30d" | "90d" | "all" = "30d"): Promise<number> {
    await connectToDatabase();
    const dateFilter = this.getDateFilter(period);
    const query: any = {};
    if (dateFilter.$gte) query.occurredAt = dateFilter;

    const uniqueAnon = await AnalyticsEventModel.distinct("anonymousId", query);
    return uniqueAnon.filter(Boolean).length;
  }

  async countEvents(
    eventName: string | string[],
    period: "7d" | "30d" | "90d" | "all" = "30d"
  ): Promise<number> {
    await connectToDatabase();
    const dateFilter = this.getDateFilter(period);
    const query: any = {};
    if (Array.isArray(eventName)) {
      query.eventName = { $in: eventName };
    } else {
      query.eventName = eventName;
    }
    if (dateFilter.$gte) query.occurredAt = dateFilter;

    return await AnalyticsEventModel.countDocuments(query);
  }

  async getPropertyViews(propertyId: string, period: "7d" | "30d" | "90d" | "all" = "all"): Promise<number> {
    await connectToDatabase();
    const dateFilter = this.getDateFilter(period);
    const query: any = {
      propertyId,
      eventName: "property_viewed",
    };
    if (dateFilter.$gte) query.occurredAt = dateFilter;

    return await AnalyticsEventModel.countDocuments(query);
  }

  async getPropertyFavorites(propertyId: string): Promise<number> {
    await connectToDatabase();
    const [favs, unfavs] = await Promise.all([
      AnalyticsEventModel.countDocuments({ propertyId, eventName: "property_favorited" }),
      AnalyticsEventModel.countDocuments({ propertyId, eventName: "property_unfavorited" }),
    ]);
    return Math.max(0, favs - unfavs);
  }

  async getAllPropertyViewsMap(period: "7d" | "30d" | "90d" | "all" = "all"): Promise<Map<string, number>> {
    await connectToDatabase();
    const dateFilter = this.getDateFilter(period);
    const match: any = { eventName: "property_viewed", propertyId: { $exists: true, $ne: null } };
    if (dateFilter.$gte) match.occurredAt = dateFilter;

    const results = await AnalyticsEventModel.aggregate([
      { $match: match },
      { $group: { _id: "$propertyId", views: { $sum: 1 } } },
    ]);

    const map = new Map<string, number>();
    for (const r of results) {
      if (r._id) map.set(r._id, r.views);
    }
    return map;
  }

  async getAllPropertyFavoritesMap(): Promise<Map<string, number>> {
    await connectToDatabase();
    const results = await AnalyticsEventModel.aggregate([
      {
        $match: {
          eventName: { $in: ["property_favorited", "property_unfavorited"] },
          propertyId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$propertyId",
          favs: {
            $sum: { $cond: [{ $eq: ["$eventName", "property_favorited"] }, 1, 0] },
          },
          unfavs: {
            $sum: { $cond: [{ $eq: ["$eventName", "property_unfavorited"] }, 1, 0] },
          },
        },
      },
    ]);

    const map = new Map<string, number>();
    for (const r of results) {
      if (r._id) {
        map.set(r._id, Math.max(0, r.favs - r.unfavs));
      }
    }
    return map;
  }

  async getSearchedCities(period: "7d" | "30d" | "90d" | "all" = "30d"): Promise<Array<{ city: string; count: number }>> {
    await connectToDatabase();
    const dateFilter = this.getDateFilter(period);
    const match: any = {
      eventName: "search_performed",
      city: { $exists: true, $nin: ["", null] },
    };
    if (dateFilter.$gte) match.occurredAt = dateFilter;

    const results = await AnalyticsEventModel.aggregate([
      { $match: match },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return results.map((r: any) => ({ city: r._id, count: r.count }));
  }
}

export const analyticsRepository = new AnalyticsRepository();
