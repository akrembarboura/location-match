import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/site/PropertyCard";
import { owners, properties, formatDT } from "@/lib/mock-data";



function AdminProperties() {
  return (
    <AdminShell title="Biens" subtitle={`${properties.length} biens · ${owners.length} propriétaires`}>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Réf</th><th className="p-3">Bien</th><th className="p-3">Propriétaire</th><th className="p-3">Été / sem</th><th className="p-3">Étudiant / mois</th><th className="p-3">Statut</th></tr>
          </thead>
          <tbody>
            {properties.map((p) => {
              const o = owners.find((x) => x.id === p.ownerId);
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{p.id}</td>
                  <td className="p-3"><Link href={`/properties/${p.id }`} className="text-foreground hover:text-primary">{p.type} — {p.area}</Link></td>
                  <td className="p-3">{o?.name}<div className="text-xs text-muted-foreground">{o?.phone}</div></td>
                  <td className="p-3">{p.summerPrice ? `${formatDT(p.summerPrice)} DT` : "—"}</td>
                  <td className="p-3">{p.studentPrice ? `${formatDT(p.studentPrice)} DT` : "—"}</td>
                  <td className="p-3"><StatusPill status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export default AdminProperties;
