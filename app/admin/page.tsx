import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { deals, properties, requests, formatDT } from "@/lib/mock-data";



function AdminHome() {
  const open = requests.filter((r) => r.stage !== "Completed").length;
  const margin = deals.reduce((s, d) => s + d.customerOffer - d.ownerPrice, 0);
  return (
    <AdminShell title="Vue d'ensemble" subtitle="Cette semaine à Mahdia">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Demandes ouvertes" value={String(open)} accent />
        <StatCard label="Biens" value={String(properties.length)} hint={`${properties.filter((p) => !p.verified).length} en attente de contrôle`} />
        <StatCard label="Contrats conclus" value={String(deals.length)} />
        <StatCard label="Marge générée" value={`${formatDT(margin)} DT`} />
      </div>
      <h2 className="mt-8 font-display text-lg text-foreground">Contrats récents</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Contrat</th><th className="p-3">Bien</th><th className="p-3">Propriétaire</th><th className="p-3">Client</th><th className="p-3">Marge</th><th className="p-3">Date</th></tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3">{d.id}</td><td className="p-3">{d.property}</td>
                <td className="p-3">{formatDT(d.ownerPrice)} DT</td><td className="p-3">{formatDT(d.customerOffer)} DT</td>
                <td className="p-3 font-medium text-primary">{formatDT(d.customerOffer - d.ownerPrice)} DT</td><td className="p-3 text-muted-foreground">{d.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export default AdminHome;
