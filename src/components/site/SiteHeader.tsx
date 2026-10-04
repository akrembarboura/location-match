"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  Phone,
  Home,
  Sun,
  GraduationCap,
  Building2,
  LogIn,
  LogOut,
  ChevronDown,
  Inbox,
  Shield,
  Clock,
  PlusCircle,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import {
  getUserInitials,
  getUserDisplayName,
  getRoleLabel,
} from "@/lib/auth/user-helpers";
import { trackEvent } from "@/lib/analytics/client";

const nav = [
  { to: "/summer", label: "Location d'été" },
  { to: "/student", label: "Logement étudiant" },
  { to: "/properties", label: "Biens" },
];

/**
 * Visual avatar with initials fallback
 */
export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user?: { firstName?: string; lastName?: string; email?: string; avatar?: string } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initials = getUserInitials(
    user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : undefined,
    user?.email
  );

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-xs font-semibold",
    lg: "h-11 w-11 text-sm font-semibold",
  }[size];

  if (user?.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.firstName || "Avatar"}
        onError={() => setImgError(true)}
        className={cn("rounded-full object-cover shrink-0 border border-border", sizeClasses, className)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 select-none",
        sizeClasses,
        className
      )}
    >
      {initials}
    </div>
  );
}

export function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close header menus when navigating
  useEffect(() => {
    setNavOpen(false);
    setProfileOpen(false);
    setMobileProfileOpen(false);
  }, [pathname]);

  // Click-outside and Escape key management for desktop profile dropdown
  useEffect(() => {
    if (!profileOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  // The admin section uses AdminShell directly, so omit SiteHeader on /admin
  if (pathname?.startsWith("/admin")) return null;

  const displayName = user ? getUserDisplayName(user) : "";
  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "";
  const roleLabel = user ? getRoleLabel(user.role) : "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          onClick={() => {
            setNavOpen(false);
            setProfileOpen(false);
          }}
          className="shrink-0"
        >
          <Logo />
        </Link>

        {/* Center: Primary Marketplace Navigation (Desktop) */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {nav.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                pathname === item.to && "text-primary font-semibold"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: Actions & User Control (Desktop) */}
        <div className="hidden items-center gap-3.5 lg:flex">
          {/* Subtle phone contact */}
          <a
            href="tel:+21626574203"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary mr-1"
          >
            <Phone className="h-3.5 w-3.5" />
            Contact
          </a>

          {/* Primary Landlord Action (Marketplace CTA) */}
          <Link
            href="/owner"
            onClick={() => trackEvent("owner_cta_clicked")}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-xs transition-colors hover:bg-primary-dark"
          >
            Publier votre bien
          </Link>

          {/* Auth State Control */}
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-border/40 animate-pulse" aria-hidden="true" />
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label={`Menu de compte (${fullName})`}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-border bg-card p-1 pl-1 pr-2.5 text-left transition-colors hover:border-primary/50 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  profileOpen && "border-primary ring-2 ring-primary/20"
                )}
              >
                <UserAvatar user={user} size="sm" />
                <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
                  {displayName}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Floating Profile Dropdown */}
              {profileOpen && (
                <div
                  ref={dropdownRef}
                  role="menu"
                  aria-label="Menu du compte utilisateur"
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-card z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* Account Header */}
                  <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/80">
                    <UserAvatar user={user} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {fullName}
                      </p>
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
                        {roleLabel}
                      </span>
                      <p className="truncate text-[0.72rem] text-muted-foreground mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role-Specific Marketplace Navigation */}
                  <div className="py-1.5 space-y-0.5">
                    {/* Customer Actions */}
                    {user.role === "CUSTOMER" && (
                      <Link
                        role="menuitem"
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                      >
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                        Mes demandes
                      </Link>
                    )}

                    {/* Owner Actions */}
                    {user.role === "OWNER" && (
                      <>
                        <Link
                          role="menuitem"
                          href="/owner"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Espace propriétaire
                        </Link>
                        <Link
                          role="menuitem"
                          href="/owner/list-property"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                        >
                          <PlusCircle className="h-4 w-4 text-muted-foreground" />
                          Publier un bien
                        </Link>
                        <Link
                          role="menuitem"
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                        >
                          <Inbox className="h-4 w-4 text-muted-foreground" />
                          Mes demandes
                        </Link>
                      </>
                    )}

                    {/* Admin Actions */}
                    {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                      <>
                        <Link
                          role="menuitem"
                          href="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Shield className="h-4 w-4 text-primary" />
                          Administration
                        </Link>
                        <Link
                          role="menuitem"
                          href="/admin/requests"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Gestion des demandes
                        </Link>
                        <Link
                          role="menuitem"
                          href="/admin/properties"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Gestion des biens
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Sign Out Action */}
                  <div className="border-t border-border/80 pt-1 mt-1">
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogIn className="h-4 w-4" />
              Connexion
            </Link>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Authenticated Avatar Trigger on Mobile */}
          {isAuthenticated && user && (
            <button
              type="button"
              onClick={() => {
                setMobileProfileOpen((v) => !v);
                setNavOpen(false);
              }}
              aria-label="Mon profil"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
            >
              <UserAvatar user={user} size="sm" />
            </button>
          )}

          {/* Hamburger button */}
          <button
            type="button"
            aria-label={navOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => {
              setNavOpen((v) => !v);
              setMobileProfileOpen(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Profile Menu Drawer */}
      {mobileProfileOpen && isAuthenticated && user && (
        <div className="border-t border-border bg-card px-4 pb-5 pt-4 lg:hidden">
          {/* User Card */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
                {roleLabel}
              </span>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Mobile Profile Actions */}
          <div className="mt-3 flex flex-col divide-y divide-border">
            {user.role === "CUSTOMER" && (
              <Link
                href="/dashboard"
                onClick={() => setMobileProfileOpen(false)}
                className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
              >
                <Inbox className="h-4 w-4 text-primary" />
                Mes demandes
              </Link>
            )}

            {user.role === "OWNER" && (
              <>
                <Link
                  href="/owner"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
                >
                  <Building2 className="h-4 w-4 text-primary" />
                  Espace propriétaire
                </Link>
                <Link
                  href="/owner/list-property"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
                >
                  <PlusCircle className="h-4 w-4 text-primary" />
                  Publier un bien
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
                >
                  <Inbox className="h-4 w-4 text-primary" />
                  Mes demandes
                </Link>
              </>
            )}

            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-semibold text-primary"
                >
                  <Shield className="h-4 w-4 text-primary" />
                  Administration
                </Link>
                <Link
                  href="/admin/requests"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
                >
                  <Clock className="h-4 w-4 text-primary" />
                  Gestion des demandes
                </Link>
                <Link
                  href="/admin/properties"
                  onClick={() => setMobileProfileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
                >
                  <Building2 className="h-4 w-4 text-primary" />
                  Gestion des biens
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileProfileOpen(false);
                logout();
              }}
              className="flex items-center gap-3 py-3 text-sm font-medium text-destructive text-left"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {navOpen && (
        <div className="border-t border-border bg-card px-4 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col">
            {nav.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setNavOpen(false)}
                className={cn(
                  "border-b border-border py-3 text-[0.95rem] font-medium text-foreground last:border-0",
                  pathname === item.to && "text-primary font-semibold"
                )}
              >
                {item.label}
              </Link>
            ))}

            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setNavOpen(false)}
                className="border-b border-border py-3 text-[0.95rem] font-medium text-primary last:border-0"
              >
                Connexion / Créer un compte
              </Link>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Link
              href="/owner"
              onClick={() => setNavOpen(false)}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Publier votre bien
            </Link>
            <a
              href="tel:+21626574203"
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
  const { isAuthenticated } = useAuth();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Barre de navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {bottomNav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          href={to}
          className={cn(
            "flex flex-col items-center gap-1 py-2 text-[0.68rem] font-medium text-muted-foreground",
            (to === "/" ? pathname === "/" : pathname?.startsWith(to)) && "text-primary font-semibold"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <Link
        href={isAuthenticated ? "/dashboard" : "/login"}
        className={cn(
          "flex flex-col items-center gap-1 py-2 text-[0.68rem] font-medium text-muted-foreground",
          (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")) && "text-primary font-semibold"
        )}
      >
        {isAuthenticated ? <Inbox className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        {isAuthenticated ? "Demandes" : "Connexion"}
      </Link>
    </nav>
  );
}
