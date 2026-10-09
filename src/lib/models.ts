import mongoose, { Schema, Document } from "mongoose";

export const ROLE_ENUM = ["CUSTOMER", "OWNER", "ADMIN", "SUPER_ADMIN"] as const;
export type Role = typeof ROLE_ENUM[number];

export const USER_STATUSES = ["ACTIVE", "PENDING", "REJECTED", "SUSPENDED", "DISABLED"] as const;
export type UserStatus = typeof USER_STATUSES[number];

const UserSchema = new Schema({
  id: { type: String, unique: true }, // We'll keep id for consistency or just use _id
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLE_ENUM, default: "CUSTOMER" },
  status: { type: String, enum: USER_STATUSES, default: "ACTIVE", index: true },
  firstName: String,
  lastName: String,
  phone: String,
  avatar: String,
  resetPasswordToken: { type: String, index: true },
  resetPasswordExpires: { type: Date },
  verificationStatus: {
    type: String,
    enum: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
    default: "UNVERIFIED",
    index: true,
  },
  verificationType: {
    type: String,
    enum: ["CIN", "STUDENT_CARD", "PROPERTY_DEED"],
  },
  documentUrl: String,
  verificationNote: String,
  verifiedAt: Date,
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

// --- PROPERTIES (Admin/Owner/Public unified) ---
export const PROPERTY_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

const PropertyImageSchema = new Schema({
  id: { type: String },
  url: { type: String, required: true },
  publicId: { type: String },
  alt: { type: String },
  sortOrder: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  width: { type: Number },
  height: { type: Number },
}, { _id: false });

const PropertySchema = new Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, sparse: true },
  ownerId: { type: String, index: true },
  title: { type: String, required: true },
  description: { type: String },
  rentalCategory: { 
    type: String, 
    enum: ["summer", "student"], 
    default: "summer",
    index: true 
  },
  rentalCategories: {
    type: [String],
    default: ["summer"],
  },
  propertyType: { type: String, default: "Appartement" },
  type: { type: String }, // Legacy view compatibility
  features: { type: [String], default: [] },
  categoryIds: { type: [String], default: [] },

  // Location
  location: {
    country: { type: String, default: "Tunisie" },
    governorate: { type: String, default: "Mahdia" },
    city: { type: String, default: "Mahdia" },
    area: { type: String },
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  city: { type: String, default: "Mahdia", index: true },
  governorate: { type: String, default: "Mahdia" },
  area: { type: String },

  // Pricing
  pricing: {
    price: { type: Number },
    pricePeriod: { type: String, enum: ["night", "week", "month"], default: "week" },
    currency: { type: String, default: "TND" },
  },
  summerPrice: { type: Number },
  studentPrice: { type: Number },
  pricePerNight: { type: Number },
  currency: { type: String, default: "TND" },

  // Capacity
  capacity: {
    guests: { type: Number, default: 1 },
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    surface: { type: Number },
  },
  guests: { type: Number, default: 1 },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  surface: { type: Number },

  // Amenities & Features
  amenities: { type: [String], default: [] },
  walkToBeach: { type: String },
  nearUniversity: { type: String },

  // Images
  images: { type: [Schema.Types.Mixed], default: [] },
  coverImageId: { type: String },

  // Availability
  availability: {
    availableFrom: { type: String },
    availableTo: { type: String },
  },
  unavailable: [{ from: String, to: String, _id: false }],
  availabilityStatus: {
    type: String,
    enum: ["AVAILABLE", "RESERVED"],
    default: "AVAILABLE",
    index: true,
  },
  reservation: {
    type: new Schema({
      from: { type: Date },
      to: { type: Date },
      updatedAt: { type: Date },
      updatedBy: { type: String },
    }, { _id: false }),
    default: null,
  },

  // Moderation & Status
  status: {
    type: String,
    default: "DRAFT",
    index: true,
  },
  verified: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number },
  reviewCount: { type: Number, default: 0 },

  // Moderation details
  moderation: {
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
    rejectionReason: { type: String },
  },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  rejectionReason: { type: String },
}, { timestamps: true });

PropertySchema.index({ status: 1, city: 1, rentalCategory: 1 });
PropertySchema.index({ ownerId: 1, createdAt: -1 });
PropertySchema.index({ availabilityStatus: 1, "reservation.from": 1, "reservation.to": 1 });

export const PropertyModel = mongoose.models.Property || mongoose.model("Property", PropertySchema);

// --- PROPERTY MODERATION EVENTS ---
const PropertyModerationEventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  propertyId: { type: String, required: true, index: true },
  adminId: { type: String, required: true },
  action: { 
    type: String, 
    enum: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ARCHIVED", "RESERVED", "RELEASED"], 
    required: true 
  },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  reason: { type: String },
}, { timestamps: true });

