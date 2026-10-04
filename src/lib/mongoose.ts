import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
    }

    const opts = {
      bufferCommands: false,
    };
    
    console.log("Connecting to MongoDB in Next.js context...");
    console.log("URI starting with:", uri.substring(0, 30));

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log("Connected successfully to MongoDB.");
      return mongoose;
    }).catch(e => {
      console.error("Mongoose connection failed:", e);
      throw e;
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
