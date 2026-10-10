import { NextRequest } from "next/server";

/**
 * Extracts the trusted client IP.
 * Relies on typical proxy headers like x-forwarded-for.
 */
export function getClientIp(req: Request | NextRequest): string {
  // Check standard proxy header (first entry is original client IP)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  
  // Check alternative real-ip
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Development-only: allow separating test/dev clients via header if present
  if (process.env.NODE_ENV !== "production") {
    const devClient = req.headers.get("x-dev-client-id");
    if (devClient) return `dev-${devClient}`;
  }
  
  // Fallback if IP cannot be determined
  return "127.0.0.1";
}
