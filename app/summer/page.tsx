import { PageShell } from "@/components/site/PageShell";
import { SummerRequestForm } from "@/components/site/RequestForms";



function SummerPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">LOC MAISON · SÉJOURS BALNÉAIRES & VACANCES</p>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-foreground">
          Votre séjour estival sur la côte tunisienne
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
          Villas pieds dans l'eau, maisons de charme ou résidences familiales à Mahdia et sur le littoral. Précisez vos dates pour recevoir une proposition adaptée.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          <SummerRequestForm />
        </div>
      </div>
    </PageShell>
  );
}

export default SummerPage;
