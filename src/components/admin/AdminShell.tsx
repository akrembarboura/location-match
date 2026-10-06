"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutDashboard, Inbox, Users, Building2, BarChart3, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { AdminNotificationBell } from "./AdminNotificationBell";

const links = [
  { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { to: "/admin/requests", label: "Demandes", icon: Inbox, exact: false },
  { to: "/admin/clients", label: "Clients", icon: Users, exact: false },
  { to: "/admin/properties", label: "Biens", icon: Building2, exact: false },
  { to: "/admin/analytics", label: "Statistiques", icon: BarChart3, exact: false },
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

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <Link href="/" className="mb-8 block text-sidebar-foreground [&_*]:text-sidebar-foreground">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === to : pathname?.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent font-medium text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour au site
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl text-foreground">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <AdminNotificationBell />
            </div>
          </div>
          <nav
            aria-label="Navigation d’administration"
            className="mt-4 flex gap-5 overflow-x-auto border-b border-border lg:hidden"
          >
            {links.map(({ to, label, exact }) => {
              const isActive = exact ? pathname === to : pathname?.startsWith(to);
              return (
                <Link
                  key={to}
                  href={to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative -mb-px whitespace-nowrap border-b-2 px-0.5 pb-2.5 pt-1 text-sm transition-colors",
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
          <Link
            href="/"
            className="mt-3 inline-flex min-h-11 w-full items-center gap-2 border-t border-border pt-3 text-sm font-medium text-primary transition-colors hover:text-primary-dark lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au site LOC MAISON
          </Link>
        </header>
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
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
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 font-display text-2xl ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
