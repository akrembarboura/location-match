import { CommissionPolicyModel, CommissionSnapshotModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import crypto from "crypto";

export interface ResolvePolicyInput {
  reservationId?: string;
  propertyId?: string;
  ownerId?: string;
  rentalBasis: number;
  commissionBasis?: "FIRST_MONTH_RENT" | "FIRST_AGREED_PAYMENT" | "TOTAL_RENTAL_VALUE";
  rateOverride?: number;
  collectionFlow?: "OWNER_DIRECT" | "PLATFORM_COLLECTS" | "MIXED" | "UNRESOLVED";
  mixedAllocation?: { ownerAmount: number; platformAmount: number };
  status?: "PROPOSED" | "AGREED" | "REPORTED" | "VERIFIED" | "WAIVED";
  verifiedCommission?: number;
  waivedBy?: string;
  waivedReason?: string;
  confirmedAt?: Date;
}

export class CommissionPolicyService {
  /**
   * Maximum allowed commission rate (50%)
   */
  private static MAX_COMMISSION_RATE = 50;

  /**
   * Ensures default platform commission policy (10%) exists in database
   */
  async ensureDefaultPlatformPolicy(): Promise<any> {
    await connectToDatabase();
    let defaultPolicy = await CommissionPolicyModel.findOne({
      scope: "PLATFORM",
      isActive: true,
    })
      .sort({ effectiveFrom: -1 })
      .exec();

    if (!defaultPolicy) {
      defaultPolicy = await CommissionPolicyModel.create({
        id: `POL-PLATFORM-DEFAULT`,
        name: "Politique Standard LOC MAISON (10%)",
        scope: "PLATFORM",
        rate: 10,
        calculationMethod: "PERCENTAGE",
        currency: "TND",
        effectiveFrom: new Date("2026-01-01"),
        isActive: true,
        version: 1,
        notes: "Politique par défaut de la plateforme LOC MAISON.",
        createdBy: "SYSTEM",
      });
    }

    return defaultPolicy;
  }

  /**
   * Resolves applicable commission policy according to precedence:
   * 1. Reservation-specific agreement
   * 2. Property-specific agreement
   * 3. Owner-specific agreement
   * 4. Platform default policy
   */
  async resolvePolicy(input: {
    reservationId?: string;
    propertyId?: string;
    ownerId?: string;
    date?: Date;
  }): Promise<{ policy: any; source: "RESERVATION" | "PROPERTY" | "OWNER" | "PLATFORM" }> {
    await connectToDatabase();
    const effectiveDate = input.date || new Date();

    const dateFilter = {
      isActive: true,
      effectiveFrom: { $lte: effectiveDate },
      $or: [{ effectiveUntil: { $exists: false } }, { effectiveUntil: null }, { effectiveUntil: { $gte: effectiveDate } }],
    };

    // 1. Reservation agreement
    if (input.reservationId) {
      const resPolicy = await CommissionPolicyModel.findOne({
        scope: "RESERVATION",
        targetId: input.reservationId,
        ...dateFilter,
      }).exec();
      if (resPolicy) return { policy: resPolicy, source: "RESERVATION" };
    }

    // 2. Property agreement
    if (input.propertyId) {
      const propPolicy = await CommissionPolicyModel.findOne({
        scope: "PROPERTY",
        targetId: input.propertyId,
        ...dateFilter,
      }).exec();
      if (propPolicy) return { policy: propPolicy, source: "PROPERTY" };
    }

    // 3. Owner agreement
    if (input.ownerId) {
      const ownerPolicy = await CommissionPolicyModel.findOne({
        scope: "OWNER",
        targetId: input.ownerId,
        ...dateFilter,
      }).exec();
      if (ownerPolicy) return { policy: ownerPolicy, source: "OWNER" };
    }

    // 4. Platform default policy
    const defaultPolicy = await this.ensureDefaultPlatformPolicy();
    return { policy: defaultPolicy, source: "PLATFORM" };
  }

  /**
   * Decimal-safe commission calculation in TND millimes
   */
  calculateCommission(
    rentalBasis: number,
    rate: number,
    method = "PERCENTAGE",
    basis: "FIRST_MONTH_RENT" | "FIRST_AGREED_PAYMENT" | "TOTAL_RENTAL_VALUE" = "FIRST_MONTH_RENT"
  ): number {
    if (typeof rentalBasis !== "number" || isNaN(rentalBasis) || rentalBasis < 0) {
      throw new Error("Base locative invalide pour le calcul de commission.");
    }
    if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > CommissionPolicyService.MAX_COMMISSION_RATE) {
      throw new Error(`Taux de commission invalide (${rate}%). Doit être entre 0% et ${CommissionPolicyService.MAX_COMMISSION_RATE}%.`);
    }

    let rawAmount = 0;
    if (method === "PERCENTAGE") {
      rawAmount = (rentalBasis * rate) / 100;
    } else {
      rawAmount = rate;
    }

    // Round to 3 decimal places (millimes TND)
    return Math.round(rawAmount * 1000) / 1000;
  }

  /**
   * Idempotently creates or retrieves a historical commission snapshot at reservation confirmation
   */
  async createSnapshotAtConfirmation(input: ResolvePolicyInput & { reservationId: string }): Promise<any> {
    await connectToDatabase();

    // Check existing snapshot to ensure strict immutability & idempotency
    const existing = await CommissionSnapshotModel.findOne({
      reservationId: input.reservationId,
    }).exec();

    if (existing) {
      return existing;
    }

    const { policy, source } = await this.resolvePolicy({
      reservationId: input.reservationId,
      propertyId: input.propertyId,
      ownerId: input.ownerId,
      date: input.confirmedAt,
    });

    const applicableRate = typeof input.rateOverride === "number" ? input.rateOverride : policy.rate;
    const commissionBasis = input.commissionBasis || "FIRST_MONTH_RENT";
    const calculatedCommission = this.calculateCommission(
      input.rentalBasis,
      applicableRate,
      policy.calculationMethod,
      commissionBasis
    );

    const collectionFlow = input.collectionFlow || "OWNER_DIRECT";

    // Validate MIXED allocation if provided
    if (collectionFlow === "MIXED") {
      const alloc = input.mixedAllocation;
      if (!alloc || typeof alloc.ownerAmount !== "number" || typeof alloc.platformAmount !== "number") {
        throw new Error("L'allocation MIXTE nécessite explicitement les montants propriétaire et plateforme.");
      }
      const sum = Math.round((alloc.ownerAmount + alloc.platformAmount) * 1000) / 1000;
      if (Math.abs(sum - input.rentalBasis) > 0.01) {
        throw new Error(`La somme des allocations (${sum} TND) ne correspond pas au total du loyer (${input.rentalBasis} TND).`);
      }
    }

    const verifiedCommission = Math.round((input.verifiedCommission || 0) * 1000) / 1000;
    const remainingCommission = Math.max(0, Math.round((calculatedCommission - verifiedCommission) * 1000) / 1000);
    const snapshotId = `SNAP-${input.reservationId}`;

    const snapshot = await CommissionSnapshotModel.create({
      id: snapshotId,
      reservationId: input.reservationId,
      policyId: policy.id,
      policyVersion: policy.version || 1,
      scope: input.rateOverride !== undefined ? "RESERVATION" : source,
      rate: applicableRate,
      calculationMethod: policy.calculationMethod || "PERCENTAGE",
      commissionBasis,
      currency: policy.currency || "TND",
      rentalBasis: input.rentalBasis,
      calculatedCommission,
      collectionFlow,
      mixedAllocation: input.mixedAllocation || { ownerAmount: 0, platformAmount: 0 },
      status: input.status || (verifiedCommission >= calculatedCommission ? "VERIFIED" : "AGREED"),
      verifiedCommission,
      remainingCommission,
      waivedBy: input.waivedBy,
      waivedReason: input.waivedReason,
      confirmedAt: input.confirmedAt || new Date(),
      snapshotVersion: 1,
      notes: `Snapshot généré lors de la confirmation de réservation (${source}: ${applicableRate}%, base: ${commissionBasis}).`,
    });

    return snapshot;
  }

  /**
   * Formally creates or updates a commission policy with server-side rate validation
   */
  async savePolicy(data: {
    id?: string;
    name: string;
    scope: "PLATFORM" | "OWNER" | "PROPERTY" | "RESERVATION";
    targetId?: string;
    rate: number;
    calculationMethod?: "PERCENTAGE" | "FIXED_PER_RESERVATION" | "FIXED_PER_NIGHT";
    currency?: string;
    effectiveFrom?: Date | string;
    effectiveUntil?: Date | string;
    notes?: string;
    createdBy?: string;
  }): Promise<any> {
    await connectToDatabase();

    if (typeof data.rate !== "number" || isNaN(data.rate) || data.rate < 0 || data.rate > CommissionPolicyService.MAX_COMMISSION_RATE) {
      throw new Error(`Le taux de commission (${data.rate}%) doit être compris entre 0% et ${CommissionPolicyService.MAX_COMMISSION_RATE}%.`);
    }

    if (data.scope !== "PLATFORM" && !data.targetId) {
      throw new Error(`La portée ${data.scope} exige un identifiant cible (ownerId, propertyId ou reservationId).`);
    }

    const policyId = data.id || `POL-${data.scope}-${data.targetId || "DEF"}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const existing = await CommissionPolicyModel.findOne({ id: policyId }).exec();
    if (existing) {
      existing.name = data.name;
      existing.rate = data.rate;
      existing.calculationMethod = data.calculationMethod || existing.calculationMethod;
      existing.notes = data.notes;
      existing.version = (existing.version || 1) + 1;
      existing.updatedBy = data.createdBy || "ADMIN";
      await existing.save();
      return existing;
    }

    return await CommissionPolicyModel.create({
      id: policyId,
      name: data.name,
      scope: data.scope,
      targetId: data.targetId,
      rate: data.rate,
      calculationMethod: data.calculationMethod || "PERCENTAGE",
      currency: data.currency || "TND",
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveUntil: data.effectiveUntil ? new Date(data.effectiveUntil) : undefined,
      isActive: true,
      version: 1,
      notes: data.notes || "Création de la politique de commission.",
      createdBy: data.createdBy || "ADMIN",
    });
  }

  async getAllPolicies(): Promise<any[]> {
    await connectToDatabase();
    return await CommissionPolicyModel.find().sort({ effectiveFrom: -1 }).lean().exec();
  }
}

export const commissionPolicyService = new CommissionPolicyService();

