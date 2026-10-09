import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { FinancialLedgerModel, PropertyModel, UserModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const reservationId = searchParams.get("reservationId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type && type !== "ALL") query.type = type;
    if (status && status !== "ALL") query.status = status;
    if (reservationId) query.reservationId = reservationId;

    const [transactions, total] = await Promise.all([
      FinancialLedgerModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      FinancialLedgerModel.countDocuments(query),
    ]);

    const propIds = Array.from(new Set(transactions.map((t: any) => t.propertyId).filter(Boolean)));
    const properties = await PropertyModel.find({ id: { $in: propIds } }).select("id title city").lean().exec();
    const propMap = new Map(properties.map((p: any) => [p.id, p]));

    const ownerIds = Array.from(new Set(transactions.map((t: any) => t.ownerId).filter(Boolean)));
    const owners = await UserModel.find({ id: { $in: ownerIds } }).select("id firstName lastName phone").lean().exec();
    const ownerMap = new Map(owners.map((o: any) => [o.id, o]));

    const items = transactions.map((t: any) => {
      const prop = propMap.get(t.propertyId);
      const owner = ownerMap.get(t.ownerId);
      return {
        ...t,
        propertyTitle: prop?.title || "Logement",
        propertyCity: prop?.city || "Mahdia",
        ownerName: owner ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim() : "Propriétaire",
      };
    });

    return NextResponse.json({
      success: true,
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des transactions." },
      { status: error.statusCode || 500 }
    );
  }
}

