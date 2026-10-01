import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={cn("h-8 w-9", className)} aria-hidden="true">
      <path
        d="M4 20 L24 4 L44 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 28c4-4 8-4 12 0s8 4 12 0 8-4 8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M8 34c4-4 8-4 12 0s8 4 12 0 8-4 8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-primary", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] font-bold tracking-tight text-primary">
          LOC MAISON
        </span>
        {!compact && (
          <span className="mt-0.5 block text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
            Plateforme de location
          </span>
        )}
      </span>
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.68rem] font-medium text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
        <path d="M8 0l1.9 1.4 2.3-.2.7 2.2 1.9 1.3-.9 2.2.9 2.2-1.9 1.3-.7 2.2-2.3-.2L8 14l-1.9-1.6-2.3.2-.7-2.2L1.2 9.1l.9-2.2-.9-2.2 1.9-1.3.7-2.2 2.3.2L8 0zm-.6 9.9l3.6-3.6-1-1-2.6 2.6-1.3-1.3-1 1 2.3 2.3z" />
      </svg>
      Annonce contrôlée
    </span>
  );
}
