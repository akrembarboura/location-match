"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "switch" | "ghost";
  size?: "sm" | "default";
  "aria-label"?: string;
}

export function ThemeToggle({
  className,
  variant = "ghost",
  size = "default",
  "aria-label": customAriaLabel,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Prevent layout shift during SSR before client hydration:
  // Render Sun icon by default in light mode
  if (!mounted) {
    if (variant === "switch") {
      return (
        <div
          className={cn(
            "inline-flex h-8 w-15 items-center rounded-full border border-border bg-card p-0.5 opacity-60",
            className
          )}
          aria-hidden="true"
        >
          <span className="h-6.5 w-6.5 rounded-full bg-muted" />
        </div>
      );
    }

    if (variant === "ghost") {
      return (
        <button
          type="button"
          aria-label={customAriaLabel || "Activer le mode sombre"}
          title="Passer en mode sombre"
          className={cn(
            "group relative inline-flex h-9 w-9 items-center justify-center rounded-full p-2 text-foreground/80 transition-colors shrink-0",
            className
          )}
        >
          <Sun className="h-5 w-5 text-foreground/80 stroke-[1.75]" />
        </button>
      );
    }

    const buttonSize = size === "sm" ? "h-8 w-8" : "h-8.5 w-8.5";
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-60",
          buttonSize,
          className
        )}
        aria-hidden="true"
      >
        <Sun className="h-4.5 w-4.5 text-foreground/80 stroke-[1.75]" />
      </div>
    );
  }

  // Minimalist Ghost Icon Button:
  // - In Light mode: displays Sun icon to reflect daytime/light theme.
  // - In Dark mode: displays Moon icon to reflect night/dark theme.
  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={customAriaLabel || (isDark ? "Activer le mode clair" : "Activer le mode sombre")}
        title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        className={cn(
          "group relative inline-flex h-9 w-9 items-center justify-center rounded-full p-2 text-foreground/80 transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 shrink-0",
          className
        )}
      >
        {isDark ? (
          <Moon className="h-5 w-5 text-sky-400 group-hover:text-sky-300 transition-transform duration-200 stroke-[1.75]" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500 group-hover:text-amber-600 transition-transform duration-200 stroke-[1.75]" />
        )}
      </button>
    );
  }

  // Interactive Switch Pill with Sun & Moon Icons
  if (variant === "switch") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        aria-label={customAriaLabel || (isDark ? "Désactiver le mode sombre" : "Activer le mode sombre")}
        title={isDark ? "Mode sombre activé — Cliquer pour désactiver" : "Mode sombre désactivé — Cliquer pour activer"}
        className={cn(
          "group relative inline-flex h-7.5 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface p-0.5 transition-colors duration-300 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDark ? "bg-slate-800/80 border-slate-700" : "bg-sand/60",
          className
        )}
      >
        <div className="flex w-full items-center justify-between px-1.5 select-none pointer-events-none">
          <Sun
            className={cn(
              "h-3.5 w-3.5 transition-opacity duration-200",
              isDark ? "text-muted-foreground/50 opacity-40" : "text-amber-500 opacity-100"
            )}
          />
          <Moon
            className={cn(
              "h-3.5 w-3.5 transition-opacity duration-200",
              isDark ? "text-sky-400 opacity-100" : "text-muted-foreground/50 opacity-40"
            )}
          />
        </div>

        <span
          className={cn(
            "pointer-events-none absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm transition-transform duration-300 ease-spring",
            isDark
              ? "left-0.5 translate-x-6.5 bg-slate-900 border border-slate-700 text-sky-400"
              : "left-0.5 translate-x-0 bg-white border border-border text-amber-500"
          )}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 animate-in fade-in zoom-in-75 duration-200 stroke-[1.75]" />
          ) : (
            <Sun className="h-3.5 w-3.5 animate-in fade-in zoom-in-75 duration-200 stroke-[1.75]" />
          )}
        </span>
      </button>
    );
  }

  // Interactive 1-Click Button with Border
  const buttonSizeClasses = size === "sm" ? "h-8 w-8" : "h-8.5 w-8.5";
  const iconSizeClasses = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={customAriaLabel || (isDark ? "Désactiver le mode sombre" : "Activer le mode sombre")}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-all duration-200 hover:border-primary/60 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 shrink-0",
        buttonSizeClasses,
        className
      )}
    >
      {isDark ? (
        <Moon className={cn(iconSizeClasses, "text-sky-400 transition-transform duration-200 stroke-[1.75]")} />
      ) : (
        <Sun className={cn(iconSizeClasses, "text-amber-500 transition-transform duration-200 stroke-[1.75]")} />
      )}
    </button>
  );
}
