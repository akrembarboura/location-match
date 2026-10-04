import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema } from "@/server/validations/auth";
import { authService } from "@/server/services/AuthService";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation Error", details: parsed.error.format() }, { status: 400 });
    }

    // Rate Limiting
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.AUTH_REGISTER.name, ip);
    const rlResult = await rateLimit(rlKey, POLICIES.AUTH_REGISTER);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const user = await authService.register(parsed.data);
    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.message === "Email already registered") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
