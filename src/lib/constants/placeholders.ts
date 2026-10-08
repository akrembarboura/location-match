/**
 * Standard Fallback Placeholders for LOC MAISON
 * Used whenever a property has no images uploaded or a broken image URL.
 */

export const PROPERTY_PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/demo/image/upload/v1680000000/location-match/placeholder-property.jpg";

export const USER_AVATAR_PLACEHOLDER =
  "https://res.cloudinary.com/demo/image/upload/v1680000000/location-match/default-avatar.png";

/**
 * Returns a valid image URL or falls back to the canonical property placeholder.
 */
export function getPropertyImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return PROPERTY_PLACEHOLDER_IMAGE;
  }
  return url.trim();
}

