import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type { LoginInput, RegisterSchema } from "@/server/validations/auth";
import type { User } from "./types";

export type { User, UserRole } from "./types";

/** What the browser is allowed to send to /api/auth/register — never a role. */
export type RegisterRequest = Omit<z.input<typeof RegisterSchema>, "role">;
export type LoginRequest = LoginInput;

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "NETWORK"
  | "SERVER";

/**
 * Error thrown by auth mutations. `message` is always safe, user-facing French;
 * raw server bodies (stack traces, DB errors…) are never surfaced.
 */
export class AuthApiError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly retryAfterSeconds?: number;

  constructor(
    code: AuthErrorCode,
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const GENERIC_SERVER_MESSAGE =
  "Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.";

/** Extracts the first message per field from a Zod `error.format()` payload. */
function extractFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!details || typeof details !== "object") return out;
  for (const [field, value] of Object.entries(details as Record<string, unknown>)) {
    if (field === "_errors" || !value || typeof value !== "object") continue;
    const messages = (value as { _errors?: unknown })._errors;
    if (Array.isArray(messages) && typeof messages[0] === "string") out[field] = messages[0];
  }
  return out;
}

function formatRetryAfter(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? " Réessayez dans environ une minute." : ` Réessayez dans environ ${minutes} minutes.`;
}

/**
 * Maps the existing backend contract to typed errors:
 *   400 { error: "Validation Error", details }   → VALIDATION
 *   401 { error: "Invalid email or password" }   → INVALID_CREDENTIALS
 *   409 { error: "Email already registered" }    → EMAIL_TAKEN
 *   429 { error: { code: "RATE_LIMITED", … } }   → RATE_LIMITED (+ Retry-After)
 *   5xx / anything else                          → SERVER
 */
async function toAuthApiError(res: Response): Promise<AuthApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (proxy error page…) — fall through to a generic message.
  }
  const details = body && typeof body === "object" ? (body as { details?: unknown }).details : undefined;

  switch (res.status) {
    case 400:
      return new AuthApiError(
        "VALIDATION",
        "Veuillez vérifier les informations saisies.",
        400,
        extractFieldErrors(details),
      );
    case 401:
      return new AuthApiError("INVALID_CREDENTIALS", "Email ou mot de passe incorrect.", 401);
    case 409:
      return new AuthApiError("EMAIL_TAKEN", "Cet email est déjà utilisé.", 409, {
        email: "Cet email est déjà utilisé.",
      });
    case 429: {
      const retryAfter = Number(res.headers.get("Retry-After")) || undefined;
      return new AuthApiError(
        "RATE_LIMITED",
        `Trop de tentatives. Veuillez patienter avant de réessayer.${formatRetryAfter(retryAfter)}`,
        429,
        {},
        retryAfter,
      );
    }
    default:
      return new AuthApiError("SERVER", GENERIC_SERVER_MESSAGE, res.status);
  }
}

async function postJson<T>(url: string, payload?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      credentials: "same-origin",
    });
  } catch {
    throw new AuthApiError(
      "NETWORK",
      "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.",
      0,
    );
  }
  if (!res.ok) throw await toAuthApiError(res);
  return (await res.json()) as T;
}

export const currentUserQueryKey = ["auth", "currentUser"] as const;

export const currentUserQuery = () =>
  queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: async (): Promise<User | null> => {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch current user");
      }
      const data = (await res.json()) as { user: User | null };
      return data.user ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Don't retry auth checks constantly
    retry: false,
  });

export function useAuthMutations() {
  const queryClient = useQueryClient();

  const loginMutation = useMutation<{ user: User }, AuthApiError, LoginRequest>({
    mutationFn: (input) => postJson<{ user: User }>("/api/auth/login", input),
    onSuccess: (data) => {
      // The HttpOnly session cookie is set by the server; we only cache the safe DTO.
      queryClient.setQueryData(currentUserQueryKey, data.user);
    },
  });

  const registerMutation = useMutation<{ user: User }, AuthApiError, RegisterRequest>({
    // Explicit allow-list: even if a caller passes extra keys, `role` is never sent.
    mutationFn: ({ email, password, firstName, lastName, phone }) =>
      postJson<{ user: User }>("/api/auth/register", { email, password, firstName, lastName, phone }),
    onSuccess: (data) => {
      // Registration logs the user in server-side (session cookie already set).
      queryClient.setQueryData(currentUserQueryKey, data.user);
    },
  });

  const logoutMutation = useMutation<void, AuthApiError, void>({
    mutationFn: async () => {
      await postJson<{ success: boolean }>("/api/auth/logout");
    },
    onSuccess: () => {
      // Invalidate current user cache
      queryClient.setQueryData(currentUserQueryKey, null);
      // Aggressively clear any private cached data
      queryClient.clear();
      // Optionally reload the page to purge memory
      window.location.href = "/";
    },
  });

  return {
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
