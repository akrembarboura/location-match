import type { ReactNode } from "react";
import { SiteHeader, MobileTabBar } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children, hideFooter }: { children: ReactNode; hideFooter?: boolean }) {
  return <>{children}</>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-sand px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  );
}
