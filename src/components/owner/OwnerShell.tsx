"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Inbox,
  User,
  PlusCircle,
} from "lucide-react";

interface OwnerShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function OwnerShell({ children, title, subtitle, actions }: OwnerShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: "/owner", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/owner/properties", label: "Mes biens", icon: Building2 },
    { href: "/owner/calendar", label: "Calendrier", icon: CalendarDays },
    { href: "/owner/reservations", label: "Réservations", icon: ClipboardList },
    { href: "/owner/payments", label: "Paiements", icon: CreditCard },
    { href: "/owner/requests", label: "Demandes", icon: Inbox },
    { href: "/owner/profile", label: "Profil", icon: User },
  ];

  const displayName = user?.firstName ? `Bonjour, ${user.firstName}` : "Espace Propriétaire";

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 mb-16 sm:mb-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              LOC MAISON — Espace Propriétaire
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title || displayName}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {actions}
            <Link
              href="/owner/list-property"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark transition-colors shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Publier un bien</span>
              <span className="sm:hidden">Ajouter</span>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1 border-b border-border mt-4 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/owner" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Page Main Content */}
        <main className="mt-6">{children}</main>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-2 py-1.5 flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/owner" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-1.5 min-w-14 rounded-lg text-[0.65rem] transition-colors ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
