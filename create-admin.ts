import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("No MONGODB_URI found.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  passwordHash: String,
  role: String,
  firstName: String,
  lastName: String,
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(uri!);
    console.log("Connected to MongoDB.");

    const email = "admin@locmaison.com";
    const password = "adminpassword";

    const existing = await UserModel.findOne({ email });
    if (existing) {
      console.log("Admin already exists!");
      await UserModel.updateOne({ email }, { $set: { role: "ADMIN" } });
      console.log("Ensured role is ADMIN.");
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await UserModel.create({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        role: "ADMIN",
        firstName: "System",
        lastName: "Admin",
      });
      console.log("Admin created successfully!");
    }
    
    console.log("Login Credentials:");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
