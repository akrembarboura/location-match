import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { ResetPasswordSchema } from "@/server/validations/auth";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";
import { POLICIES } from "@/server/rate-limit/policies";
import { getClientIp } from "@/server/utils/client-ip";

export async function POST(req: NextRequest) {
  // Apply rate limiting: max 5 attempts per 15 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimitResult = await rateLimit(`rate-limit:AUTH_RESET_PASSWORD:${clientIp}`, POLICIES.AUTH_RESET_PASSWORD);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = ResetPasswordSchema.safeParse(body);

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

    const result = await authService.resetPassword(
      parseResult.data.token,
      parseResult.data.password
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[AUTH] Reset password error:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message || "Une erreur est survenue lors de la réinitialisation.",
        },
      },
      { status: err.statusCode || 400 }
    );
  }
}
