import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import { userRepository } from "@/server/repositories/UserRepository";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;

    const user = await userRepository.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Update status to REJECTED without modifying credentials (email, passwordHash, role stay intact)
    const updated = await userRepository.updateStatus(id, "REJECTED");

    return NextResponse.json({
      success: true,
      message: "Le statut du compte a été mis à jour à REJECTED.",
      user: {
        id: updated?.id || id,
        email: updated?.email,
        role: updated?.role,
        status: updated?.status,
      },
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("POST /api/admin/users/[id]/reject error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du rejet du compte." },
      { status: 500 }
    );
  }
}
