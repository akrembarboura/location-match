process.env.JWT_SECRET = "test-secret-key-must-be-long-enough-for-hs256";
process.env.NODE_ENV = "test";

import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Mock next/headers
vi.mock("next/headers", () => {
  const store = new Map<string, any>();
  return {
    cookies: vi.fn(() => ({
      get: (name: string) => store.get(name),
      set: (cookie: any) => store.set(cookie.name, { value: cookie.value, ...cookie }),
      delete: (name: string) => store.delete(name),
    })),
  };
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = "test-secret-key-must-be-long-enough-for-hs256";
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

