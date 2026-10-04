"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Phone, Home, Sun, GraduationCap, Building2, User as UserIcon, LogIn, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/summer", label: "Location d'été" },
  { to: "/student", label: "Logement étudiant" },
  { to: "/properties", label: "Biens" },
  { to: "/owner", label: "Publier votre bien" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  if (pathname?.startsWith("/admin")) return null;

  const dashboardHref =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? "/admin"
      : user?.role === "OWNER"
      ? "/owner"
      : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                pathname === item.to && "text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="tel:+21690000000"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <Phone className="h-4 w-4" />
            Contact
          </a>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 border-l border-border pl-3">
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <UserIcon className="h-4 w-4" />
                {user.firstName || "Mon espace"}
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-destructive"
                title="Déconnexion"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="sr-only">Déconnexion</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <LogIn className="h-4 w-4" />
              Connexion
            </Link>
          )}

          <Link
            href="/owner/list-property"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            Publier votre bien
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col">
            {nav.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-border py-3 text-[0.95rem] font-medium text-foreground last:border-0",
                  pathname === item.to && "text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated && user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="border-b border-border py-3 text-[0.95rem] font-medium text-foreground"
                >
                  Mon espace ({user.firstName || user.email})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="border-b border-border py-3 text-left text-[0.95rem] font-medium text-destructive last:border-0"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-[0.95rem] font-medium text-primary last:border-0"
              >
                Connexion / Créer un compte
              </Link>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/owner/list-property"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Publier votre bien
            </Link>
            <a
              href="tel:+21690000000"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

const bottomNav = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/summer", label: "Été", icon: Sun },
  { to: "/student", label: "Étudiant", icon: GraduationCap },
  { to: "/properties", label: "Biens", icon: Building2 },
];

export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      {bottomNav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          href={to}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium text-muted-foreground",
            (to === "/" ? pathname === "/" : pathname?.startsWith(to)) && "text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
