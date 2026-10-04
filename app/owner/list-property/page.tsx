"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { OwnerPropertyForm } from "@/components/properties/OwnerPropertyForm";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ListPropertyPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push("/login?callbackUrl=/owner/list-property");
      return;
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageShell>
      <OwnerPropertyForm />
    </PageShell>
  );
}
