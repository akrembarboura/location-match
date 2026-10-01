import { PageShell } from "@/components/site/PageShell";
import { StudentRequestForm } from "@/components/site/RequestForms";



function StudentPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">Logement étudiant</p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
          Trouvez un logement étudiant à Mahdia
        </h1>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
          Indiquez votre université, votre budget et votre date d'arrivée. Nous contactons les propriétaires près de votre campus et vous envoyons les offres qui correspondent.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          <StudentRequestForm />
        </div>
      </div>
    </PageShell>
  );
}

export default StudentPage;
