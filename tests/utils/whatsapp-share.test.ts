import { describe, it, expect } from "vitest";
import {
  normalizeTunisianWhatsAppNumber,
  generatePropertyWhatsAppLink,
  generateWhatsAppShareLink,
} from "@/lib/utils/whatsapp-share";

describe("Tunisian WhatsApp Contact & Social Sharing Utility", () => {
  it("normalizes various valid Tunisian phone numbers to 216XXXXXXXX format", () => {
    expect(normalizeTunisianWhatsAppNumber("20196546")).toBe("21620196546");
    expect(normalizeTunisianWhatsAppNumber("+216 20 196 546")).toBe("21620196546");
    expect(normalizeTunisianWhatsAppNumber("21620196546")).toBe("21620196546");
    expect(normalizeTunisianWhatsAppNumber(null)).toBe("21626574203");
  });

  it("generates direct WhatsApp pre-filled contact link with property details", () => {
    const link = generatePropertyWhatsAppLink({
      title: "Dar S+2 Mahdia",
      city: "Mahdia",
      price: 600,
      period: "month",
      propertyUrl: "http://localhost:3000/houses/dar-s2-mahdia",
      ownerPhone: "20196546",
    });

    expect(link).toContain("https://wa.me/21626574203?text=");
    expect(decodeURIComponent(link)).toContain("Dar S+2 Mahdia");
    expect(decodeURIComponent(link)).toContain("600 DT / mois");
    expect(decodeURIComponent(link)).toContain("http://localhost:3000/houses/dar-s2-mahdia");
  });

  it("generates WhatsApp share link for group and friend sharing", () => {
    const link = generateWhatsAppShareLink({
      title: "Appartement S+1 Mahdia",
      city: "Mahdia",
      price: 120,
      period: "night",
      propertyUrl: "http://localhost:3000/houses/appartement-s1-mahdia",
    });

    expect(link).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(link)).toContain("Appartement S+1 Mahdia");
    expect(decodeURIComponent(link)).toContain("120 DT / nuit");
  });
});
