import { describe, it, expect, beforeEach } from "vitest";
import { MongoStore, RateLimitModel } from "@/server/rate-limit/mongo-store";
import connectToDatabase from "@/lib/mongoose";

describe("MongoStore Rate Limiting", () => {
  let store: MongoStore;

  beforeEach(async () => {
    await connectToDatabase();
    await RateLimitModel.deleteMany({});
    store = new MongoStore();
  });

  it("increments counters correctly within the active window", async () => {
    const res1 = await store.increment("test:key:1", 60000);
    expect(res1.count).toBe(1);

    const res2 = await store.increment("test:key:1", 60000);
    expect(res2.count).toBe(2);

    const res3 = await store.increment("test:key:1", 60000);
    expect(res3.count).toBe(3);
    expect(res3.reset).toBe(res1.reset);
  });

  it("resets counter after window expires without throwing duplicate key errors", async () => {
    const key = "test:expired:key";
    
    // Manually create an expired rate limit entry
    const pastReset = Date.now() - 1000;
    await RateLimitModel.create({
      key,
      count: 15,
      reset: pastReset,
      expireAt: new Date(pastReset),
    });

    // Increment after expiry — should reset count to 1 and update window
    const res = await store.increment(key, 60000);
    expect(res.count).toBe(1);
    expect(res.reset).toBeGreaterThan(Date.now());

    // Next call within new window increments to 2
    const resNext = await store.increment(key, 60000);
    expect(resNext.count).toBe(2);
  });

  it("keeps different keys independent", async () => {
    const resA = await store.increment("key:A", 60000);
    const resB = await store.increment("key:B", 60000);

    expect(resA.count).toBe(1);
    expect(resB.count).toBe(1);

    const resA2 = await store.increment("key:A", 60000);
    expect(resA2.count).toBe(2);
    expect(resB.count).toBe(1);
  });
});

