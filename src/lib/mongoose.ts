import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};
const cached =
  globalWithMongoose.mongoose ??
  (globalWithMongoose.mongoose = { conn: null, promise: null });

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri =
      process.env.MONGODB_URI?.trim() ||
      (process.env.NODE_ENV === "development"
        ? "mongodb://127.0.0.1:27017/location_match"
        : "");
    if (!uri) {
      throw new Error(
        "MONGODB_URI is required in production. Configure it in the hosting provider's environment variables."
      );
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    console.log("Connecting to MongoDB...");

    cached.promise = mongoose.connect(uri, opts).then((connection) => {
      console.log("Connected successfully to MongoDB.");
      return connection;
    }).catch((error: unknown) => {
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (typeof error.code === "number" || typeof error.code === "string")
          ? error.code
          : undefined;
      const errorCodeName =
        typeof error === "object" &&
        error !== null &&
        "codeName" in error &&
        typeof error.codeName === "string"
          ? error.codeName
          : undefined;
      console.error("Mongoose connection failed:", {
        name: errorName,
        ...(errorCode !== undefined && { code: errorCode }),
        ...(errorCodeName && { codeName: errorCodeName }),
      });
      if (errorName === "MongooseServerSelectionError") {
        console.error("Tip: If using MongoDB Atlas, check if your current IP address is whitelisted under Network Access in MongoDB Atlas dashboard.");
      }
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
