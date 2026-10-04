import { redirect } from "next/navigation";

export default function NewPropertyPage() {
  redirect("/owner/list-property");
}
