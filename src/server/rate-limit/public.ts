import type { NextRequest } from "next/server";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "./key";
import { rateLimit, rateLimitResponse } from "./index";
import type { RateLimitPolicy } from "./types";

/**
 * For public read routes only. Limiter outages must not take public reads offline.
 * Never use this for authentication, uploads, or other write routes.
 */
export async function publicRateLimit(
  request: NextRequest,
  policy: RateLimitPolicy
) {
  try {
    const key = generateRateLimitKey(policy.name, getClientIp(request));
    const result = await rateLimit(key, policy);
    return result.success ? null : rateLimitResponse(result);
  } catch (error) {
    console.warn(
      `Rate limiter unavailable for ${policy.name}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
