import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

import connectToDatabase from "../src/lib/mongoose";

async function testConnection() {
  try {
    console.log("Connecting to MongoDB...");
    const mongoose = await connectToDatabase();
    console.log("Successfully connected to MongoDB!");
    console.log("Database Name:", mongoose.connection.name);
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

testConnection();
