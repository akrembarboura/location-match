import mongoose, { Schema } from "mongoose";
import type { RateLimitStore } from "./types";
import connectToDatabase from "@/lib/mongoose";

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  reset: { type: Number, required: true },
  expireAt: { type: Date, required: true },
});

// TTL index to automatically clean up expired counters
RateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel = mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);

/**
 * Production-ready shared store using MongoDB.
 */
export class MongoStore implements RateLimitStore {
  async increment(key: string, windowMs: number): Promise<{ count: number; reset: number }> {
    await connectToDatabase();
    const now = Date.now();
    const resetTime = now + windowMs;
    const expireAt = new Date(resetTime);

    const result = await RateLimitModel.findOneAndUpdate(
      { key, reset: { $gt: now } },
      {
        $inc: { count: 1 },
        $setOnInsert: { key, reset: resetTime, expireAt },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      count: result.count,
      reset: result.reset,
    };
  }
}
