import { describe, it, expect } from "vitest";
import mongoose, { Schema } from "mongoose";

const TestRateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  reset: { type: Number, required: true },
  expireAt: { type: Date, required: true },
});

const TestModel = mongoose.models.TestRL || mongoose.model("TestRL", TestRateLimitSchema);

describe("MongoStore Upsert Bug Test", () => {
  it("reproduces E11000 error when window has expired but document still exists", async () => {
    // 1. Insert an expired document
    const oldKey = "rate-limit:test-key";
    const pastReset = Date.now() - 5000;
    await TestModel.create({
      key: oldKey,
      count: 5,
      reset: pastReset,
      expireAt: new Date(pastReset),
    });

    // 2. Try the exact MongoStore query
    const now = Date.now();
    const windowMs = 60000;
    const resetTime = now + windowMs;
    const expireAt = new Date(resetTime);

    let errorThrown = false;
    try {
      await TestModel.findOneAndUpdate(
        { key: oldKey, reset: { $gt: now } },
        {
          $inc: { count: 1 },
          $setOnInsert: { key: oldKey, reset: resetTime, expireAt },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      errorThrown = true;
      console.log("CAUGHT EXPECTED ERROR:", err.code, err.message);
      expect(err.code).toBe(11000);
    }

    expect(errorThrown).toBe(true);
  });
});
