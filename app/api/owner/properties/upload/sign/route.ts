import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOLDER = "location-match/properties";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";
const TRANSFORMATION = "c_limit,w_1600";

class ConfigError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

// Reads CLOUDINARY_URL and reports WHAT is wrong, never the value itself.
function readCloudinaryConfig() {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) throw new ConfigError("CLOUDINARY_URL_MISSING");

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ConfigError("CLOUDINARY_URL_MALFORMED");
  }
  if (
    parsed.protocol !== "cloudinary:" ||
    !parsed.username ||
    !parsed.password ||
    !parsed.hostname
  ) {
    throw new ConfigError("CLOUDINARY_URL_INCOMPLETE");
  }
  return {
    apiKey: parsed.username,
    apiSecret: parsed.password,
    cloudName: parsed.hostname,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireOwnerAccess();

    const ip = getClientIp(req);
    const rl = await rateLimit(
      generateRateLimitKey(POLICIES.OWNER_UPLOAD.name, user.id || ip),
      POLICIES.OWNER_UPLOAD
    );
    if (!rl.success) return rateLimitResponse(rl);

    const { apiKey, apiSecret, cloudName } = readCloudinaryConfig();

    const { v2: cloudinary } = await import("cloudinary");
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: FOLDER, allowed_formats: ALLOWED_FORMATS, transformation: TRANSFORMATION },
      apiSecret
    );

    return NextResponse.json(
      {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder: FOLDER,
        allowedFormats: ALLOWED_FORMATS,
        transformation: TRANSFORMATION,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;

    if (error instanceof ConfigError) {
      console.error("POST /api/owner/properties/upload/sign config error:", error.code);
      return NextResponse.json(
        {
          error: "Le service de photos est momentanément indisponible. Réessayez plus tard.",
          code: error.code,
        },
        { status: 503 }
      );
    }

    console.error(
      "POST /api/owner/properties/upload/sign error:",
      error instanceof Error ? error.stack : error
    );
    return NextResponse.json(
      { error: "Le service de photos est momentanément indisponible. Réessayez plus tard." },
      { status: 503 }
    );
  }
}