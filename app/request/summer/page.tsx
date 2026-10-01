import { PageShell } from "@/components/site/PageShell";
import { SummerRequestForm } from "@/components/site/RequestForms";



function RequestSummer() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">Summer request</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Tell us about your stay</h1>
        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          <SummerRequestForm />
        </div>
      </div>
    </PageShell>
  );
}

export default RequestSummer;
