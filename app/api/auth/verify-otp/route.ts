import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { VerifyOTPSchema } from "@/server/validations/auth";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { POLICIES } from "@/server/rate-limit/policies";
import { getClientIp } from "@/server/utils/client-ip";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = VerifyOTPSchema.safeParse(body);

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

    // 1. Enforce IP-level verify limit
    const ipLimitResult = await rateLimit(`rate-limit:AUTH_VERIFY_OTP_IP:${clientIp}`, POLICIES.AUTH_VERIFY_OTP);
    if (!ipLimitResult.success) {
      return rateLimitResponse(ipLimitResult);
    }

    // 2. Enforce Account-level verify limit
    const accountLimitResult = await rateLimit(
      `rate-limit:AUTH_VERIFY_OTP_ACCOUNT:${normalizedEmail}`,
      POLICIES.AUTH_VERIFY_OTP
    );
    if (!accountLimitResult.success) {
      return rateLimitResponse(accountLimitResult);
    }

    const result = await authService.verifyOTP(normalizedEmail, parseResult.data.otp);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[AUTH] Verify OTP error:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code || "INVALID_OTP",
          message: err.message || "Impossible de vérifier le code OTP.",
          attemptsRemaining: err.attemptsRemaining,
        },
      },
      { status: err.statusCode || 400 }
    );
  }
}
