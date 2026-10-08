export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/utils/auth-guards";
import connectToDatabase from "@/lib/mongoose";
import {
  NotificationModel,
  PropertyModerationEventModel,
  AuditLogModel,
  HousingRequestModel,
} from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const type = req.nextUrl.searchParams.get("type") || "all";
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10)));

    const [notifications, moderationEvents, auditLogs, recentRequests] = await Promise.all([
      NotificationModel.find({})
        .select("id title message type read createdAt")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      PropertyModerationEventModel.find({})
        .select("id propertyId action previousStatus newStatus reason createdAt")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      AuditLogModel.find({})
        .select("id action actorRole actorId targetType targetId reason occurredAt")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      HousingRequestModel.find({})
        .select("id destination area status createdAt")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

    const formattedNotifications = notifications.map((n: any) => ({
      id: n.id || String(n._id),
      category: "NOTIFICATION",
      title: n.title || "Notification Système",
      message: n.message || "",
      timestamp: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      displayDate: n.createdAt ? new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
      type: n.type || "SYSTEM",
      read: Boolean(n.read),
    }));

    const formattedModeration = moderationEvents.map((m: any) => ({
      id: m.id || String(m._id),
      category: "MODERATION",
      title: `Modération Annonce #${m.propertyId}`,
      message: `Action: ${m.action} — Ancien statut: ${m.previousStatus || "N/A"} → Nouveau statut: ${m.newStatus}${m.reason ? ` (${m.reason})` : ""}`,
      timestamp: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      displayDate: m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
      type: m.action || "MODERATION",
      read: true,
    }));

    const formattedAuditLogs = auditLogs.map((a: any) => ({
      id: a.id || String(a._id),
      category: "AUDIT",
      title: `Audit: ${a.action}`,
      message: `Acteur: ${a.actorRole} (${a.actorId}) — Cible: ${a.targetType} ${a.targetId}${a.reason ? ` — ${a.reason}` : ""}`,
      timestamp: a.occurredAt ? new Date(a.occurredAt).toISOString() : new Date().toISOString(),
      displayDate: a.occurredAt ? new Date(a.occurredAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
      type: a.action,
      read: true,
    }));

    const formattedRequests = recentRequests.map((r: any) => ({
      id: `req-act-${r.id}`,
      category: "REQUEST",
      title: `Demande de logement #${r.id}`,
      message: `Nouvelle demande pour ${r.destination || "Mahdia"} — Statut: ${r.status}`,
      timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      displayDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
      type: "NEW_REQUEST",
      read: true,
    }));

    let allActivities = [
      ...formattedNotifications,
      ...formattedModeration,
      ...formattedAuditLogs,
      ...formattedRequests,
    ];

    // Filter by type
    if (type === "notifications") {
      allActivities = allActivities.filter((a) => a.category === "NOTIFICATION");
    } else if (type === "moderation") {
      allActivities = allActivities.filter((a) => a.category === "MODERATION");
    } else if (type === "audit") {
      allActivities = allActivities.filter((a) => a.category === "AUDIT");
    } else if (type === "requests") {
      allActivities = allActivities.filter((a) => a.category === "REQUEST");
    }

    // Sort descending by timestamp
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = allActivities.length;
    const paginatedActivities = allActivities.slice((page - 1) * limit, page * limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    if (error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }
    console.error("GET /api/admin/activities error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
