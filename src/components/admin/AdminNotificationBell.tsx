"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Loader2, Inbox } from "lucide-react";
import Link from "next/link";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  requestId?: string;
  propertyId?: string;
  read: boolean;
  createdAt: string;
}

export function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore network errors in background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Close on click outside
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-surface"
        aria-label="Notifications administrateur"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="h-3 w-3" /> Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center p-6 text-muted-foreground text-xs">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Inbox className="h-6 w-6 mb-1 text-muted-foreground/60" />
                <p className="text-xs">Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const dateStr = n.createdAt
                  ? new Date(n.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";

                return (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition-colors hover:bg-surface/60 ${
                      !n.read ? "bg-primary-soft/30 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground">{n.title}</p>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="shrink-0 text-[10px] text-primary hover:underline"
                        >
                          Marquer lu
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-foreground/80">{n.message}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{dateStr}</span>
                      {n.requestId && (
                        <Link
                          href="/admin/requests"
                          onClick={() => {
                            if (!n.read) handleMarkAsRead(n.id);
                            setOpen(false);
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          Voir la demande →
                        </Link>
                      )}
                      {n.propertyId && (
                        <Link
                          href={`/admin/properties/${n.propertyId}`}
                          onClick={() => {
                            if (!n.read) handleMarkAsRead(n.id);
                            setOpen(false);
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          Examiner le bien →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
