import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { ResendOTPSchema } from "@/server/validations/auth";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { POLICIES } from "@/server/rate-limit/policies";
import { getClientIp } from "@/server/utils/client-ip";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = ResendOTPSchema.safeParse(body);

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

    // 1. Account-level resend rate limit (max 3 resends per 15 min)
    const accountLimitResult = await rateLimit(
      `rate-limit:AUTH_RESEND_OTP:${normalizedEmail}`,
      POLICIES.AUTH_RESEND_OTP
    );
    if (!accountLimitResult.success) {
      return rateLimitResponse(accountLimitResult);
    }

    // 2. IP-level resend rate limit
    const ipLimitResult = await rateLimit(`rate-limit:AUTH_RESEND_OTP_IP:${clientIp}`, POLICIES.AUTH_RESEND_OTP);
    if (!ipLimitResult.success) {
      return rateLimitResponse(ipLimitResult);
    }

    const result = await authService.resendOTP(normalizedEmail);

    return NextResponse.json({
      success: true,
      data: {
        message: result.message || "Si un défi est actif pour ce compte, un nouveau code a été envoyé.",
      },
    });
  } catch (err: any) {
    console.error("[AUTH] Resend OTP error:", err.message);
    if (err.statusCode === 429) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: err.message,
          },
        },
        { status: 429 }
      );
    }

    // Return non-disclosing generic success response
    return NextResponse.json({
      success: true,
      data: {
        message: "Si un défi est actif pour ce compte, un nouveau code a été envoyé.",
      },
    });
  }
}
