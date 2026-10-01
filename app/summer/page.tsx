import { PageShell } from "@/components/site/PageShell";
import { SummerRequestForm } from "@/components/site/RequestForms";



function SummerPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">Locations d'été</p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Trouvez votre maison d'été à Mahdia
        </h1>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Indiquez vos besoins. Nous vérifions directement auprès des propriétaires et vous proposons les options disponibles pour vos dates.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          <SummerRequestForm />
        </div>
      </div>
    </PageShell>
  );
}

export default SummerPage;
