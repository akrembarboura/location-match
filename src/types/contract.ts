export interface RentalContractData {
  contractId: string;
  issuedAt: string;
  reservationId: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  rentalCategory: "summer" | "student" | string;
  owner: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  };
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  };
  property: {
    id: string;
    title: string;
    propertyType: string;
    address: string;
    city: string;
    governorate: string;
    bedrooms: number;
    bathrooms: number;
    guests: number;
  };
  dates: {
    checkIn: string;
    checkOut: string;
    totalNights: number;
  };
  pricing: {
    pricePerNight: number;
    total: number;
    currency: string;
    paidAmount: number;
    paymentStatus: string;
  };
  terms: string[];
}
