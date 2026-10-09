/**
 * Tunisian WhatsApp Contact & Social Sharing Utility
 */

export function normalizeTunisianWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "21626574203"; // Canonical LOC MAISON support number fallback
  const digits = phone.replace(/\D/g, "");

  // If phone starts with 216 and has 11 digits
  if (digits.startsWith("216") && digits.length === 11) {
    return digits;
  }
  // If 8 digits standard Tunisian phone (e.g. 20196546)
  if (digits.length === 8) {
    return `216${digits}`;
  }
  return "21626574203";
}

export interface PropertyWhatsAppOptions {
  title: string;
  city: string;
  price: number;
  period: string;
  propertyUrl: string;
  ownerPhone?: string | null;
}

export function generatePropertyWhatsAppLink(options: PropertyWhatsAppOptions): string {
  const phone = normalizeTunisianWhatsAppNumber(options.ownerPhone);
  const periodLabel =
    options.period === "month" ? "mois" : options.period === "week" ? "semaine" : "nuit";

  const message = `Bonjour ! Je suis intéressé(e) par votre logement publié sur LOC MAISON :

🏠 *${options.title}*
📍 Ville : ${options.city}
💰 Prix : ${options.price} DT / ${periodLabel}
🔗 Lien : ${options.propertyUrl}

Est-il toujours disponible ? Merci !`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function generateWhatsAppShareLink(options: PropertyWhatsAppOptions): string {
  const periodLabel =
    options.period === "month" ? "mois" : options.period === "week" ? "semaine" : "nuit";

  const message = `Découvrez ce logement à louer sur LOC MAISON :
🏠 *${options.title}* (${options.city})
💰 ${options.price} DT / ${periodLabel}
👉 Consulter l'annonce : ${options.propertyUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
