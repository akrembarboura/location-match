import { NextRequest } from "next/server";

/**
 * Extracts the trusted client IP.
 * Relies on typical proxy headers like x-forwarded-for.
 */
export function getClientIp(req: NextRequest): string {
  // Check standard Vercel/proxy header
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  // Check alternative real-ip
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  
  // Fallback if IP cannot be determined
  return "127.0.0.1";
}
