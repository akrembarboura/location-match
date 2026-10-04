import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/server/services/NotificationService";
import { requireRole } from "@/server/utils/auth-guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;

    const updated = await notificationService.markAsRead(id);
    if (!updated) {
      return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("PATCH /api/admin/notifications/[id]/read error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
