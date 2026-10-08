import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";


export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">404 — Page introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-xs hover:bg-primary-dark transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </PageShell>
  );
}
