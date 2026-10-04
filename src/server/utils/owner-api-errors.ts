import { NextResponse } from "next/server";

/**
 * Maps auth-guard errors to HTTP responses for owner APIs.
 * Returns null when the error is not an auth error.
 */
export function ownerAuthErrorResponse(error: unknown) {
  const name = (error as { name?: string } | null)?.name;
  if (name === "AuthenticationError") {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (name === "AuthorizationError") {
    return NextResponse.json(
      {
        error: "Activez votre espace propriétaire pour publier un bien.",
        code: "OWNER_ONBOARDING_REQUIRED",
      },
      { status: 403 }
    );
  }
  return null;
}
