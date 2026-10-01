import type { ReactNode } from "react";
import { PageShell } from "./PageShell";

export function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </PageShell>
  );
}
