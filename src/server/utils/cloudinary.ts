import type { UploadApiResponse } from "cloudinary";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  format?: string;
  height?: number;
}

let configured = false;

async function getCloudinary() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (!url || !url.startsWith("cloudinary://")) {
    // Checked BEFORE loading the SDK, which throws at import on a bad value.
    throw new Error("CLOUDINARY_URL is missing or invalid");
  }
  const { v2: cloudinary } = await import("cloudinary");
  if (!configured) {
    cloudinary.config({ secure: true });
    configured = true;
  }
  return cloudinary;
}

/**
 * Uploads a file buffer to Cloudinary in the "location-match/properties" folder.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: { folder?: string; publicIdPrefix?: string } = {}
): Promise<CloudinaryUploadResult> {
  const folder = options.folder || "location-match/properties";
  const cloudinary = await getCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }, { width: 1600, crop: "limit" }],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("Cloudinary upload error:", error?.message);
          return reject(new Error("Échec du téléversement de l'image vers Cloudinary."));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}
