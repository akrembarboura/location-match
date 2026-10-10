"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Menu,
  X,
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
  CalendarDays,
  Compass,
  User as UserIcon,
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
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * Primary navigation routes with clean marketplace hierarchy.
 */
const primaryNav = [
  { href: "/houses", label: "Explorer" },
  { href: "/summer", label: "Location d'été" },
  { href: "/student", label: "Logement étudiant" },
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
        className={cn(
          "rounded-full object-cover shrink-0 border border-border",
          sizeClasses,
          className
        )}
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

  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Close menus when route changes
  useEffect(() => {
    setNavOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Click-outside and Escape key listener for account dropdown
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

  // Escape key listener for mobile drawer
  useEffect(() => {
    if (!navOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navOpen]);

  // Close on mobile drawer click outside
  useEffect(() => {
    if (!navOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        mobileNavRef.current &&
        !mobileNavRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("#mobile-menu-toggle-btn")
      ) {
        setNavOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navOpen]);

  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    setNavOpen(false);
    await logout();
  }, [logout]);

  // Admin section has its own full sidebar & header shell
  if (pathname?.startsWith("/admin")) return null;

  const displayName = user ? getUserDisplayName(user) : "";
  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "";
  const roleLabel = user ? getRoleLabel(user.role) : "";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ========================================================= */}
        {/* LEFT SECTION — Logo / Brand (Pushed to the far left)      */}
        {/* ========================================================= */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            aria-label="LOC MAISON — Accueil"
            className="flex items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-0.5"
          >
            <Logo />
          </Link>
        </div>

        {/* ========================================================= */}
        {/* CENTER SECTION — Main Navigation Links in the Middle      */}
        {/* ========================================================= */}
        <nav
          className="hidden md:flex items-center justify-center gap-7 lg:gap-9"
          aria-label="Navigation principale"
        >
          {primaryNav.map((item) => {
            const isActive =
              item.href === "/houses"
                ? pathname === "/houses" || pathname?.startsWith("/houses/")
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2.5 left-0 right-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}

          {/* Customer quick access to 'Mes demandes' when authenticated */}
          {isAuthenticated && user?.role === "CUSTOMER" && (
            <Link
              href="/dashboard"
              className={cn(
                "relative py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                pathname?.startsWith("/dashboard")
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mes demandes
              {pathname?.startsWith("/dashboard") && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2.5 left-0 right-0 h-0.5 rounded-full bg-primary"
                />
              )}
            </Link>
          )}
        </nav>

        {/* ========================================================= */}
        {/* RIGHT SECTION — Actions & Account Controls (Far right)    */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center gap-5 lg:gap-6 shrink-0">
          {/* 1. Primary Conversion Action */}
          <Link
            href="/owner"
            onClick={() => trackEvent("owner_cta_clicked")}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors hover:bg-slate-800 dark:hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Publier mon bien
          </Link>

          {/* Grouped Minimalist Icons (Theme ☀️/🌙 & Account 👤) */}
          <div className="flex items-center gap-3 lg:gap-3.5">
            {/* 2. Theme Toggle (Minimalist Ghost Icon) */}
            <ThemeToggle variant="ghost" aria-label="Changer de thème" />

            {/* 3. Account Menu Trigger (Minimalist Icon / Avatar) */}
            {loading ? (
              <div
                className="h-9 w-9 rounded-full bg-border/40 animate-pulse"
                aria-hidden="true"
              />
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label={`Menu de compte (${fullName})`}
                  title={`Compte: ${displayName}`}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    profileOpen && "bg-surface text-foreground"
                  )}
                >
                  {user.avatar ? (
                    <UserAvatar user={user} size="sm" />
                  ) : (
                    <UserIcon className="h-5 w-5 stroke-[1.75]" />
                  )}
                  {/* Subtle active status indicator dot */}
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card"
                  />
                </button>

                {/* Floating Account Dropdown */}
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

                    {/* Role-Specific Navigation Options */}
                    <div className="py-1.5 space-y-0.5">
                      {/* CUSTOMER Role Actions */}
                      {user.role === "CUSTOMER" && (
                        <>
                          <Link
                            role="menuitem"
                            href="/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <Inbox className="h-4 w-4 text-muted-foreground" />
                            Mes demandes
                          </Link>
                          <Link
                            role="menuitem"
                            href="/owner"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Espace propriétaire
                          </Link>
                        </>
                      )}

                      {/* OWNER Role Actions */}
                      {user.role === "OWNER" && (
                        <>
                          <Link
                            role="menuitem"
                            href="/owner"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Tableau de bord
                          </Link>
                          <Link
                            role="menuitem"
                            href="/owner/properties"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Mes annonces
                          </Link>
                          <Link
                            role="menuitem"
                            href="/owner/calendar"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            Calendrier
                          </Link>
                          <Link
                            role="menuitem"
                            href="/owner/reservations"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Mes réservations
                          </Link>
                        </>
                      )}

                      {/* ADMIN & SUPER_ADMIN Role Actions */}
                      {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                        <>
                          <Link
                            role="menuitem"
                            href="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Shield className="h-4 w-4 text-primary" />
                            Console d'administration
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
                            Gestion des annonces
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Sign Out Action */}
                    <div className="border-t border-border/80 pt-1 mt-1">
                      <button
                        role="menuitem"
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Signed-Out Visitor: Minimalist User Icon linking to Login */
              <Link
                href="/login"
                aria-label="Connexion à votre compte"
                title="Connexion"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserIcon className="h-5 w-5 stroke-[1.75]" />
              </Link>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE SECTION — Minimalist Controls                     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 md:hidden">
          {/* Quick Theme Toggle on Mobile */}
          <ThemeToggle variant="ghost" aria-label="Changer de thème" />

          {/* Quick Account Icon on Mobile */}
          <Link
            href={isAuthenticated ? (user?.role === "OWNER" ? "/owner" : "/dashboard") : "/login"}
            aria-label="Mon profil"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-surface transition-colors"
          >
            {isAuthenticated && user ? (
              <UserAvatar user={user} size="sm" />
            ) : (
              <UserIcon className="h-5 w-5 stroke-[1.75]" />
            )}
          </Link>

          {/* Hamburger Menu Toggle */}
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            aria-label={navOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE DRAWER — Clean Navigation Drawer                   */}
      {/* ========================================================= */}
      {navOpen && (
        <div
          ref={mobileNavRef}
          className="border-t border-border bg-card px-5 pb-6 pt-3 md:hidden shadow-raised animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Primary Navigation Links */}
          <nav aria-label="Navigation mobile" className="flex flex-col">
            {primaryNav.map((item) => {
              const isActive =
                item.href === "/houses"
                  ? pathname === "/houses" || pathname?.startsWith("/houses/")
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "flex items-center justify-between border-b border-border/70 py-3.5 text-sm font-medium transition-colors last:border-0",
                    isActive ? "text-primary font-semibold" : "text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </Link>
              );
            })}

            {isAuthenticated && user?.role === "CUSTOMER" && (
              <Link
                href="/dashboard"
                onClick={() => setNavOpen(false)}
                className="flex items-center justify-between border-b border-border/70 py-3.5 text-sm font-medium transition-colors text-foreground"
              >
                <span>Mes demandes</span>
              </Link>
            )}
          </nav>

          {/* User Account / Session Section */}
          <div className="mt-4 pt-3 border-t border-border/80">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                  <UserAvatar user={user} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
                      {roleLabel}
                    </span>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  </div>
                </div>

                {/* Role Specific Shortcuts */}
                <div className="flex flex-col gap-1 text-sm font-medium">
                  {user.role === "CUSTOMER" && (
                    <Link
                      href="/dashboard"
                      onClick={() => setNavOpen(false)}
                      className="flex items-center gap-2.5 py-2 text-foreground hover:text-primary transition-colors"
                    >
                      <Inbox className="h-4 w-4 text-primary" />
                      Mes demandes
                    </Link>
                  )}

                  {user.role === "OWNER" && (
                    <>
                      <Link
                        href="/owner"
                        onClick={() => setNavOpen(false)}
                        className="flex items-center gap-2.5 py-2 text-foreground hover:text-primary transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-primary" />
                        Tableau de bord
                      </Link>
                      <Link
                        href="/owner/properties"
                        onClick={() => setNavOpen(false)}
                        className="flex items-center gap-2.5 py-2 text-foreground hover:text-primary transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-primary" />
                        Mes annonces
                      </Link>
                    </>
                  )}

                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <Link
                      href="/admin"
                      onClick={() => setNavOpen(false)}
                      className="flex items-center gap-2.5 py-2 text-primary font-semibold hover:opacity-80 transition-opacity"
                    >
                      <Shield className="h-4 w-4 text-primary" />
                      Console d'administration
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 py-2 text-destructive font-medium text-left hover:opacity-80 transition-opacity"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setNavOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                <LogIn className="h-4 w-4 text-primary" />
                Connexion / Créer un compte
              </Link>
            )}
          </div>

          {/* Primary Landlord Action (Full Width CTA in Mobile Menu) */}
          <div className="mt-4">
            <Link
              href="/owner"
              onClick={() => {
                trackEvent("owner_cta_clicked");
                setNavOpen(false);
              }}
              className="flex w-full items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground py-2.5 text-center text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors hover:bg-slate-800 dark:hover:bg-primary-dark"
            >
              Publier mon bien
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Mobile Bottom Tab Bar for quick thumb navigation on handheld devices
 */
const bottomNav = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/houses", label: "Explorer", icon: Compass },
  { to: "/summer", label: "Été", icon: Sun },
  { to: "/student", label: "Étudiant", icon: GraduationCap },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Omit bottom tab bar on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Barre de navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {bottomNav.map(({ to, label, icon: Icon }) => {
        const isActive =
          to === "/"
            ? pathname === "/"
            : to === "/houses"
            ? pathname === "/houses" || pathname?.startsWith("/houses/")
            : pathname?.startsWith(to);

        return (
          <Link
            key={to}
            href={to}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[0.68rem] font-medium transition-colors",
              isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      <Link
        href={isAuthenticated ? "/dashboard" : "/login"}
        className={cn(
          "flex flex-col items-center gap-1 py-2 text-[0.68rem] font-medium transition-colors",
          (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login"))
            ? "text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isAuthenticated ? <Inbox className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        {isAuthenticated ? "Demandes" : "Connexion"}
      </Link>
    </nav>
  );
}
