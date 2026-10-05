import { PaymentModel, ReservationModel, PropertyModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export class PaymentRepository {
  async findByOwnerId(ownerId: string): Promise<any[]> {
    await connectToDatabase();
    const payments = await PaymentModel.find({ ownerId }).sort({ paidAt: -1 }).lean().exec();

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

    return await PaymentModel.find({ reservationId }).sort({ paidAt: -1 }).lean().exec();
  }

  async create(data: {
    id: string;
    reservationId: string;
    propertyId: string;
    ownerId: string;
    amount: number;
    currency?: string;
    method?: string;
    status?: string;
    reference?: string;
    recordedBy?: string;
    paidAt?: Date;
  }): Promise<any> {
    await connectToDatabase();
    const payment = await PaymentModel.create(data);

    // Recalculate reservation payment summary
    const allPayments = await PaymentModel.find({ reservationId: data.reservationId, status: "CONFIRMED" }).lean().exec();
    const totalPaid = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const reservation = await ReservationModel.findOne({ id: data.reservationId }).exec();
    if (reservation) {
      const totalAmount = reservation.pricing?.total || 0;

      // Enforce: paidAmount cannot exceed total unless refund/overpayment
      const safePaid = Math.min(totalAmount, totalPaid);
      const remaining = Math.max(0, totalAmount - safePaid);

      let payStatus = "UNPAID";
      if (safePaid >= totalAmount) payStatus = "PAID";
      else if (safePaid > 0) payStatus = "PARTIALLY_PAID";

      reservation.paymentSummary = {
        paidAmount: safePaid,
        remainingAmount: remaining,
        status: payStatus,
      };
      await reservation.save();
    }

    return payment;
  }
}

export const paymentRepository = new PaymentRepository();
