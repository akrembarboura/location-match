import { requestRepository } from "../repositories/RequestRepository";
import { propertyRepository } from "../repositories/PropertyRepository";
import { HouseModel } from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import type { CreateRentalRequestInput } from "@/lib/rentals/request-schema";
import { normalizeTunisianPhone } from "@/lib/rentals/request-schema";
import crypto from "crypto";

export class RequestService {
  /**
   * Generates a clean, readable reference code e.g. "REQ-2026-7B2F"
   */
  private generateReferenceId(): string {
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `REQ-${year}-${rand}`;
  }

  async createRequest(input: CreateRentalRequestInput, customerId?: string) {
    const id = this.generateReferenceId();
    const phone = normalizeTunisianPhone(input.phone) || input.phone;

    const data: any = {
      id,
      customerId: customerId || undefined,
      customer: {
        fullName: input.fullName,
        phone,
      },
      rentalCategory: input.rentalCategory,
      destination: input.destination,
      amenities: input.amenities || [],
      status: "PENDING",
      proposedProperties: [],
    };

    if (input.rentalCategory === "summer") {
      data.area = input.area;
      data.flexibleLocation = Boolean(input.flexibleLocation);
      data.propertyType = input.propertyType;
      data.bedrooms = input.bedrooms;
      data.checkIn = input.checkIn;
      data.checkOut = input.checkOut;
      data.guests = input.guests;
      data.budget = input.budget;
      data.budgetPeriod = input.budgetPeriod || "week";
      // Legacy fields for backward compatibility
      data.kind = "summer";
      data.people = input.guests;
      data.customer_name = input.fullName;
    } else {
      data.university = input.university;
      data.checkIn = input.checkIn;
      data.checkOut = input.checkOut;
      data.guests = input.students;
      data.budget = input.budget;
      data.budgetPeriod = input.budgetPeriod || "month";
      data.propertyType = input.propertyType;
      data.genderPreference = input.genderPreference;
      // Legacy fields
      data.kind = "student";
      data.people = input.students;
    }

    const doc = await requestRepository.create(data);

    return {
      id: doc.id,
      fullName: doc.customer?.fullName,
      destination: doc.destination,
      area: doc.area,
      budgetPeriod: doc.budgetPeriod,
      rentalCategory: doc.rentalCategory,
      checkIn: doc.checkIn,
      checkOut: doc.checkOut,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  }

  async getClientRequest(id: string) {
    const req = await requestRepository.findById(id);
    if (!req) return null;

    // Populate proposed houses with real photos, titles, slugs
    await connectToDatabase();
    const populatedProposals = await Promise.all(
      (req.proposedProperties || []).map(async (p: any) => {
        const house = await HouseModel.findOne({
          $or: [{ id: p.propertyId }, { slug: p.propertyId }],
        }).lean();

        return {
          propertyId: p.propertyId,
          proposedPrice: p.proposedPrice,
          checkIn: p.checkIn,
          checkOut: p.checkOut,
          adminMessage: p.adminMessage,
          status: p.status,
          createdAt: p.createdAt,
          house: house
            ? {
                id: house.id,
                title: house.title,
                slug: house.slug,
                location: house.location,
                city: house.city,
                pricePerNight: house.pricePerNight,
                bedrooms: house.bedrooms,
                bathrooms: house.bathrooms,
                coverImage: house.images?.[0]?.url || null,
                images: (house.images || []).map((img: any) => img.url),
              }
            : null,
        };
      })
    );

    // Strip internal adminNotes from client view
    return {
      id: req.id,
      customer: {
        fullName: req.customer?.fullName || req.customer,
        phone: req.customer?.phone || req.phone,
      },
      rentalCategory: req.rentalCategory || req.kind,
      destination: req.destination || req.area,
      area: req.area,
      flexibleLocation: req.flexibleLocation,
      propertyType: req.propertyType,
      checkIn: req.checkIn || req.period,
      checkOut: req.checkOut,
      guests: req.guests || req.people,
      bedrooms: req.bedrooms,
      budget: req.budget,
      budgetPeriod: req.budgetPeriod,
      amenities: req.amenities || req.preferences || [],
      university: req.university,
      genderPreference: req.genderPreference,
      status: req.status || req.stage || "PENDING",
      proposedProperties: populatedProposals,
      selectedProperty: req.selectedProperty,
      createdAt: req.createdAt,
    };
  }

  async getAdminRequest(id: string) {
    const req = await requestRepository.findById(id);
    if (!req) return null;

    await connectToDatabase();
    const populatedProposals = await Promise.all(
      (req.proposedProperties || []).map(async (p: any) => {
        const house = await HouseModel.findOne({
          $or: [{ id: p.propertyId }, { slug: p.propertyId }],
        }).lean();

        return {
          propertyId: p.propertyId,
          proposedPrice: p.proposedPrice,
          checkIn: p.checkIn,
          checkOut: p.checkOut,
          adminMessage: p.adminMessage,
          status: p.status,
          createdAt: p.createdAt,
          house: house
            ? {
                id: house.id,
                title: house.title,
                slug: house.slug,
                city: house.city,
                pricePerNight: house.pricePerNight,
                coverImage: house.images?.[0]?.url || null,
              }
            : null,
        };
      })
    );

    return {
      ...req,
      proposedProperties: populatedProposals,
    };
  }

  async getAdminRequests(filters?: any) {
    return await requestRepository.findAll(filters);
  }

  async updateRequestStatus(id: string, status: string, adminNotes?: string) {
    return await requestRepository.updateStatus(id, status, adminNotes);
  }

  async addProposal(
    id: string,
    proposal: {
      propertyId: string;
      proposedPrice?: number;
      checkIn?: string;
      checkOut?: string;
      adminMessage?: string;
    }
  ) {
    return await requestRepository.addProposal(id, proposal);
  }

  async respondToProposal(
    requestId: string,
    propertyId: string,
    action: "ACCEPTED" | "REJECTED"
  ) {
    return await requestRepository.updateProposalStatus(requestId, propertyId, action);
  }
}

export const requestService = new RequestService();
