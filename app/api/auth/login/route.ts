import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { LoginSchema } from "@/server/validations/auth";
import { authService } from "@/server/services/AuthService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10 * 1024; // un formulaire de connexion n'a jamais besoin de plus

// Messages fixes côté route : le texte affiché à l'utilisateur ne dépend jamais de AuthService.
const ACCOUNT_MESSAGES: Record<string, string> = {
  ACCOUNT_PENDING: "Votre compte est en attente de validation par notre équipe.",
  ACCOUNT_REJECTED:
    "Votre compte propriétaire a été rejeté. Vous pouvez contacter LOC MAISON pour plus d'informations.",
  ACCOUNT_SUSPENDED: "Votre compte est suspendu. Contactez-nous pour plus d'informations.",
  ACCOUNT_DISABLED: "Votre compte est désactivé. Contactez-nous pour plus d'informations.",
};

function readError(error: unknown) {
  const e = (typeof error === "object" && error !== null ? error : {}) as {
    code?: unknown;
    message?: unknown;
    statusCode?: unknown;
  };
  return {
    code: typeof e.code === "string" ? e.code : undefined,
    message: typeof e.message === "string" ? e.message : "",
    statusCode: typeof e.statusCode === "number" ? e.statusCode : undefined,
  };
}

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  // 1) Taille et lecture du corps
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Validation Error" }, { status: 413, headers: noStore });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Validation Error" }, { status: 400, headers: noStore });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
      { status: 400, headers: noStore }
    );
  }

  // 2) Limitation de débit (fail closed : si le magasin est indisponible, on refuse)
  try {
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(
      POLICIES.AUTH_LOGIN.name,
      ip,
      parsed.data.email.toLowerCase()
    );
    const rlResult = await rateLimit(rlKey, POLICIES.AUTH_LOGIN);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }
  } catch {
    console.error("POST /api/auth/login rate limiter unavailable");
    return NextResponse.json(
      { error: "Service temporarily unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 503, headers: noStore }
    );
  }

  // 3) Connexion
  try {
    const user = await authService.login(parsed.data);
    return NextResponse.json({ user }, { headers: noStore });
  } catch (error) {
    const { code, message, statusCode } = readError(error);

    if (code === "INVALID_CREDENTIALS" || message === "Invalid email or password") {
      return NextResponse.json(
        { error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
        { status: 401, headers: noStore }
      );
    }

    if (code && code in ACCOUNT_MESSAGES) {
      const status = statusCode && statusCode >= 400 && statusCode < 500 ? statusCode : 403;
      const fixedMessage = ACCOUNT_MESSAGES[code];
      return NextResponse.json(
        { error: { code, message: fixedMessage }, code, message: fixedMessage },
        { status, headers: noStore }
      );
    }

    // Erreur inattendue : détails dans les logs serveur uniquement,
    // le navigateur reçoit seulement un identifiant de référence.
    const ref = randomUUID().slice(0, 8);
    console.error(`POST /api/auth/login error [${ref}]:`, readError(error).code ?? "UnknownError");
    return NextResponse.json(
      { error: "Internal Server Error", ref },
      { status: 500, headers: noStore }
    );
  }
}