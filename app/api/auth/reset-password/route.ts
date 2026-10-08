import { NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { ResetPasswordSchema } from "@/server/validations/auth";
import { checkRateLimit } from "@/server/utils/rate-limit";

export async function POST(req: Request) {
  // Apply rate limiting: max 5 attempts per 15 minutes per IP
  const rateLimitErr = checkRateLimit(req, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (rateLimitErr) return rateLimitErr;

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
    console.error("Reset password error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message || "Une erreur est survenue lors de la réinitialisation.",
        },
      },
      { status: err.statusCode || 500 }
    );
  }
}

