import { PageShell } from "@/components/site/PageShell";
import { StudentRequestForm } from "@/components/site/RequestForms";



function RequestStudent() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">Student request</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Tell us about your year</h1>
        <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-7">
          <StudentRequestForm />
        </div>
      </div>
    </PageShell>
  );
}

export default RequestStudent;
