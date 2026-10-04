import { PageShell } from "@/components/site/PageShell";
import { StudentRequestForm } from "@/components/site/RequestForms";
import { PropertyReservationForm } from "@/components/rentals/PropertyReservationForm";

export default async function RequestUniverse({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">
          {propertyId ? "Demande de logement universitaire" : "Logement universitaire"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          {propertyId ? "Demander ce logement" : "Parlez-nous de votre année universitaire"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {propertyId
            ? "Vérifiez les détails du logement et renseignez votre période souhaitée pour envoyer votre demande."
            : "Trouvez un studio ou un appartement partagé près des facultés et instituts de Mahdia (FSEG, ISI, ISET, ISAM)."}
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-7 shadow-xs">
          {propertyId ? (
            <PropertyReservationForm propertyId={propertyId} category="universe" />
          ) : (
            <StudentRequestForm />
          )}
        </div>
      </div>
    </PageShell>
  );
}
