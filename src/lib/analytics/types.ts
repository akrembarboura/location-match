import type { AnalyticsEventName } from "@/lib/models";

export type { AnalyticsEventName };

export type ActorType = "ANONYMOUS" | "CUSTOMER" | "OWNER" | "ADMIN";

export interface AnalyticsEventPayload {
  eventName: AnalyticsEventName;
  propertyId?: string;
  rentalCategory?: string;
  propertyType?: string;
  city?: string;
  anonymousId?: string;
  sessionId?: string;
  userId?: string;
  actorType?: ActorType;
  properties?: Record<string, unknown>;
  occurredAt?: string | Date;
}

export interface PropertyPerformance {
  propertyId: string;
  title: string;
  city: string;
  propertyType?: string;
  rentalCategory?: string;
  views: number;
  favorites: number;
  requests: number;
  proposals: number;
  acceptedProposals: number;
  reservations: number;
  conversionRates: {
    viewToRequest: number;        // (requests / views) * 100
    requestToProposal: number;    // (proposals / requests) * 100
    proposalToReservation: number;// (reservations / proposals) * 100
    viewToReservation: number;    // (reservations / views) * 100
  };
}

export interface AdminAnalyticsOverview {
  period: "7d" | "30d" | "90d" | "all";
  stats: {
    visitors: number;
    searches: number;
    propertyViews: number;
    requests: number;
    proposals: number;
    acceptedProposals: number;
    reservations: number;
  };
  customerFunnel: {
    visitors: number;
    searches: number;
    propertyViews: number;
    requests: number;
    proposals: number;
    reservations: number;
    conversions: {
      visitorToSearch: number;
      searchToView: number;
      viewToRequest: number;
      requestToProposal: number;
      proposalToReservation: number;
    };
  };
  ownerFunnel: {
    ctaClicks: number;
    signups: number;
    propertiesCreated: number;
    propertiesSubmitted: number;
    propertiesApproved: number;
    conversions: {
      ctaToSignup: number;
      signupToCreated: number;
      createdToSubmitted: number;
      submittedToApproved: number;
    };
  };
  demandVsSupply: {
    destinations: Array<{
      city: string;
      searches: number;
      requests: number;
      availableProperties: number;
      gapNote?: string;
    }>;
  };
  topProperties: PropertyPerformance[];
  lowConversionProperties: PropertyPerformance[];
}

export interface OwnerPropertyAnalytics {
  propertyId: string;
  title: string;
  city: string;
  views: number;
  favorites: number;
  requests: number;
  proposals: number;
  reservations: number;
  conversionRates: {
    viewToRequest: number;
    requestToReservation: number;
  };
}
