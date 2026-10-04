"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPostAuthRedirect, getSafeCallbackUrl } from "@/lib/auth/redirect";

/**
 * Sends authenticated users away from /login and /register.
 *
 * Covers both cases with one mechanism:
 *  - a signed-in user opens /login directly;
 *  - a login/registration just succeeded (the mutation writes the user DTO
 *    into the React Query session cache, which flips `user` here).
 *
 * This is UX only — protected routes are still enforced by middleware and
 * server-side guards using the HttpOnly session cookie.
 */
export function useAuthPageRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  useEffect(() => {
    if (!user) return;
    router.replace(getPostAuthRedirect(user.role, callbackUrl));
    router.refresh();
  }, [user, callbackUrl, router]);

  return { callbackUrl, isRedirecting: Boolean(user) };
}