export const PropertyModerationEventModel =
  mongoose.models.PropertyModerationEvent ||
  mongoose.model("PropertyModerationEvent", PropertyModerationEventSchema);

// --- OWNERS ---
const OwnerSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String }, // Link to User._id or User.id
  name: String,
  phone: String,
  area: String,
  properties: Number,
  since: String,
  isVerified: { type: Boolean, default: false },
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
  customerId: { type: String, index: true },
  customer: { type: Schema.Types.Mixed },
  phone: { type: String },
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
  propertyId: { type: String, index: true },
  message: { type: String },
  paymentSummary: {
    type: Schema.Types.Mixed,
  },
  contactAccessOverride: {
    enabled: { type: Boolean, default: false },
    grantedBy: { type: String },
    grantedAt: { type: Date },
    reason: { type: String },
  },
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

// --- RESERVATIONS ---
const ReservationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    requestId: { type: String, index: true },
    propertyId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    guests: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "CONFIRMED",
      index: true,
    },
    pricing: {
      pricePerNight: { type: Number, default: 0 },
      totalNights: { type: Number, default: 1 },
      subtotal: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      currency: { type: String, default: "TND" },
      unitPrice: { type: Number },
      pricePeriod: { type: String, enum: ["night", "week", "month"] },
      quantity: { type: Number },
    },
    paymentSummary: {
      paidAmount: { type: Number, default: 0 },
      reportedAmount: { type: Number, default: 0 },
      remainingAmount: { type: Number, default: 0 },
      paidMonths: { type: [String], default: [] },
      status: {
        type: String,
        enum: ["UNPAID", "REPORTED", "PARTIALLY_PAID", "PAID", "REFUNDED"],
        default: "UNPAID",
        index: true,
      },
    },
    contactAccessOverride: {
      enabled: { type: Boolean, default: false },
      grantedBy: { type: String },
      grantedAt: { type: Date },
      reason: { type: String },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ReservationModel =
  mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);

const AuditLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    targetType: { type: String, default: "RESERVATION" },
    targetId: { type: String, required: true, index: true },
    reason: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "D17", "ONLINE", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PENDING", "REPORTED", "VERIFIED", "REJECTED", "REFUNDED", "CONFIRMED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const PaymentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    reservationId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    amount: { type: Number, required: true },
    reportedAmount: { type: Number, default: 0 },
    verifiedAmount: { type: Number, default: 0 },
    currency: { type: String, default: "TND" },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "CASH",
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "PENDING",
      index: true,
    },
    reportedBy: {
      userId: { type: String },
      role: { type: String },
    },
    reportedAt: { type: Date },
    verifiedBy: {
      userId: { type: String },
      role: { type: String },
    },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    reference: { type: String },
    history: [
      {
        action: { type: String },
        actorId: { type: String },
        actorRole: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
        _id: false,
      },
    ],
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: String, default: "LOC MAISON" },
  },
  { timestamps: true }
);

export const PaymentModel =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);


// --- NOTIFICATIONS ---
const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: [
      "NEW_REQUEST",
      "STATUS_CHANGE",
      "PROPOSAL_ACCEPTED",
      "PROPOSAL_REJECTED",
      "PROPERTY_SUBMITTED",
      "PROPERTY_APPROVED",
      "PROPERTY_REJECTED",
      "SYSTEM",
    ],
    default: "NEW_REQUEST",
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  requestId: { type: String },
  propertyId: { type: String },
  recipientRole: { type: String, default: "ADMIN" },
  recipientId: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

