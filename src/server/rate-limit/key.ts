/**
 * Generates a consistent rate limit key to prevent trivial bypass.
 */
export function generateRateLimitKey(
  policyName: string,
  ip: string,
  identifier?: string
): string {
  // Normalize identifier (e.g., email to lowercase)
  const normalizedId = identifier ? identifier.trim().toLowerCase() : "";
  
  if (normalizedId) {
    return `rate-limit:${policyName}:${ip}:${normalizedId}`;
  }
  
  return `rate-limit:${policyName}:${ip}`;
}

export function generateUserRateLimitKey(
  policyName: string,
  userId: string
): string {
  return `rate-limit:${policyName}:${userId}`;
}
