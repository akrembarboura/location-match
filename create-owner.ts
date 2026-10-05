import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("No MONGODB_URI found in .env.local.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  passwordHash: String,
  role: String,
  firstName: String,
  lastName: String,
  phone: String,
});

const ownerSchema = new mongoose.Schema({
  id: String,
  userId: String,
  name: String,
  phone: String,
  area: String,
  properties: Number,
  since: String,
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const OwnerModel = mongoose.models.Owner || mongoose.model("Owner", ownerSchema);

async function createOwner() {
  try {
    await mongoose.connect(uri!);
    console.log("Connected to MongoDB.");

    const email = "owner@locmaison.com";
    const password = "ownerpassword";

    let user = await UserModel.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (user) {
      console.log("Owner user already exists, updating role to OWNER...");
      await UserModel.updateOne(
        { email },
        { $set: { role: "OWNER", passwordHash, firstName: "Salah", lastName: "Trabelsi", phone: "21698123456" } }
      );
    } else {
      const userId = crypto.randomUUID();
      user = await UserModel.create({
        id: userId,
        email,
        passwordHash,
        role: "OWNER",
        firstName: "Salah",
        lastName: "Trabelsi",
        phone: "21698123456",
      });
      console.log("Created owner user!");
    }

    const ownerDoc = await OwnerModel.findOne({ email });
    if (!ownerDoc) {
      await OwnerModel.create({
        id: `OWN-${Date.now().toString(36).toUpperCase()}`,
        userId: user.id || user._id,
        name: "Salah Trabelsi",
        phone: "21698123456",
        area: "Mahdia",
        properties: 1,
        since: new Date().getFullYear().toString(),
      });
      console.log("Created owner profile document!");
    }

    console.log("\n==========================================");
    console.log("Owner Account Ready!");
    console.log("Email:   ", email);
    console.log("Password:", password);
    console.log("Role:    ", "OWNER");
    console.log("URL:     ", "http://localhost:3000/owner");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating owner account:", error);
    process.exit(1);
  }
}

createOwner();
