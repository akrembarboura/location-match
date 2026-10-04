import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { propertyService } from "@/server/services/PropertyService";
import { CreateOwnerPropertySchema } from "@/server/validations/property";
import { OwnerModel, UserModel } from "@/lib/models";
import { signJwtToken } from "@/server/utils/auth";
import { setSessionCookie } from "@/server/utils/session-cookie";
import crypto from "crypto";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.AUTHENTICATED_API.name, ip, user.id);
    const rlResult = await rateLimit(rlKey, POLICIES.AUTHENTICATED_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    if (user.role === "CUSTOMER") {
      return NextResponse.json([]);
    }
    const properties = await propertyService.getOwnerProperties(user.id);
    return NextResponse.json(properties);
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    console.error("GET /api/owner/properties error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ownerId is always derived from the session; unknown keys (ownerId, status…) are stripped by Zod.
    const user = await requireAuth();
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.MUTATION.name, ip, user.id);
    const rlResult = await rateLimit(rlKey, POLICIES.MUTATION);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const body = await req.json();

    const parsed = CreateOwnerPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation échouée", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (user.role === "CUSTOMER") {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      const ownerDoc = await OwnerModel.findOne({
        $or: [{ userId: user.id }, { id: user.id }],
      });
      if (!ownerDoc) {
        await OwnerModel.create({
          id: `OWNER-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
          userId: user.id,
          name,
          phone: user.phone || "—",
          area: parsed.data.area || "Mahdia",
          properties: 1,
          since: new Date().getFullYear().toString(),
        });
      }
      await UserModel.updateOne({ id: user.id }, { $set: { role: "OWNER" } });
      const created = await propertyService.createOwnerProperty(parsed.data, user.id);
      const newToken = await signJwtToken({ sub: user.id, role: "OWNER", email: user.email });
      await setSessionCookie(newToken);
      return NextResponse.json(created, { status: 201 });
    }

    const created = await propertyService.createOwnerProperty(parsed.data, user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;
    console.error("POST /api/owner/properties error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du bien." },
      { status: 400 }
    );
  }
}
