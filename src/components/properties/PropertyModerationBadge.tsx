import React from "react";
import { AdminStatusBadge } from "@/lib/admin-theme";

export function PropertyModerationBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return <AdminStatusBadge status={status} className={className} showDot />;
}
