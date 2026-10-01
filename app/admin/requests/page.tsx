"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { REQUEST_STAGES, requests, matchesForRequest, type RequestStage } from "@/lib/mock-data";



function AdminRequests() {
  const [stages, setStages] = useState<Record<string, RequestStage>>(
    Object.fromEntries(requests.map((r) => [r.id, r.stage])),
  );
  const [selected, setSelected] = useState(requests[0]?.id ?? "");
  const r = requests.find((x) => x.id === selected) ?? requests[0]!;
  return (
    <AdminShell title="Demandes" subtitle={`${requests.length} demandes`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {requests.map((q) => (
            <button key={q.id} onClick={() => setSelected(q.id)}
              className={`w-full rounded-lg border bg-card p-4 text-left ${q.id === selected ? "border-primary" : "border-border"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{q.id} · {q.kind} · {q.submitted}</span>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-primary">{stages[q.id]}</span>
              </div>
              <p className="mt-1 font-medium text-foreground">{q.customer} · {q.people} personnes · {q.budget}</p>
              <p className="text-sm text-muted-foreground">{q.area} · {q.period}</p>
            </button>
          ))}
        </div>
        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">{r.id}</p>
          <h2 className="font-display text-lg text-foreground">{r.customer}</h2>
          <p className="text-sm text-muted-foreground">{r.phone}{r.university ? ` · ${r.university}` : ""}</p>
          <p className="mt-3 text-sm text-foreground">{r.note}</p>
          <label className="mt-4 block text-xs font-medium text-foreground">Étape
            <select className="field-input mt-1" value={stages[r.id]}
              onChange={(e) => setStages((s) => ({ ...s, [r.id]: e.target.value as RequestStage }))}>
              {REQUEST_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <h3 className="mt-5 text-sm font-medium text-foreground">Correspondances suggérées</h3>
          <ul className="mt-2 space-y-2">
            {matchesForRequest.map((m) => (
              <li key={m.propertyId} className="rounded-md bg-surface p-2.5 text-sm">
                <div className="flex justify-between"><span className="font-medium text-foreground">{m.label}</span><span className="text-primary">{m.score}%</span></div>
                <p className="text-xs text-muted-foreground">{m.price} · {m.reason}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminRequests;
