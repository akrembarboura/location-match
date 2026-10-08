import { describe, it, expect } from "vitest";
import { getPropertyImageUrl, PROPERTY_PLACEHOLDER_IMAGE } from "@/lib/constants/placeholders";

describe("Cloudinary Upload Hardening & Placeholders", () => {
  it("returns canonical placeholder URL when image URL is missing or invalid", () => {
    expect(getPropertyImageUrl("")).toBe(PROPERTY_PLACEHOLDER_IMAGE);
    expect(getPropertyImageUrl(null)).toBe(PROPERTY_PLACEHOLDER_IMAGE);
    expect(getPropertyImageUrl(undefined)).toBe(PROPERTY_PLACEHOLDER_IMAGE);
    expect(getPropertyImageUrl("   ")).toBe(PROPERTY_PLACEHOLDER_IMAGE);
  });

  it("returns clean valid image URL when provided", () => {
    const validUrl = "https://res.cloudinary.com/test/image/upload/v1/property-1.jpg";
    expect(getPropertyImageUrl(validUrl)).toBe(validUrl);
  });
});

