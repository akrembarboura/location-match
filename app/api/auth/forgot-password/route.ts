import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { ForgotPasswordSchema } from "@/server/validations/auth";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { POLICIES } from "@/server/rate-limit/policies";
import { getClientIp } from "@/server/utils/client-ip";

export async function POST(req: NextRequest) {
  // 1. Apply IP-level rate limiting (max 20 per 15 min)
  const clientIp = getClientIp(req);
  const ipLimitResult = await rateLimit(`rate-limit:AUTH_FORGOT_PASSWORD_IP:${clientIp}`, POLICIES.AUTH_FORGOT_PASSWORD_IP);
  if (!ipLimitResult.success) {
    return rateLimitResponse(ipLimitResult);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = ForgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parseResult.error.errors[0]?.message || "Données invalides.",
          },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = parseResult.data.email.toLowerCase().trim();

    // 2. Apply Account-level rate limiting (max 5 per hour per normalized email)
    const accountLimitResult = await rateLimit(
      `rate-limit:AUTH_FORGOT_PASSWORD_ACCOUNT:${normalizedEmail}`,
      POLICIES.AUTH_FORGOT_PASSWORD_ACCOUNT
    );
    if (!accountLimitResult.success) {
      return rateLimitResponse(accountLimitResult);
    }

    const result = await authService.requestPasswordReset(normalizedEmail);

    // Secure Public Response Contract: Strip internal fields / resetUrl to prevent enumeration & disclosure
    return NextResponse.json({
      success: true,
      data: {
        message: result.message || "Si cette adresse e-mail est associée à un compte, vous recevrez des instructions pour réinitialiser votre mot de passe.",
      },
    });
  } catch (err: any) {
    console.error("[AUTH] Forgot password request error:", err.message);
    // Generic public response even on error to prevent account discovery
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Si cette adresse e-mail est associée à un compte, vous recevrez des instructions pour réinitialiser votre mot de passe.",
        },
      },
      { status: 200 }
    );
  }
}
