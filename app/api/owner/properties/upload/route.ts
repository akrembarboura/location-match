import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { uploadToCloudinary, deleteFromCloudinary } from "@/server/utils/cloudinary";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILES = 10;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel body limit is ~4.5 MB)

/** Detect real image type from the first bytes (the browser-provided type is not trusted). */
function detectImageType(buf: Buffer): "jpeg" | "png" | "webp" | "avif" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 12) === "ftypavif") return "avif";
  return null;
}

export async function POST(req: NextRequest) {
  const uploadedIds: string[] = [];

  try {
    const user = await requireOwnerAccess();

    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.WRITE_API.name, user.id || ip);
    const rlResult = await rateLimit(rlKey, POLICIES.WRITE_API);
    if (!rlResult.success) return rateLimitResponse(rlResult);

    // Reject oversized bodies before parsing them
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_FILE_SIZE * MAX_FILES + 1024 * 1024) {
      return NextResponse.json({ error: "Envoi trop volumineux." }, { status: 413 });
    }

    const formData = await req.formData();
    const entries = [...formData.getAll("files"), formData.get("file")];
    const allFiles = entries.filter((e): e is File => e instanceof File && e.size > 0);

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Aucun fichier d'image fourni." }, { status: 400 });
    }
    if (allFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Vous ne pouvez pas envoyer plus de ${MAX_FILES} photos à la fois.` },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];

      if (file.size > MAX_FILE_SIZE) {
        return await failWithCleanup(
          uploadedIds,
          NextResponse.json({ error: "Une image dépasse la taille maximale autorisée (4 Mo)." }, { status: 400 })
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (!detectImageType(buffer)) {
        return await failWithCleanup(
          uploadedIds,
          NextResponse.json(
            { error: "Format non supporté. Utilisez des images JPEG, PNG, WEBP ou AVIF." },
            { status: 400 }
          )
        );
      }

      const result = await uploadToCloudinary(buffer, { folder: "location-match/properties" });
      uploadedIds.push(result.publicId);

      uploadedImages.push({
        id: `img-${randomUUID()}`,
        url: result.url,
        publicId: result.publicId,
        alt: file.name.replace(/\.[^/.]+$/, "").slice(0, 120),
        sortOrder: i,
        position: i,
        width: result.width,
        height: result.height,
      });
    }

    return NextResponse.json({ success: true, images: uploadedImages });
  } catch (error: any) {
    await cleanup(uploadedIds);

    const res = ownerAuthErrorResponse(error);
    if (res) return res;

    console.error("POST /api/owner/properties/upload error:", error?.message || error);

    if (String(error?.message).includes("CLOUDINARY_URL")) {
      return NextResponse.json(
        { error: "Le service de photos est momentanément indisponible. Réessayez plus tard." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors du téléversement des images. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

async function cleanup(publicIds: string[]) {
  await Promise.allSettled(publicIds.map((id) => deleteFromCloudinary(id)));
}

async function failWithCleanup(publicIds: string[], response: NextResponse) {
  await cleanup(publicIds);
  return response;
}
