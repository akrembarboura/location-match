import { NextResponse } from "next/server";
import { authService } from "@/server/services/AuthService";
import { ForgotPasswordSchema } from "@/server/validations/auth";
import { checkRateLimit } from "@/server/utils/rate-limit";

export async function POST(req: Request) {
  // Apply strict rate limiting: max 3 requests per 5 minutes per IP
  const rateLimitErr = checkRateLimit(req, { limit: 3, windowMs: 5 * 60 * 1000 });
  if (rateLimitErr) return rateLimitErr;

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

    const result = await authService.requestPasswordReset(parseResult.data.email);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message || "Une erreur est survenue lors de la demande.",
        },
      },
      { status: err.statusCode || 500 }
    );
  }
}

