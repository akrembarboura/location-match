import { FinancialLedgerModel, CommissionSnapshotModel, ReservationModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import crypto from "crypto";

export class FinanceLedgerService {
  /**
   * Idempotently posts a commission obligation to the ledger upon reservation confirmation
   */
  async postCommissionObligation(reservation: {
    id: string;
    propertyId: string;
    ownerId: string;
    customerId?: string;
  }, snapshot: {
    calculatedCommission: number;
    collectionFlow: string;
    currency?: string;
  }): Promise<any> {
    await connectToDatabase();

    const existingObligation = await FinancialLedgerModel.findOne({
      reservationId: reservation.id,
      type: "COMMISSION_OBLIGATION",
    }).exec();

    if (existingObligation) {
      return existingObligation;
    }

    const txId = `TX-OBL-${reservation.id}`;

    return await FinancialLedgerModel.create({
      id: txId,
      reservationId: reservation.id,
      propertyId: reservation.propertyId,
      ownerId: reservation.ownerId,
      customerId: reservation.customerId,
      type: "COMMISSION_OBLIGATION",
      direction: "CREDIT",
      amount: snapshot.calculatedCommission,
      currency: snapshot.currency || "TND",
      collectionFlow: snapshot.collectionFlow || "OWNER_DIRECT",
      paymentMethod: "CASH",
      status: "VERIFIED",
      reference: `OBLIGATION-${reservation.id}`,
      notes: `Obligation de commission générée lors de la confirmation (${snapshot.calculatedCommission} TND).`,
    });
  }

  /**
   * Records a payment transaction in the financial ledger (Rental Collection or Commission Remittance)
   */
  async recordPaymentTransaction(data: {
    id?: string;
    reservationId: string;
    propertyId: string;
    ownerId: string;
    customerId?: string;
    type: "RENTAL_COLLECTION" | "COMMISSION_REMITTANCE" | "OWNER_PAYABLE_MOVEMENT";
    direction: "CREDIT" | "DEBIT";
    amount: number;
    currency?: string;
    collectionFlow?: string;
    paymentMethod?: string;
    status?: "REPORTED" | "VERIFIED";
    reference?: string;
    reportedBy?: { userId: string; role: string };
    notes?: string;
  }): Promise<any> {
    await connectToDatabase();

    if (typeof data.amount !== "number" || isNaN(data.amount) || data.amount <= 0) {
      throw new Error("Le montant de la transaction doit être un nombre positif.");
    }

    const txId = data.id || `TX-PAY-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    // Prevent duplicate payment posting with same reference
    if (data.reference) {
      const existingRef = await FinancialLedgerModel.findOne({
        reservationId: data.reservationId,
        reference: data.reference,
        status: { $in: ["REPORTED", "VERIFIED"] },
      }).exec();

      if (existingRef) {
        return existingRef;
      }
    }

    return await FinancialLedgerModel.create({
      id: txId,
      reservationId: data.reservationId,
      propertyId: data.propertyId,
      ownerId: data.ownerId,
      customerId: data.customerId,
      type: data.type,
      direction: data.direction,
      amount: Math.round(data.amount * 1000) / 1000,
      currency: data.currency || "TND",
      collectionFlow: data.collectionFlow || "OWNER_DIRECT",
      paymentMethod: data.paymentMethod || "CASH",
      status: data.status || "REPORTED",
      reference: data.reference,
      reportedBy: data.reportedBy,
      reportedAt: new Date(),
      notes: data.notes || "Transaction enregistrée.",
    });
  }

  /**
   * Verifies a reported payment transaction (enforces that only verified receipts count as cash)
   */
  async verifyTransaction(adminId: string, transactionId: string): Promise<any> {
    await connectToDatabase();

    const tx = await FinancialLedgerModel.findOne({ id: transactionId }).exec();
    if (!tx) {
      throw new Error("Transaction introuvable.");
    }

    if (tx.status === "VERIFIED") {
      return tx;
    }

    tx.status = "VERIFIED";
    tx.verifiedBy = { userId: adminId, role: "ADMIN" };
    tx.verifiedAt = new Date();
    await tx.save();

    return tx;
  }

  /**
   * Rejects a reported transaction
   */
  async rejectTransaction(adminId: string, transactionId: string, reason: string): Promise<any> {
    await connectToDatabase();

    const tx = await FinancialLedgerModel.findOne({ id: transactionId }).exec();
    if (!tx) {
      throw new Error("Transaction introuvable.");
    }

    tx.status = "REJECTED";
    tx.verifiedBy = { userId: adminId, role: "ADMIN" };
    tx.verifiedAt = new Date();
    tx.notes = `Transaction rejetée: ${reason}`;
    await tx.save();

    return tx;
  }

  /**
   * Reverses a verified transaction safely without erasing historical audit trail
   */
  async reverseTransaction(adminId: string, transactionId: string, reason: string): Promise<any> {
    await connectToDatabase();

    const originalTx = await FinancialLedgerModel.findOne({ id: transactionId }).exec();
    if (!originalTx) {
      throw new Error("Transaction originale introuvable.");
    }

    if (originalTx.status !== "VERIFIED") {
      throw new Error("Seules les transactions vérifiées peuvent être annulées.");
    }

    const existingReversal = await FinancialLedgerModel.findOne({
      originalTransactionId: transactionId,
      type: "REVERSAL",
    }).exec();

    if (existingReversal) {
      throw new Error("Cette transaction a déjà été annulée.");
    }

    const reversalDirection = originalTx.direction === "CREDIT" ? "DEBIT" : "CREDIT";
    const reversalId = `REV-${originalTx.id}`;

    const reversalTx = await FinancialLedgerModel.create({
      id: reversalId,
      reservationId: originalTx.reservationId,
      propertyId: originalTx.propertyId,
      ownerId: originalTx.ownerId,
      customerId: originalTx.customerId,
      type: "REVERSAL",
      direction: reversalDirection,
      amount: originalTx.amount,
      currency: originalTx.currency,
      collectionFlow: originalTx.collectionFlow,
      paymentMethod: originalTx.paymentMethod,
      status: "VERIFIED",
      originalTransactionId: originalTx.id,
      reversedBy: { userId: adminId, role: "ADMIN" },
      reversedAt: new Date(),
      reversalReason: reason,
      notes: `Annulation de la transaction ${originalTx.id}. Motif: ${reason}`,
    });

    originalTx.status = "REVERSED";
    await originalTx.save();

    return reversalTx;
  }

  /**
   * Calculates comprehensive financial overview & period metrics directly from ledger records
   */
  async getFinancialOverview(filters?: { fromDate?: Date; toDate?: Date; ownerId?: string }): Promise<any> {
    await connectToDatabase();

    const query: any = {};
    if (filters?.fromDate || filters?.toDate) {
      query.createdAt = {};
      if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
      if (filters.toDate) query.createdAt.$lte = filters.toDate;
    }
    if (filters?.ownerId) {
      query.ownerId = filters.ownerId;
    }

    const allTx = await FinancialLedgerModel.find(query).lean().exec();

    let commissionEarned = 0;
    let commissionCollected = 0;
    let commissionReported = 0;
    let platformHeldRentalFunds = 0;
    let ownerPayable = 0;

    for (const tx of allTx) {
      if (tx.type === "COMMISSION_OBLIGATION" && tx.status === "VERIFIED") {
        commissionEarned += tx.amount;
      }
      if (tx.type === "COMMISSION_REMITTANCE") {
        if (tx.status === "VERIFIED") {
          commissionCollected += tx.direction === "CREDIT" ? tx.amount : -tx.amount;
        } else if (tx.status === "REPORTED") {
          commissionReported += tx.amount;
        }
      }
      if (tx.type === "RENTAL_COLLECTION" && tx.status === "VERIFIED" && tx.collectionFlow === "PLATFORM_COLLECTS") {
        platformHeldRentalFunds += tx.direction === "CREDIT" ? tx.amount : -tx.amount;
      }
      if (tx.type === "REVERSAL" && tx.status === "VERIFIED") {
        // Handled via net direction adjustment or status change
      }
    }

    // Outstanding commission = Earned - Net Collected
    const commissionOutstanding = Math.max(0, commissionEarned - commissionCollected);

    // Calculate owner payable for PLATFORM_COLLECTS reservations
    const platformCollectSnapshots = await CommissionSnapshotModel.find({
      collectionFlow: "PLATFORM_COLLECTS",
    }).lean().exec();

    let platformTotalCommissionObligation = 0;
    for (const s of platformCollectSnapshots) {
      platformTotalCommissionObligation += s.calculatedCommission;
    }
    ownerPayable = Math.max(0, platformHeldRentalFunds - platformTotalCommissionObligation);

    // Count reservations with UNRESOLVED financial flow configuration
    const unresolvedCount = await CommissionSnapshotModel.countDocuments({
      collectionFlow: "UNRESOLVED",
    });

    return {
      commissionEarned: Math.round(commissionEarned * 1000) / 1000,
      commissionCollected: Math.round(commissionCollected * 1000) / 1000,
      commissionReported: Math.round(commissionReported * 1000) / 1000,
      commissionOutstanding: Math.round(commissionOutstanding * 1000) / 1000,
      platformHeldRentalFunds: Math.round(platformHeldRentalFunds * 1000) / 1000,
      ownerPayable: Math.round(ownerPayable * 1000) / 1000,
      unresolvedCount,
    };
  }
}

export const financeLedgerService = new FinanceLedgerService();

