import { jsPDF } from "jspdf";
import { RentalContractData } from "@/types/contract";

export function generateRentalContractPDF(contract: RentalContractData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Primary Dark Navy (#0f172a)
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("LOC MAISON", 15, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CONTRAT DE LOCATION NUMÉRIQUE", pageWidth - 15, 14, { align: "right" });

  y = 34;

  // Title & Reference
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const categoryLabel = contract.rentalCategory === "student" ? "ÉTUDIANTE" : "SAISONNIÈRE";
  doc.text(`CONTRAT DE LOCATION ${categoryLabel}`, 15, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Gray slate
  doc.text(`Réf. Contrat: ${contract.contractId}  |  Émis le: ${new Date(contract.issuedAt).toLocaleDateString("fr-FR")}`, 15, y);

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, pageWidth - 15, y);

  y += 8;

  // Section Helper
  const renderSectionHeader = (title: string, currentY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, pageWidth - 30, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), 18, currentY + 5);
    return currentY + 11;
  };

  // 1. LES PARTIES
  y = renderSectionHeader("1. Identification des Parties", y);

  const colWidth = (pageWidth - 36) / 2;
  
  // Owner Card
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, colWidth, 26, 2, 2, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("LE BAILLEUR (Propriétaire)", 19, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Nom: ${contract.owner.name}`, 19, y + 12);
  doc.text(`Tél: ${contract.owner.phone || "Non spécifié"}`, 19, y + 17);
  doc.text(`Email: ${contract.owner.email || "Non spécifié"}`, 19, y + 22);

  // Customer Card
  doc.roundedRect(15 + colWidth + 6, y, colWidth, 26, 2, 2, "D");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("LE PRENEUR (Locataire)", 19 + colWidth + 6, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Nom: ${contract.customer.name}`, 19 + colWidth + 6, y + 12);
  doc.text(`Tél: ${contract.customer.phone || "Non spécifié"}`, 19 + colWidth + 6, y + 17);
  doc.text(`Email: ${contract.customer.email || "Non spécifié"}`, 19 + colWidth + 6, y + 22);

  y += 32;

  // 2. DÉSIGNATION DU BIEN LOUÉ
  y = renderSectionHeader("2. Désignation des Lieux Loués", y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Logement: ${contract.property.title}`, 18, y);
  
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Type de bien: ${contract.property.propertyType}`, 18, y);
  doc.text(`Adresse: ${contract.property.address}`, 18, y + 5);
  doc.text(`Capacité: ${contract.property.bedrooms} chambre(s), ${contract.property.bathrooms} salle(s) de bain (${contract.property.guests} pers. max)`, 18, y + 10);

  y += 18;

  // 3. DURÉE ET DATES DU BAIL
  y = renderSectionHeader("3. Durée et Dates du Séjour", y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Date d'arrivée (Check-in): ${contract.dates.checkIn}`, 18, y);
  doc.text(`Date de départ (Check-out): ${contract.dates.checkOut}`, 18, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`Durée totale: ${contract.dates.totalNights} nuit(s)`, 18, y + 10);

  y += 18;

  // 4. CONDITIONS FINANCIÈRES
  y = renderSectionHeader("4. Conditions Financières & Règlement", y);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Loyer / Nuitée: ${contract.pricing.pricePerNight} ${contract.pricing.currency}`, 19, y + 6);
  doc.text(`Montant Total: ${contract.pricing.total} ${contract.pricing.currency}`, 19, y + 12);
  
  const paymentBadge = contract.pricing.paymentStatus === "PAID" ? "RÉGLÉ EN TOTALITÉ" : contract.pricing.paymentStatus === "PARTIALLY_PAID" ? "ACOMPTE PAYÉ" : "PAYABLE SUR PLACE";
  doc.setFont("helvetica", "bold");
  doc.text(`Statut du Règlement: ${paymentBadge} (${contract.pricing.paidAmount} ${contract.pricing.currency} perçus)`, 19, y + 18);

  y += 28;

  // 5. CLAUSES DU CONTRAT
  y = renderSectionHeader("5. Engagements et Conditions Générales", y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  contract.terms.forEach((term) => {
    doc.text(`• ${term}`, 18, y);
    y += 5;
  });

  y += 6;

  // 6. SIGNATURES & STAMP
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y, colWidth, 32, 2, 2, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("SIGNATURE DU BAILLEUR", 19, y + 6);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Signé numériquement via LOC MAISON", 19, y + 26);

  doc.roundedRect(15 + colWidth + 6, y, colWidth, 32, 2, 2, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("SIGNATURE DU PRENEUR", 19 + colWidth + 6, y + 6);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Signé numériquement via LOC MAISON", 19 + colWidth + 6, y + 26);

  // Footer stamp
  y += 38;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Document officiel généré par LOC MAISON Tunisie - Portail d'Hébergement & Location Saisonnier", pageWidth / 2, y, { align: "center" });

  return doc;
}

export function downloadRentalContractPDF(contract: RentalContractData) {
  const doc = generateRentalContractPDF(contract);
  doc.save(`Contrat_Location_${contract.contractId}.pdf`);
}
