import { ReservationModel, CommissionSnapshotModel, FinancialLedgerModel, PropertyModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import { commissionPolicyService } from "../services/CommissionPolicyService";
import { financeLedgerService } from "../services/FinanceLedgerService";

export interface MigrationReport {
  dryRun: boolean;
  totalReservations: number;
  migratedSnapshots: number;
  migratedObligations: number;
  skippedExisting: number;
  unresolvedFlows: number;
  errors: string[];
}

export async function runFinanceBackfillMigration(options?: { dryRun?: boolean }): Promise<MigrationReport> {
  await connectToDatabase();
  const dryRun = options?.dryRun !== false; // Default to dryRun = true for safety

  const report: MigrationReport = {
    dryRun,
    totalReservations: 0,
    migratedSnapshots: 0,
    migratedObligations: 0,
    skippedExisting: 0,
    unresolvedFlows: 0,
    errors: [],
  };

  const reservations = await ReservationModel.find({ status: "CONFIRMED" }).lean().exec();
  report.totalReservations = reservations.length;

  for (const res of reservations) {
    try {
      const existingSnapshot = await CommissionSnapshotModel.findOne({ reservationId: res.id }).exec();
      if (existingSnapshot) {
        report.skippedExisting++;
        continue;
      }

      const propDoc = await PropertyModel.findOne({ id: res.propertyId }).lean().exec();
      const ownerId = res.ownerId || propDoc?.ownerId || "owner-unknown";
      const rentalBasis = res.pricing?.total || 0;

      // Determine collection flow: if legacy and unspecified, mark as UNRESOLVED
      const collectionFlow = "UNRESOLVED";
      report.unresolvedFlows++;

      if (!dryRun) {
        const snapshot = await commissionPolicyService.createSnapshotAtConfirmation({
          reservationId: res.id,
          propertyId: res.propertyId,
          ownerId,
          rentalBasis,
          collectionFlow,
          confirmedAt: res.createdAt || new Date(),
        });
        report.migratedSnapshots++;

        await financeLedgerService.postCommissionObligation(
          {
            id: res.id,
            propertyId: res.propertyId,
            ownerId,
            customerId: res.customerId,
          },
          snapshot
        );
        report.migratedObligations++;
      } else {
        report.migratedSnapshots++;
        report.migratedObligations++;
      }
    } catch (err: any) {
      report.errors.push(`Reservation ${res.id}: ${err?.message || "Unknown error"}`);
    }
  }

  return report;
}

