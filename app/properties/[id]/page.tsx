import { redirect } from "next/navigation";
import { propertyService } from "@/server/services/PropertyService";

export const dynamic = "force-dynamic";

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const property = await propertyService.getPropertyBySlug(resolvedParams.id);

  if (!property) {
    redirect("/properties");
  }

  // Redirect to canonical house page slug URL
  redirect(`/houses/${property.slug || property.id}`);
}
