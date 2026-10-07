export type UploadedImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // Cloudinary's free-plan image limit

export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  const results: UploadedImage[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error("Format non supporté.");
    if (file.size > MAX_FILE_BYTES) throw new Error("Une image dépasse 10 Mo.");

    // 1) Ask our server for a signature (owner-only)
    const signRes = await fetch("/api/owner/properties/upload/sign", {
      method: "POST",
      credentials: "include",
    });
    if (!signRes.ok) throw new Error("Impossible de préparer l'envoi. Réessayez.");
    const s = await signRes.json();

    // 2) Upload straight to Cloudinary
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", s.apiKey);
    form.append("timestamp", String(s.timestamp));
    form.append("signature", s.signature);
    form.append("folder", s.folder);
    form.append("allowed_formats", s.allowedFormats);
    form.append("transformation", s.transformation);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.secure_url) {
      // Cloudinary's message is for debugging only; users get a friendly text
      console.error("Cloudinary direct upload failed:", data?.error?.message);
      throw new Error("L'envoi de la photo a échoué. Réessayez avec une autre image.");
    }

    results.push({
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    });
  }
  return results;
}