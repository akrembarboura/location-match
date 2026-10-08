import {
  PropertyModel,
  HouseModel,
  HousingRequestModel,
  UserModel,
} from "@/lib/models";
import connectToDatabase from "@/lib/mongoose";
import { analyticsRepository } from "./AnalyticsRepository";
import type {
  AdminAnalyticsOverview,
  PropertyPerformance,
  OwnerPropertyAnalytics,
} from "@/lib/analytics/types";
import { AuthorizationError } from "../utils/auth-guards";

export class AnalyticsService {
  private safeDivide(numerator: number, denominator: number): number {
    if (!denominator || denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 1000) / 10;
  }

  private getDateFilter(period: "7d" | "30d" | "90d" | "all"): { $gte?: Date } {
    if (period === "all") return {};
    const now = new Date();
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    return { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
  }

  async getAdminOverview(
    period: "7d" | "30d" | "90d" | "all" = "30d"
  ): Promise<AdminAnalyticsOverview> {
    await connectToDatabase();
    const dateFilter = this.getDateFilter(period);

    const requestQuery: any = {};
    if (dateFilter.$gte) requestQuery.createdAt = dateFilter;

    const [
      visitors,
      searches,
      propertyViews,
      totalRequests,
      allRequests,
      rawProperties,
      rawHouses,
      viewsMap,
      favsMap,
      searchedCities,
      ownerCtaClicks,
      ownerSignups,
    ] = await Promise.all([
      analyticsRepository.countUniqueVisitors(period),
      analyticsRepository.countEvents("search_performed", period),
      analyticsRepository.countEvents("property_viewed", period),
      HousingRequestModel.countDocuments(requestQuery),
      HousingRequestModel.find(requestQuery)
        .select("id propertyId selectedProperty proposedProperties destination area createdAt")
        .lean(),
      PropertyModel.find({})
        .select("id slug title city location propertyType type rentalCategory status isPublished availabilityStatus reservation isReserved")
        .lean(),
      HouseModel.find({})
        .select("id slug title city location propertyType type rentalCategory status isPublished availabilityStatus reservation isReserved")
        .lean(),
      analyticsRepository.getAllPropertyViewsMap(period),
      analyticsRepository.getAllPropertyFavoritesMap(),
      analyticsRepository.getSearchedCities(period),
      analyticsRepository.countEvents("owner_cta_clicked", period),
      UserModel.countDocuments({
        role: "OWNER",
        ...(dateFilter.$gte ? { createdAt: dateFilter } : {}),
      }),
    ]);

    // Merge properties from PropertyModel and any seed houses from HouseModel
    const allProperties = [
      ...rawProperties,
      ...rawHouses.filter(
        (h: any) => !rawProperties.some((p: any) => p.id === h.id || p.slug === h.slug)
      ),
    ];

    let totalProposals = 0;
    let acceptedProposals = 0;
    const propertyRequestCounts = new Map<string, number>();
    const propertyProposalCounts = new Map<string, number>();
    const propertyAcceptedCounts = new Map<string, number>();

    for (const req of allRequests as any[]) {
      const propId = req.propertyId || req.selectedProperty;
      if (propId) {
        propertyRequestCounts.set(propId, (propertyRequestCounts.get(propId) || 0) + 1);
      }

      if (Array.isArray(req.proposedProperties)) {
        for (const p of req.proposedProperties) {
          totalProposals++;
          if (p.propertyId) {
            propertyProposalCounts.set(
              p.propertyId,
              (propertyProposalCounts.get(p.propertyId) || 0) + 1
            );
          }
          if (p.status === "ACCEPTED") {
            acceptedProposals++;
            if (p.propertyId) {
              propertyAcceptedCounts.set(
                p.propertyId,
                (propertyAcceptedCounts.get(p.propertyId) || 0) + 1
              );
            }
          }
        }
      }
    }

    const reservedProperties = (allProperties as any[]).filter(
      (p) =>
        (p.availabilityStatus === "RESERVED" && p.reservation?.from && p.reservation?.to) ||
        p.isReserved
    );
    const totalReservations = reservedProperties.length;

    const propertyPerformances: PropertyPerformance[] = (allProperties as any[]).map((p) => {
      const pId = p.id;
      const pSlug = p.slug;
      const views =
        viewsMap.get(pId) || (pSlug ? viewsMap.get(pSlug) : 0) || 0;
      const favorites =
        favsMap.get(pId) || (pSlug ? favsMap.get(pSlug) : 0) || 0;
      const requests =
        (propertyRequestCounts.get(pId) || 0) +
        (pSlug && pSlug !== pId ? propertyRequestCounts.get(pSlug) || 0 : 0);
      const proposals =
        (propertyProposalCounts.get(pId) || 0) +
        (pSlug && pSlug !== pId ? propertyProposalCounts.get(pSlug) || 0 : 0);
      const accepted =
        (propertyAcceptedCounts.get(pId) || 0) +
        (pSlug && pSlug !== pId ? propertyAcceptedCounts.get(pSlug) || 0 : 0);
      const reservations =
        p.availabilityStatus === "RESERVED" || p.isReserved ? 1 : 0;

      return {
        propertyId: pId,
        title: p.title || `Bien ${pId}`,
        city: p.city || p.location?.city || "Mahdia",
        propertyType: p.propertyType || p.type || "Appartement",
        rentalCategory: p.rentalCategory || "summer",
        views,
        favorites,
        requests,
        proposals,
        acceptedProposals: accepted,
        reservations,
        conversionRates: {
          viewToRequest: this.safeDivide(requests, views),
          requestToProposal: this.safeDivide(proposals, requests),
          proposalToReservation: this.safeDivide(reservations, proposals),
          viewToReservation: this.safeDivide(reservations, views),
        },
      };
    });

    const topProperties = [...propertyPerformances]
      .sort((a, b) => b.views - a.views || b.requests - a.requests || b.reservations - a.reservations)
      .slice(0, 10);

    const lowConversionProperties = propertyPerformances
      .filter((p) => p.views >= 5 && p.conversionRates.viewToRequest < 10)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const destinationMap = new Map<
      string,
      { searches: number; requests: number; properties: number }
    >();

    for (const p of allProperties as any[]) {
      const city = p.city || p.location?.city || "Mahdia";
      const entry = destinationMap.get(city) || { searches: 0, requests: 0, properties: 0 };
      if (p.status === "PUBLISHED" || p.isPublished) {
        entry.properties++;
      }
      destinationMap.set(city, entry);
    }

    for (const s of searchedCities) {
      const entry = destinationMap.get(s.city) || { searches: 0, requests: 0, properties: 0 };
      entry.searches += s.count;
      destinationMap.set(s.city, entry);
    }

    for (const r of allRequests as any[]) {
      const dest = r.destination || r.area || "Mahdia";
      const entry = destinationMap.get(dest) || { searches: 0, requests: 0, properties: 0 };
      entry.requests++;
      destinationMap.set(dest, entry);
    }

    const demandVsSupplyDestinations = Array.from(destinationMap.entries()).map(
      ([city, data]) => {
        let gapNote = "Équilibre";
        if (data.searches > 10 && data.properties === 0) {
          gapNote = "Forte demande / Offre nulle";
        } else if (data.searches > data.properties * 5) {
          gapNote = "Demande supérieure à l'offre";
        } else if (data.properties > 5 && data.searches < 3) {
          gapNote = "Offre excédentaire";
        }

        return {
          city,
          searches: data.searches,
          requests: data.requests,
          availableProperties: data.properties,
          gapNote,
        };
      }
    );

    const propertiesCreated = allProperties.length;
    const propertiesSubmitted = (allProperties as any[]).filter(
      (p) => p.status !== "DRAFT"
    ).length;
    const propertiesApproved = (allProperties as any[]).filter(
      (p) => p.status === "PUBLISHED" || p.isPublished
    ).length;

    return {
      period,
      stats: {
        visitors,
        searches,
        propertyViews,
        requests: totalRequests,
        proposals: totalProposals,
        acceptedProposals,
        reservations: totalReservations,
      },
      customerFunnel: {
        visitors,
        searches,
        propertyViews,
        requests: totalRequests,
        proposals: totalProposals,
        reservations: totalReservations,
        conversions: {
          visitorToSearch: this.safeDivide(searches, visitors),
          searchToView: this.safeDivide(propertyViews, searches),
          viewToRequest: this.safeDivide(totalRequests, propertyViews),
          requestToProposal: this.safeDivide(totalProposals, totalRequests),
          proposalToReservation: this.safeDivide(totalReservations, totalProposals),
        },
      },
      ownerFunnel: {
        ctaClicks: ownerCtaClicks,
        signups: ownerSignups,
        propertiesCreated,
        propertiesSubmitted,
        propertiesApproved,
        conversions: {
          ctaToSignup: this.safeDivide(ownerSignups, ownerCtaClicks),
          signupToCreated: this.safeDivide(propertiesCreated, ownerSignups),
          createdToSubmitted: this.safeDivide(propertiesSubmitted, propertiesCreated),
          submittedToApproved: this.safeDivide(propertiesApproved, propertiesSubmitted),
        },
      },
      demandVsSupply: {
        destinations: demandVsSupplyDestinations,
      },
      topProperties,
      lowConversionProperties,
    };
  }

  async getPropertyPerformance(
    propertyId: string,
    period: "7d" | "30d" | "90d" | "all" = "all"
  ): Promise<PropertyPerformance | null> {
    await connectToDatabase();

    let property: any = await PropertyModel.findOne({
      $or: [{ id: propertyId }, { slug: propertyId }],
    }).lean();

    if (!property) {
      property = await HouseModel.findOne({
        $or: [{ id: propertyId }, { slug: propertyId }],
      }).lean();
    }

    if (!property) return null;

    const actualId = property.id;

    const [views, favorites, matchingRequests] = await Promise.all([
      analyticsRepository.getPropertyViews(actualId, period),
      analyticsRepository.getPropertyFavorites(actualId),
      HousingRequestModel.find({
        $or: [
          { propertyId: actualId },
          { propertyId: property.slug },
          { selectedProperty: actualId },
          { selectedProperty: property.slug },
          { "proposedProperties.propertyId": actualId },
          { "proposedProperties.propertyId": property.slug },
        ],
      }).lean(),
    ]);

    let requestsCount = 0;
    let proposalsCount = 0;
    let acceptedCount = 0;

    for (const req of matchingRequests as any[]) {
      if (
        req.propertyId === actualId ||
        req.selectedProperty === actualId ||
        req.propertyId === property.slug ||
        req.selectedProperty === property.slug
      ) {
        requestsCount++;
      }
      if (Array.isArray(req.proposedProperties)) {
        for (const p of req.proposedProperties) {
          if (p.propertyId === actualId || p.propertyId === property.slug) {
            proposalsCount++;
            if (p.status === "ACCEPTED") {
              acceptedCount++;
            }
          }
        }
      }
    }

    const reservationsCount =
      property.availabilityStatus === "RESERVED" &&
      property.reservation?.from &&
      property.reservation?.to
        ? 1
        : 0;

    return {
      propertyId: actualId,
      title: property.title,
      city: property.city || property.location?.city || "Mahdia",
      propertyType: property.propertyType,
      rentalCategory: property.rentalCategory,
      views,
      favorites,
      requests: requestsCount,
      proposals: proposalsCount,
      acceptedProposals: acceptedCount,
      reservations: reservationsCount,
      conversionRates: {
        viewToRequest: this.safeDivide(requestsCount, views),
        requestToProposal: this.safeDivide(proposalsCount, requestsCount),
        proposalToReservation: this.safeDivide(reservationsCount, proposalsCount),
        viewToReservation: this.safeDivide(reservationsCount, views),
      },
    };
  }

  async getOwnerPropertyPerformance(
    propertyId: string,
    authenticatedUser: { id: string; role: string }
  ): Promise<OwnerPropertyAnalytics> {
    await connectToDatabase();

    const property: any = await PropertyModel.findOne({
      $or: [{ id: propertyId }, { slug: propertyId }],
    }).lean();

    if (!property) {
      throw new Error("Bien introuvable.");
    }

    const isOwner = property.ownerId === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === "ADMIN" || authenticatedUser.role === "SUPER_ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AuthorizationError("Accès refusé. Vous n'êtes pas le propriétaire de ce bien.");
    }

    const perf = await this.getPropertyPerformance(property.id, "all");
    if (!perf) {
      throw new Error("Impossible de calculer la performance du bien.");
    }

    return {
      propertyId: perf.propertyId,
      title: perf.title,
      city: perf.city,
      views: perf.views,
      favorites: perf.favorites,
      requests: perf.requests,
      proposals: perf.proposals,
      reservations: perf.reservations,
      conversionRates: {
        viewToRequest: perf.conversionRates.viewToRequest,
        requestToReservation: perf.conversionRates.viewToReservation,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
