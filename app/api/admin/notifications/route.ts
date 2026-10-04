import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/server/services/NotificationService";
import { requireRole } from "@/server/utils/auth-guards";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;

    const notifications = await notificationService.getAdminNotifications(limit);
    const unreadCount = await notificationService.getUnreadCount("ADMIN");

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await notificationService.markAllAsRead("ADMIN");
    return NextResponse.json({ success: true, message: "Toutes les notifications ont été marquées comme lues." });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("PATCH /api/admin/notifications error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
