import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { commissionPolicyService } from "@/server/services/CommissionPolicyService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const policies = await commissionPolicyService.getAllPolicies();
    return NextResponse.json({ success: true, policies });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des politiques." },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();

    const policy = await commissionPolicyService.savePolicy({
      ...body,
      createdBy: admin.id,
    });

    return NextResponse.json({
      success: true,
      message: "Politique de commission configurée avec succès.",
      policy,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Impossible de sauvegarder la politique de commission." },
      { status: error.statusCode || 400 }
    );
  }
}

