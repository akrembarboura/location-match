import { PageShell } from "@/components/site/PageShell";
import { StudentRequestForm } from "@/components/site/RequestForms";



function StudentPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">LOC MAISON · ANNÉE UNIVERSITAIRE</p>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-foreground">
          Logements étudiants à proximité des campus
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
          Studios meublés, colocations et chambres privatives proches de la FSEG, l'ISI, l'ISET et l'ISAM de Mahdia. Dépôt de dossier simplifié sans avance superflue.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          <StudentRequestForm />
        </div>
      </div>
    </PageShell>
  );
}

export default StudentPage;
