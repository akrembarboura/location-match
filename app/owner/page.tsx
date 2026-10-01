import Link from "next/link";
import { ShieldCheck, Users, Wallet } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";



const perks = [
  { icon: Users, t: "Deux saisons, une annonce", d: "Les estivants de juin à septembre, les étudiants pour l'année universitaire." },
  { icon: ShieldCheck, t: "Locataires vérifiés", d: "Nous discutons avec chaque vacancier ou famille avant de partager votre contact." },
  { icon: Wallet, t: "Gratuit pour publier", d: "Vous fixez votre prix. Nous ne prenons une commission que lorsqu'une location est confirmée." },
];

function OwnerPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="eyebrow">Pour les propriétaires</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl text-foreground sm:text-4xl">Louez votre appartement été comme hiver</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Parlez-nous de votre bien une seule fois. Nous le visitons, le vérifions et vous envoyons des locataires sérieux.</p>
        <Link href="/owner/list-property" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark">Publier mon bien</Link>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {perks.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-lg border border-border bg-card p-5">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 font-display text-lg text-foreground">{t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export default OwnerPage;
