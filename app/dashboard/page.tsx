import Link from "next/link";
import { PageShell, DemoNote } from "@/components/site/PageShell";
import { myRequests } from "@/lib/mock-data";



function Dashboard() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Mon espace</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Mes demandes</h1>
        <div className="mt-4"><DemoNote>Vue de démonstration — exemples de demandes affichés.</DemoNote></div>
        <div className="mt-6 space-y-4">
          {myRequests.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{r.id} · {r.kind} · envoyée le {r.submitted}</span>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">{r.stage}</span>
              </div>
              <p className="mt-2 font-display text-lg text-foreground">{r.summary}</p>
              <p className="text-sm text-muted-foreground">{r.period}</p>
              <p className="mt-3 text-sm text-foreground">
                {r.optionCount > 0 ? `${r.optionCount} options prêtes — notre équipe les a envoyées sur WhatsApp.` : "Nous contactons les propriétaires."}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Link href="/request/summer" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Nouvelle demande d'été</Link>
          <Link href="/request/student" className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground">Nouvelle demande étudiante</Link>
        </div>
      </div>
    </PageShell>
  );
}

export default Dashboard;
