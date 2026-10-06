import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAccess } from "@/server/utils/auth-guards";
import { ownerAuthErrorResponse } from "@/server/utils/owner-api-errors";
import { uploadToCloudinary } from "@/server/utils/cloudinary";
import { getClientIp } from "@/server/utils/client-ip";
import { generateRateLimitKey } from "@/server/rate-limit/key";
import { POLICIES } from "@/server/rate-limit/policies";
import { rateLimit, rateLimitResponse } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const user = await requireOwnerAccess();

    // Rate Limiting
    const ip = getClientIp(req);
    const rlKey = generateRateLimitKey(POLICIES.WRITE_API.name, user.id || ip);
    const rlResult = await rateLimit(rlKey, POLICIES.WRITE_API);
    if (!rlResult.success) {
      return rateLimitResponse(rlResult);
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const allFiles: File[] = [];
    if (files && files.length > 0) {
      allFiles.push(...files);
    } else if (singleFile) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Aucun fichier d'image fourni." }, { status: 400 });
    }

    if (allFiles.length > 10) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas envoyer plus de 10 photos à la fois." },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non supporté (${file.type}). Utilisez JPEG, PNG ou WEBP.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `L'image "${file.name}" dépasse la taille maximale autorisée (5 Mo).` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await uploadToCloudinary(buffer, {
        folder: "location-match/properties",
      });

      uploadedImages.push({
        id: `img-${Date.now()}-${i}`,
        url: result.url,
        publicId: result.publicId,
        alt: file.name.replace(/\.[^/.]+$/, ""),
        sortOrder: i,
        position: i,
        width: result.width,
        height: result.height,
      });
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    });
  } catch (error: any) {
    const res = ownerAuthErrorResponse(error);
    if (res) return res;

    console.error("POST /api/owner/properties/upload error:", error?.message || error);
    
    // Return a safe generic error response without exposing system trace
    return NextResponse.json(
      { error: "Erreur lors du téléversement des images. Veuillez vérifier votre configuration et réessayer." },
      { status: 500 }
    );
  }
}
