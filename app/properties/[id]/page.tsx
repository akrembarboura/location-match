import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin, Check } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { StatusPill } from "@/components/site/PropertyCard";
import { formatDT, getProperty } from "@/lib/mock-data";



function PropertyNotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">This home is no longer listed</h1>
        <Link href="/properties" className="mt-4 inline-block text-primary underline">Browse other homes</Link>
      </div>
    </PageShell>
  );
}

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const p = getProperty(resolvedParams.id);
  if (!p) return <PropertyNotFound />;
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/properties" className="text-sm text-muted-foreground hover:text-primary">← All homes</Link>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {p.images.map((src, i) => (
            <img key={i} src={src} alt={p.title} width={1200} height={800}
              className={`w-full rounded-lg object-cover ${i === 0 ? "aspect-[4/3] sm:col-span-2 sm:row-span-2" : "aspect-[4/3]"}`} />
          ))}
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill status={p.status} />
              {p.verified && <span className="rounded bg-primary px-2 py-0.5 text-[0.68rem] text-primary-foreground">Verified</span>}
              <span className="text-xs text-muted-foreground">Ref. {p.id}</span>
            </div>
            <h1 className="mt-3 font-display text-2xl text-foreground sm:text-3xl">{p.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.area} · {p.walkToBeach}{p.nearUniversity ? ` · ${p.nearUniversity}` : ""}
            </p>
            <div className="mt-4 flex gap-5 text-sm text-foreground">
              <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{p.bedrooms} bedrooms</span>
              <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" />{p.bathrooms} bath</span>
              <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4" />{p.surface} m²</span>
            </div>
            <p className="mt-6 leading-relaxed text-muted-foreground">{p.description}</p>
            <h2 className="mt-8 font-display text-lg text-foreground">Amenities</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {p.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-foreground"><Check className="h-4 w-4 text-primary" />{a}</li>
              ))}
            </ul>
          </div>
          <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-card">
            {p.summerPrice && <p className="text-foreground"><span className="font-display text-2xl">{formatDT(p.summerPrice)} DT</span> <span className="text-sm text-muted-foreground">/ week (summer)</span></p>}
            {p.studentPrice && <p className="mt-1 text-foreground"><span className="font-display text-xl">{formatDT(p.studentPrice)} DT</span> <span className="text-sm text-muted-foreground">/ month (students)</span></p>}
            <p className="mt-3 text-xs text-muted-foreground">Owner contact is shared by our team after your request is confirmed.</p>
            <div className="mt-4 flex flex-col gap-2">
              {p.summerPrice && <Link href="/request/summer" className="rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary-dark">Request for summer</Link>}
              {p.studentPrice && <Link href="/request/student" className="rounded-md border border-primary px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-primary-soft">Request as a student</Link>}
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}


