import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// Initialize Cloudinary with environment variables
if (process.env.CLOUDINARY_URL) {
  // cloudinary automatically reads CLOUDINARY_URL, but we ensure it's explicitly parsed
  cloudinary.config();
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Uploads a file buffer to Cloudinary in the "location-match/properties" folder.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    publicIdPrefix?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  const folder = options.folder || "location-match/properties";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1600, crop: "limit" },
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("Cloudinary upload error:", error);
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

