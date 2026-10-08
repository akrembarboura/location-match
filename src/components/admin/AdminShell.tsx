"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Building2,
  BarChart3,
  Activity,
  ArrowLeft,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { AdminNotificationBell } from "./AdminNotificationBell";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
}

const links = [
  { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { to: "/admin/requests", label: "Demandes", icon: Inbox, exact: false },
  { to: "/admin/clients", label: "Clients", icon: Users, exact: false },
  { to: "/admin/properties", label: "Biens", icon: Building2, exact: false },
  { to: "/admin/analytics", label: "Statistiques", icon: BarChart3, exact: false },
  { to: "/admin/activities", label: "Activités", icon: Activity, exact: false },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Ignore error
      }
    }
    loadUser();

    // Load sidebar state preference
    const savedState = localStorage.getItem("admin_sidebar_collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#admin-user-profile-menu")) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(nextState));
      return nextState;
    });
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  };

  const userInitials = user
    ? [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "AD"
    : "AD";

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "Administrateur";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Desktop Blue Sidebar Navigation */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border px-3 py-5 transition-all duration-300 lg:flex select-none",
          isCollapsed ? "w-16 items-center px-2" : "w-60"
        )}
      >
        {/* Sidebar Top Header & Toggle Button */}
        <div className={cn("mb-6 flex items-center justify-between w-full px-1", isCollapsed && "justify-center")}>
          {!isCollapsed && (
            <Link href="/" className="block text-sidebar-foreground [&_*]:text-sidebar-foreground">
              <Logo />
            </Link>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
            title={isCollapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-2 mb-4">
            <span className="text-[0.65rem] font-semibold text-sidebar-foreground/70 uppercase tracking-widest font-display block">
              Console d'opérations
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 w-full">
          {links.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === to : pathname?.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                title={isCollapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-xs transition-all",
                  isCollapsed ? "justify-center px-2" : "px-3",
                  isActive
                    ? "bg-sidebar-accent font-semibold text-sidebar-foreground shadow-2xs"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/80")} />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto space-y-1.5 pt-4 border-t border-sidebar-border/60 w-full">
          <Link
            href="/"
            title={isCollapsed ? "Retour au site" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full",
              isCollapsed ? "justify-center px-2" : "px-3"
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-sidebar-foreground/70" /> {!isCollapsed && <span>Retour au site</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={isCollapsed ? "Déconnexion" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-colors w-full",
              isCollapsed ? "justify-center px-2" : "px-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
            {!isCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header Bar */}
        <header className="border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Header Greeting / Title */}
            <div className="flex items-center gap-3">
              <div id="admin-user-profile-menu" className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-xl p-1 hover:bg-surface transition-colors focus:outline-none"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  title="Menu profil"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover border border-border shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary border border-primary/20 text-xs font-bold shadow-2xs shrink-0">
                      {userInitials}
                    </div>
                  )}
                  <div className="text-left">
                    <span className="flex items-center gap-1 font-display text-xs font-bold text-foreground">
                      Bonjour, {user?.firstName || displayName.split(" ")[0]} 👋
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform ml-0.5", profileMenuOpen && "rotate-180")} />
                    </span>
                    <span className="block text-[0.7rem] text-muted-foreground truncate max-w-[220px]">
                      {subtitle || "Gérer vos logements, demandes et performances"}
                    </span>
                  </div>
                </button>

                {/* Dropdown Card */}
                {profileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-raised z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-surface/60 border border-border/50 mb-2">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={displayName}
                          className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-xs shrink-0">
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">{displayName}</p>
                        <p className="text-[0.7rem] text-muted-foreground truncate">{user?.email || "admin@locmaison.tn"}</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[0.65rem] font-medium text-emerald-700 dark:text-emerald-300 mt-1 border border-emerald-500/20">
                          <Shield className="h-3 w-3" /> Rôle {user?.role || "ADMIN"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
                      <div className="px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        Droits d'administration
                      </div>
                      <div className="px-2 py-1 text-[0.75rem] text-foreground font-medium flex items-center justify-between">
                        <span>Modération logements</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Autorisé</span>
                      </div>
                      <div className="px-2 py-1 text-[0.75rem] text-foreground font-medium flex items-center justify-between">
                        <span>Gestion des demandes</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Autorisé</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border space-y-1">
                      <Link
                        href="/"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-surface transition-colors"
                      >
                        <span>Accéder au site public</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <span>Se déconnecter</span>
                        <LogOut className="h-3.5 w-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <AdminNotificationBell />

              {/* Action CTA Button */}
              <Link
                href="/admin/properties"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors"
              >
                <span>+ Gérer les annonces</span>
              </Link>
            </div>
          </div>

          {/* Mobile Horizontal Navigation Bar */}
          <nav
            aria-label="Navigation d’administration"
            className="mt-3.5 flex gap-4 overflow-x-auto border-b border-border lg:hidden pb-1"
          >
            {links.map(({ to, label, exact }) => {
              const isActive = exact ? pathname === to : pathname?.startsWith(to);
              return (
                <Link
                  key={to}
                  href={to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative -mb-px whitespace-nowrap border-b-2 px-1 pb-2 pt-1 text-xs transition-colors",
                    isActive
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 font-display text-2xl font-semibold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[0.7rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}