// --- ANALYTICS EVENTS ---
export const ANALYTICS_EVENT_NAMES = [
  "page_viewed",
  "search_performed",
  "property_viewed",
  "request_started",
  "request_submitted",
  "owner_cta_clicked",
  "owner_signup_started",
  "owner_signup_completed",
  "property_created",
  "property_submitted",
  "property_approved",
  "property_rejected",
  "proposal_created",
  "proposal_accepted",
  "proposal_rejected",
  "reservation_confirmed",
  "reservation_released",
  "property_favorited",
  "property_unfavorited",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const AnalyticsEventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    eventName: {
      type: String,
      required: true,
      enum: ANALYTICS_EVENT_NAMES,
      index: true,
    },
    propertyId: { type: String, index: true, sparse: true },
    rentalCategory: { type: String },
    propertyType: { type: String },
    city: { type: String },
    anonymousId: { type: String, index: true },
    sessionId: { type: String, index: true },
    userId: { type: String, sparse: true },
    actorType: {
      type: String,
      enum: ["ANONYMOUS", "CUSTOMER", "OWNER", "ADMIN"],
      default: "ANONYMOUS",
    },
    properties: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

AnalyticsEventSchema.index({ propertyId: 1, eventName: 1, occurredAt: -1 });
AnalyticsEventSchema.index({ eventName: 1, occurredAt: -1 });
AnalyticsEventSchema.index({ city: 1, eventName: 1, occurredAt: -1 });
// 90 days retention for raw behavioral analytics; does not touch business records
AnalyticsEventSchema.index({ occurredAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AnalyticsEventModel =
  mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", AnalyticsEventSchema);

// --- FINANCE & COMMISSION ENGINE MODELS ---
export const COLLECTION_FLOW_ENUM = ["OWNER_DIRECT", "PLATFORM_COLLECTS", "MIXED", "UNRESOLVED"] as const;
export type CollectionFlow = (typeof COLLECTION_FLOW_ENUM)[number];

export const POLICY_SCOPE_ENUM = ["PLATFORM", "OWNER", "PROPERTY", "RESERVATION"] as const;
export type PolicyScope = (typeof POLICY_SCOPE_ENUM)[number];

export const TRANSACTION_TYPE_ENUM = [
  "COMMISSION_OBLIGATION",
  "RENTAL_COLLECTION",
  "COMMISSION_REMITTANCE",
  "OWNER_PAYABLE_MOVEMENT",
  "REVERSAL",
  "ADJUSTMENT",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPE_ENUM)[number];

const CommissionPolicySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    scope: { type: String, enum: POLICY_SCOPE_ENUM, required: true, index: true },
    targetId: { type: String, index: true, sparse: true }, // ownerId, propertyId, or reservationId
    rate: { type: Number, required: true }, // e.g. 10 for 10%
    calculationMethod: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_PER_RESERVATION", "FIXED_PER_NIGHT"],
      default: "PERCENTAGE",
    },
    currency: { type: String, default: "TND" },
    effectiveFrom: { type: Date, required: true, default: Date.now, index: true },
    effectiveUntil: { type: Date, index: true },
    isActive: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
    notes: { type: String },
    createdBy: { type: String, default: "ADMIN" },
    updatedBy: { type: String, default: "ADMIN" },
  },
  { timestamps: true }
);

CommissionPolicySchema.index({ scope: 1, targetId: 1, isActive: 1, effectiveFrom: -1 });

export const CommissionPolicyModel =
  mongoose.models.CommissionPolicy || mongoose.model("CommissionPolicy", CommissionPolicySchema);

const CommissionSnapshotSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    reservationId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String },
    policyVersion: { type: Number, default: 1 },
    scope: { type: String, enum: POLICY_SCOPE_ENUM, default: "PLATFORM" },
    rate: { type: Number, required: true },
    calculationMethod: { type: String, default: "PERCENTAGE" },
    currency: { type: String, default: "TND" },
    rentalBasis: { type: Number, required: true },
    calculatedCommission: { type: Number, required: true },
    collectionFlow: {
      type: String,
      enum: COLLECTION_FLOW_ENUM,
      default: "OWNER_DIRECT",
      index: true,
    },
    mixedAllocation: {
      ownerAmount: { type: Number, default: 0 },
      platformAmount: { type: Number, default: 0 },
    },
    confirmedAt: { type: Date, default: Date.now, index: true },
    snapshotVersion: { type: Number, default: 1 },
    notes: { type: String },
  },
  { timestamps: true }
);

export const CommissionSnapshotModel =
  mongoose.models.CommissionSnapshot || mongoose.model("CommissionSnapshot", CommissionSnapshotSchema);

const FinancialLedgerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    reservationId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    type: { type: String, enum: TRANSACTION_TYPE_ENUM, required: true, index: true },
    direction: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "TND" },
    collectionFlow: { type: String, enum: COLLECTION_FLOW_ENUM, default: "OWNER_DIRECT" },
    paymentMethod: { type: String, default: "CASH" },
    status: {
      type: String,
      enum: ["REPORTED", "VERIFIED", "REJECTED", "REVERSED"],
      default: "VERIFIED",
      index: true,
    },
    reference: { type: String },
    reportedBy: {
      userId: { type: String },
      role: { type: String },
    },
    reportedAt: { type: Date },
    verifiedBy: {
      userId: { type: String },
      role: { type: String },
    },
    verifiedAt: { type: Date },
    reversedBy: {
      userId: { type: String },
      role: { type: String },
    },
    reversedAt: { type: Date },
    reversalReason: { type: String },
    originalTransactionId: { type: String, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

FinancialLedgerSchema.index({ reservationId: 1, type: 1, status: 1 });
FinancialLedgerSchema.index({ ownerId: 1, type: 1, status: 1 });

export const FinancialLedgerModel =
  mongoose.models.FinancialLedger || mongoose.model("FinancialLedger", FinancialLedgerSchema);


