import mongoose, { Schema, Document } from "mongoose";

export const ROLE_ENUM = ["CUSTOMER", "OWNER", "ADMIN", "SUPER_ADMIN"] as const;
export type Role = typeof ROLE_ENUM[number];

const UserSchema = new Schema({
  id: { type: String, unique: true }, // We'll keep id for consistency or just use _id
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLE_ENUM, default: "CUSTOMER" },
  firstName: String,
  lastName: String,
  phone: String,
  avatar: String,
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);


// --- HOUSES (Rentals API) ---
const HouseImageSchema = new Schema({
  id: String,
  url: String,
  alt: String,
  position: Number,
  width: Number,
  height: Number,
}, { _id: false });

const HouseSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  slug: String,
  description: String,
  location: String,
  city: String,
  governorate: String,
  rentalCategory: String,
  pricePerNight: Number,
  currency: { type: String, default: "TND" },
  guests: Number,
  bedrooms: Number,
  bathrooms: Number,
  propertyType: String,
  categoryIds: [String],
  coverImageId: String,
  images: [HouseImageSchema],
  amenities: [String],
  rating: Number,
  reviewCount: Number,
  isFeatured: Boolean,
  isPublished: Boolean,
  unavailable: [{ from: String, to: String, _id: false }]
}, { timestamps: true });

export const HouseModel = mongoose.models.House || mongoose.model("House", HouseSchema);

// --- CATEGORIES ---
const CategorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  slug: String,
  label: String,
  rentalCategory: String,
  icon: String,
}, { timestamps: true });

export const CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema);

// --- DESTINATIONS ---
const DestinationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  slug: String,
  name: String,
  governorate: String,
  imageUrl: String,
  tagline: String,
}, { timestamps: true });

export const DestinationModel = mongoose.models.Destination || mongoose.model("Destination", DestinationSchema);

// --- PROPERTIES (Admin/Owner) ---
const PropertySchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  type: String,
  area: String,
  bedrooms: Number,
  bathrooms: Number,
  surface: Number,
  summerPrice: Number,
  studentPrice: Number,
  verified: Boolean,
  status: String,
  amenities: [String],
  images: [String],
  description: String,
  ownerId: String,
  walkToBeach: String,
  nearUniversity: String,
}, { timestamps: true });

export const PropertyModel = mongoose.models.Property || mongoose.model("Property", PropertySchema);

// --- OWNERS ---
const OwnerSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String }, // Link to User._id or User.id
  name: String,
  phone: String,
  area: String,
  properties: Number,
  since: String,
}, { timestamps: true });

export const OwnerModel = mongoose.models.Owner || mongoose.model("Owner", OwnerSchema);

// --- HOUSING REQUESTS ---
const PropertyProposalSchema = new Schema({
  propertyId: { type: String, required: true },
  proposedPrice: { type: Number },
  checkIn: { type: String },
  checkOut: { type: String },
  adminMessage: { type: String },
  status: {
    type: String,
    enum: ["PENDING_CLIENT", "ACCEPTED", "REJECTED", "EXPIRED"],
    default: "PENDING_CLIENT",
  },
  createdAt: { type: Date, default: Date.now },
});

const HousingRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String }, // Links to user id if authenticated
  customer: {
    fullName: { type: String },
    phone: { type: String },
  },
  rentalCategory: { 
    type: String, 
    enum: ["summer", "student"],
    default: "summer",
  },
  destination: { type: String },
  area: { type: String },
  flexibleLocation: { type: Boolean, default: false },
  propertyType: { type: String },
  checkIn: { type: String },
  checkOut: { type: String },
  guests: { type: Number },
  bedrooms: { type: String },
  budget: { type: Schema.Types.Mixed }, // Number for new requests, String for legacy seeds
  budgetPeriod: { type: String, enum: ["stay", "total", "week", "month", "night"] },
  amenities: { type: [String], default: [] },
  // Student specific
  university: { type: String },
  genderPreference: { type: String },
  // Workflow & Status
  status: {
    type: String,
    enum: [
      "PENDING",
      "UNDER_REVIEW",
      "PROPERTY_PROPOSED",
      "CLIENT_CONFIRMATION",
      "CONFIRMED",
      "COMPLETED",
      "REJECTED",
      "CANCELLED",
    ],
    default: "PENDING",
  },
  adminNotes: { type: String },
  proposedProperties: { type: [PropertyProposalSchema], default: [] },
  selectedProperty: { type: String },
  // Legacy / Prototype Compatibility Fields
  kind: { type: String },
  people: { type: Number },
  period: { type: String },
  preferences: { type: [String], default: [] },
  stage: { type: String },
  submitted: { type: String },
  note: { type: String },
}, { timestamps: true });

export const HousingRequestModel = mongoose.models.HousingRequest || mongoose.model("HousingRequest", HousingRequestSchema);

// --- DEALS ---
const DealSchema = new Schema({
  id: { type: String, required: true, unique: true },
  request: String,
  property: String,
  ownerPrice: Number,
  customerOffer: Number,
  closed: String,
}, { timestamps: true });

export const DealModel = mongoose.models.Deal || mongoose.model("Deal", DealSchema);

// --- NOTIFICATIONS ---
const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["NEW_REQUEST", "STATUS_CHANGE", "PROPOSAL_ACCEPTED", "PROPOSAL_REJECTED", "SYSTEM"],
    default: "NEW_REQUEST",
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  requestId: { type: String },
  recipientRole: { type: String, default: "ADMIN" },
  recipientId: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
