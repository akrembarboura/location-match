import { ReservationModel, PropertyModel, UserModel, OwnerModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import { RentalContractData } from "@/types/contract";

export class ContractService {
  /**
   * Fetches and formats contract data for a confirmed reservation.
   * Enforces role authorization (Owner, Customer, or Admin).
   */
  static async getContractData(
    reservationId: string,
    currentUser: { id: string; role: string }
  ): Promise<RentalContractData> {
    await connectToDatabase();

    const reservation = await ReservationModel.findOne({ id: reservationId }).lean().exec();
    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    const property = await PropertyModel.findOne({ id: reservation.propertyId }).lean().exec();
    if (!property) {
      throw new Error("PROPERTY_NOT_FOUND");
    }

    // Authorization Check
    const isOwner = property.ownerId === currentUser.id || reservation.ownerId === currentUser.id;
    const isCustomer = reservation.customerId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

    if (!isOwner && !isCustomer && !isAdmin) {
      throw new Error("FORBIDDEN");
    }

    // Fetch Owner User Info
    const ownerDoc = (await OwnerModel.findOne({ id: reservation.ownerId }).lean().exec()) ||
                     (await UserModel.findOne({ id: property.ownerId }).lean().exec());
    const ownerUser = await UserModel.findOne({
      $or: [{ id: property.ownerId }, { _id: ownerDoc?.userId || property.ownerId }]
    }).lean().exec();

    // Fetch Customer User Info if available
    const customerUser = reservation.customerId
      ? await UserModel.findOne({ id: reservation.customerId }).lean().exec()
      : null;

    const ownerName = ownerDoc?.name || (ownerUser ? `${ownerUser.firstName || ''} ${ownerUser.lastName || ''}`.trim() : "Propriétaire LOC MAISON");
    const ownerPhone = ownerDoc?.phone || ownerUser?.phone || "Non spécifié";
    const ownerEmail = ownerUser?.email || "contact@locmaison.tn";

    const customerName = reservation.customerName || (customerUser ? `${customerUser.firstName || ''} ${customerUser.lastName || ''}`.trim() : "Locataire LOC MAISON");
    const customerPhone = reservation.customerPhone || customerUser?.phone || "Non spécifié";
    const customerEmail = customerUser?.email || "Non spécifié";

    const checkInDate = new Date(reservation.checkIn);
    const checkOutDate = new Date(reservation.checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const formattedAddress = [
      property.location?.address,
      property.location?.city || property.city || "Mahdia",
      property.location?.governorate || property.governorate || "Mahdia",
      "Tunisie"
    ].filter(Boolean).join(", ");

    const contractId = `CONTRAT-${reservation.id}`;
    const issuedAt = new Date().toISOString();

    const standardTerms = [
      "Le bailleur donne en location saisonnière/étudiante au preneur le bien désigné ci-dessus.",
      "Le preneur s'engage à faire un usage paisible des lieux loués et à respecter le règlement d'occupation.",
      "Toute dégradation causée au logement sera à la charge financière exclusive du preneur.",
      "La restitution des clés s'effectuera au terme fixé lors du check-out en présence des deux parties.",
      "Ce document numérique est généré et certifié conforme via la plateforme LOC MAISON."
    ];

    return {
      contractId,
      issuedAt,
      reservationId: reservation.id,
      status: reservation.status || "CONFIRMED",
      rentalCategory: property.rentalCategory || "summer",
      owner: {
        id: property.ownerId,
        name: ownerName,
        phone: ownerPhone,
        email: ownerEmail
      },
      customer: {
        id: reservation.customerId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail
      },
      property: {
        id: property.id,
        title: property.title || "Logement LOC MAISON",
        propertyType: property.propertyType || "Appartement",
        address: formattedAddress,
        city: property.location?.city || property.city || "Mahdia",
        governorate: property.location?.governorate || property.governorate || "Mahdia",
        bedrooms: property.capacity?.bedrooms || property.bedrooms || 1,
        bathrooms: property.capacity?.bathrooms || property.bathrooms || 1,
        guests: reservation.guests || property.capacity?.guests || 1
      },
      dates: {
        checkIn: checkInDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        checkOut: checkOutDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        totalNights
      },
      pricing: {
        pricePerNight: reservation.pricing?.pricePerNight || 0,
        total: reservation.pricing?.total || 0,
        currency: reservation.pricing?.currency || "TND",
        paidAmount: reservation.paymentSummary?.paidAmount || 0,
        paymentStatus: reservation.paymentSummary?.status || "UNPAID"
      },
      terms: standardTerms
    };
  }
}
