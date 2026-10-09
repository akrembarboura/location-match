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
  // Always route client inquiries to LOC MAISON central support to protect platform commission
  const platformPhone = "21626574203";
  const periodLabel =
    options.period === "month" ? "mois" : options.period === "week" ? "semaine" : "nuit";

  const message = `Bonjour l'équipe LOC MAISON ! Je suis intéressé(e) par ce logement :

🏠 *${options.title}*
📍 Ville : ${options.city}
💰 Prix : ${options.price} DT / ${periodLabel}
🔗 Lien : ${options.propertyUrl}

Merci de m'aider à finaliser ma réservation !`;

  return `https://wa.me/${platformPhone}?text=${encodeURIComponent(message)}`;
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

export function generateClientConfirmationWhatsAppLink(phone?: string | null, clientName?: string, propertyTitle?: string): string {
  const normalizedPhone = normalizeTunisianWhatsAppNumber(phone);
  const title = propertyTitle ? ` (${propertyTitle})` : "";
  const name = clientName ? ` ${clientName}` : "";
  const message = `Bonjour${name},

Félicitations ! Votre réservation pour ce logement${title} est confirmée. Notre équipe prendra contact avec vous pour finaliser votre séjour.

Merci de votre confiance,
L'équipe LOC MAISON 🏠`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

