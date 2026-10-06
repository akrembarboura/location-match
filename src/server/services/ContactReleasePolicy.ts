/**
 * Centralized Contact Release Policy for LOC MAISON.
 * Single source of truth for owner customer contact information visibility.
 *
 * Rules:
 * An owner may view a customer's direct contact channels (phone, email) ONLY when:
 * 1. The owner is authorized (owns the property associated with the reservation).
 * 2. The reservation status is CONFIRMED or COMPLETED.
 * 3. The payment status is validated (PAID, PARTIALLY_PAID, REPORTED, or paidAmount > 0).
 */

export type ContactVisibilityReason =
  | "UNAUTHORIZED"
  | "RESERVATION_NOT_CONFIRMED"
  | "PAYMENT_NOT_VALIDATED"
  | "CONTACT_AVAILABLE"
  | "ADMIN_OVERRIDE";

export type ContactVisibilityResult = {
  visible: boolean;
  contactVisibility: "RELEASED" | "HIDDEN";
  reason: ContactVisibilityReason;
};

export class ContactReleasePolicy {
  /**
   * Evaluates server-side whether customer contact channels can be released to an owner.
   */
  static evaluate(input: {
    reservationStatus?: string;
    paymentStatus?: string;
    paidAmount?: number;
    isAuthorizedOwner?: boolean;
    hasAdminOverride?: boolean;
  }): ContactVisibilityResult {
    // 1. Authorization check
    if (input.isAuthorizedOwner === false) {
      return {
        visible: false,
        contactVisibility: "HIDDEN",
        reason: "UNAUTHORIZED",
      };
    }

    // 2. Admin Override check
    if (input.hasAdminOverride) {
      return {
        visible: true,
        contactVisibility: "RELEASED",
        reason: "ADMIN_OVERRIDE",
      };
    }

    // 3. Reservation state check
    const isConfirmed = input.reservationStatus === "CONFIRMED" || input.reservationStatus === "COMPLETED";
    if (!isConfirmed) {
      return {
        visible: false,
        contactVisibility: "HIDDEN",
        reason: "RESERVATION_NOT_CONFIRMED",
      };
    }

    // 4. Payment state check (PAID, VERIFIED, CONFIRMED or paidAmount > 0)
    const isPaymentValidated =
      input.paymentStatus === "PAID" ||
      input.paymentStatus === "VERIFIED" ||
      input.paymentStatus === "CONFIRMED" ||
      (input.paidAmount || 0) > 0;

    if (!isPaymentValidated) {
      return {
        visible: false,
        contactVisibility: "HIDDEN",
        reason: "PAYMENT_NOT_VALIDATED",
      };
    }

    return {
      visible: true,
      contactVisibility: "RELEASED",
      reason: "CONTACT_AVAILABLE",
    };
  }
}
