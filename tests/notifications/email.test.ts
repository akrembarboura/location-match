import { describe, it, expect, vi } from "vitest";
import { emailService } from "@/server/notifications/email.service";

describe("Transactional Email Notification System", () => {
  it("logs formatted email payload in development/fallback mode", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    const result = await emailService.sendEmail({
      to: "test@example.tn",
      subject: "Test Notification",
      html: "<p>Welcome to LOC MAISON</p>",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("test@example.tn"));
    consoleSpy.mockRestore();
  });

  it("renders and transmits password reset email template", async () => {
    const result = await emailService.sendPasswordResetEmail(
      "user@example.tn",
      "http://localhost:3000/reset-password?token=test12345"
    );

    expect(result).toBe(true);
  });

  it("renders and transmits rental request confirmation template", async () => {
    const result = await emailService.sendRentalRequestConfirmation(
      "student@esprit.tn",
      "REQ-123456",
      {
        rentalCategory: "STUDENT",
        city: "Mahdia",
        maxBudget: 600,
      }
    );

    expect(result).toBe(true);
  });
});
