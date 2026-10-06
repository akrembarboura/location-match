import { PaymentModel, ReservationModel, PropertyModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export class PaymentRepository {
  async findByOwnerId(ownerId: string): Promise<any[]> {
    await connectToDatabase();
    const payments = await PaymentModel.find({ ownerId }).sort({ createdAt: -1 }).lean().exec();

    const propIds = Array.from(new Set(payments.map((p: any) => p.propertyId)));
    const properties = await PropertyModel.find({ id: { $in: propIds } }).select("id title city").lean().exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    return payments.map((p: any) => {
      const prop = propMap.get(p.propertyId);
      return {
        ...p,
        propertyTitle: prop?.title || "Logement",
        propertyCity: prop?.city || "Mahdia",
      };
    });
  }

  async findByReservationId(reservationId: string, ownerId: string): Promise<any[]> {
    await connectToDatabase();
    // Verify reservation belongs to owner first
    const res = await ReservationModel.findOne({ id: reservationId, ownerId }).lean().exec();
    if (!res) return [];

    return await PaymentModel.find({ reservationId }).sort({ createdAt: -1 }).lean().exec();
  }

  async syncReservationPaymentSummary(reservationId: string): Promise<void> {
    await connectToDatabase();
    const reservation = await ReservationModel.findOne({ id: reservationId }).exec();
    if (!reservation) return;

    const payments = await PaymentModel.find({
      reservationId,
      status: { $in: ["REPORTED", "VERIFIED", "CONFIRMED"] },
    }).lean().exec();

    const totalAmount = reservation.pricing?.total || 0;

    const verifiedPaid = payments
      .filter((p: any) => p.status === "VERIFIED" || p.status === "CONFIRMED")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const reportedPaid = payments
      .filter((p: any) => p.status === "REPORTED")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const safePaid = Math.min(totalAmount, verifiedPaid);
    const remaining = Math.max(0, totalAmount - (verifiedPaid + reportedPaid));

    let payStatus = "UNPAID";
    if (verifiedPaid >= totalAmount) payStatus = "PAID";
    else if (verifiedPaid > 0) payStatus = "PARTIALLY_PAID";
    else if (reportedPaid > 0) payStatus = "REPORTED";

    reservation.paymentSummary = {
      paidAmount: safePaid,
      reportedAmount: reportedPaid,
      remainingAmount: remaining,
      status: payStatus,
    };
    await reservation.save();

    // Sync authoritative paymentSummary to linked HousingRequestModel if applicable
    if (reservation.requestId) {
      const { HousingRequestModel } = await import("@/lib/models");
      await HousingRequestModel.updateOne(
        { id: reservation.requestId },
        {
          $set: {
            paymentSummary: {
              paidAmount: safePaid,
              reportedAmount: reportedPaid,
              remainingAmount: remaining,
              status: payStatus,
            },
          },
        }
      );
    }
  }

  async reportCashPayment(
    ownerId: string,
    reservationId: string,
    reportedAmountInput?: number
  ): Promise<{ success: boolean; message: string; payment?: any }> {
    await connectToDatabase();

    const reservation = await ReservationModel.findOne({ id: reservationId, ownerId }).exec();
    if (!reservation) {
      throw new Error("Réservation introuvable ou vous n'êtes pas le propriétaire de ce logement.");
    }

    const totalAmount = reservation.pricing?.total || 0;
    const remainingAmount = reservation.paymentSummary?.remainingAmount ?? totalAmount;

    const amountToReport = reportedAmountInput && reportedAmountInput > 0
      ? Math.min(reportedAmountInput, remainingAmount > 0 ? remainingAmount : totalAmount)
      : remainingAmount > 0 ? remainingAmount : totalAmount;

    if (amountToReport <= 0) {
      throw new Error("Le montant du paiement doit être supérieur à 0 DT.");
    }

    // Check if a payment record already exists for this reservation
    let payment = await PaymentModel.findOne({ reservationId, ownerId }).exec();

    if (payment) {
      if (payment.status === "REPORTED" || payment.status === "VERIFIED" || payment.status === "CONFIRMED") {
        throw new Error("Ce paiement a déjà été déclaré ou confirmé et ne peut pas être soumis à nouveau.");
      }
      payment.method = "CASH";
      payment.status = "REPORTED";
      payment.amount = amountToReport;
      payment.reportedAmount = amountToReport;
      payment.reportedBy = { userId: ownerId, role: "OWNER" };
      payment.reportedAt = new Date();
      payment.history = payment.history || [];
      payment.history.push({
        action: "CASH_REPORTED",
        actorId: ownerId,
        actorRole: "OWNER",
        timestamp: new Date(),
        note: `Paiement de ${amountToReport} DT déclaré reçu en espèces par le propriétaire.`,
      });
      await payment.save();
    } else {
      const payId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      payment = await PaymentModel.create({
        id: payId,
        reservationId,
        propertyId: reservation.propertyId,
        ownerId,
        customerId: reservation.customerId,
        amount: amountToReport,
        reportedAmount: amountToReport,
        currency: "TND",
        method: "CASH",
        status: "REPORTED",
        reportedBy: { userId: ownerId, role: "OWNER" },
        reportedAt: new Date(),
        history: [
          {
            action: "CASH_REPORTED",
            actorId: ownerId,
            actorRole: "OWNER",
            timestamp: new Date(),
            note: `Paiement de ${amountToReport} DT déclaré reçu en espèces par le propriétaire.`,
          },
        ],
      });
    }

    await this.syncReservationPaymentSummary(reservationId);

    return {
      success: true,
      message: "Le paiement en espèces a été déclaré reçu. En attente de vérification par LOC MAISON.",
      payment: payment.toObject(),
    };
  }

  async verifyPayment(
    adminId: string,
    paymentId: string
  ): Promise<{ success: boolean; message: string; payment?: any }> {
    await connectToDatabase();

    const payment = await PaymentModel.findOne({ id: paymentId }).exec();
    if (!payment) {
      throw new Error("Paiement introuvable.");
    }

    payment.status = "VERIFIED";
    payment.verifiedAmount = payment.amount;
    payment.verifiedBy = { userId: adminId, role: "ADMIN" };
    payment.verifiedAt = new Date();
    payment.history = payment.history || [];
    payment.history.push({
      action: "VERIFIED",
      actorId: adminId,
      actorRole: "ADMIN",
      timestamp: new Date(),
      note: "Paiement vérifié et confirmé par LOC MAISON.",
    });
    await payment.save();

    await this.syncReservationPaymentSummary(payment.reservationId);

    return {
      success: true,
      message: "Paiement vérifié avec succès par LOC MAISON.",
      payment: payment.toObject(),
    };
  }

  async rejectPayment(
    adminId: string,
    paymentId: string,
    reason: string
  ): Promise<{ success: boolean; message: string; payment?: any }> {
    await connectToDatabase();

    const payment = await PaymentModel.findOne({ id: paymentId }).exec();
    if (!payment) {
      throw new Error("Paiement introuvable.");
    }

    payment.status = "REJECTED";
    payment.rejectionReason = reason;
    payment.history = payment.history || [];
    payment.history.push({
      action: "REJECTED",
      actorId: adminId,
      actorRole: "ADMIN",
      timestamp: new Date(),
      note: `Paiement rejeté par LOC MAISON. Motif: ${reason}`,
    });
    await payment.save();

    await this.syncReservationPaymentSummary(payment.reservationId);

    return {
      success: true,
      message: "Paiement rejeté.",
      payment: payment.toObject(),
    };
  }

  async create(data: {
    id: string;
    reservationId: string;
    propertyId: string;
    ownerId: string;
    customerId?: string;
    amount: number;
    currency?: string;
    method?: string;
    status?: string;
    reference?: string;
    recordedBy?: string;
    paidAt?: Date;
  }): Promise<any> {
    await connectToDatabase();
    const payment = await PaymentModel.create({
      ...data,
      status: data.status || "REPORTED",
      reportedAmount: data.amount,
      history: [
        {
          action: "CREATED",
          actorId: data.recordedBy || "SYSTEM",
          actorRole: "SYSTEM",
          timestamp: new Date(),
          note: `Création initiale du paiement (${data.method || "CASH"}).`,
        },
      ],
    });

    await this.syncReservationPaymentSummary(data.reservationId);
    return payment;
  }
}

export const paymentRepository = new PaymentRepository();

