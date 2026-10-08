import { AUTH_CONFIG } from "../config/auth";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private isProduction = process.env.NODE_ENV === "production";
  private resendApiKey = process.env.RESEND_API_KEY;
  private fromEmail = process.env.EMAIL_FROM || "LOC MAISON <noreply@locmaison.tn>";

  /**
   * Core email transmission method.
   * Uses Resend API when RESEND_API_KEY is configured, or logs formatted message in dev/testing mode.
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string }> {
    const { to, subject, html, text } = options;

    if (this.resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.resendApiKey}`,
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: [to],
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ""),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return { success: true, id: data.id };
        } else {
          const errText = await res.text();
          console.error("[EMAIL_SERVICE] Resend API error:", errText);
        }
      } catch (err) {
        console.error("[EMAIL_SERVICE] Failed to transmit email:", err);
      }
    }

    // Fallback / Development logging mode
    console.log("==========================================");
    console.log(`[EMAIL_SERVICE LOG] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("------------------------------------------");
    console.log(text || html.replace(/<[^>]*>?/gm, ""));
    console.log("==========================================");

    return { success: true, id: `dev-${Date.now()}` };
  }

  /**
   * Password Reset Email Template
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const subject = "Réinitialisation de votre mot de passe — LOC MAISON";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
          <h1 style="color: #059669; margin: 0; font-size: 24px;">LOC MAISON</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Plateforme de location immobilière en Tunisie</p>
        </div>
        
        <div style="padding: 24px 0;">
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Demande de réinitialisation de mot de passe</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Vous avez demandé la réinitialisation du mot de passe associé à votre compte LOC MAISON. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #059669; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block; font-size: 15px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité. Votre mot de passe restera inchangé.
          </p>
          <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
            Lien direct : <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; color: #9ca3af; font-size: 12px;">
          &copy; ${new Date().getFullYear()} LOC MAISON. Tous droits réservés.
        </div>
      </div>
    `;

    const res = await this.sendEmail({ to, subject, html });
    return res.success;
  }

  /**
   * Rental Request Confirmation Email Template
   */
  async sendRentalRequestConfirmation(
    to: string,
    requestId: string,
    details: { rentalCategory: string; city: string; maxBudget?: number }
  ): Promise<boolean> {
    const subject = `Confirmation de votre demande de location (#${requestId}) — LOC MAISON`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
          <h1 style="color: #059669; margin: 0; font-size: 24px;">LOC MAISON</h1>
        </div>
        
        <div style="padding: 24px 0;">
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Votre demande de recherche a été publiée !</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Nous avons bien enregistré votre demande de location <strong>${details.rentalCategory === "STUDENT" ? "Étudiante" : "Estivale"}</strong> à <strong>${details.city}</strong>.
          </p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #374151;"><strong>N° de référence :</strong> ${requestId}</p>
            <p style="margin: 0 0 8px 0; color: #374151;"><strong>Ville :</strong> ${details.city}</p>
            ${details.maxBudget ? `<p style="margin: 0; color: #374151;"><strong>Budget max :</strong> ${details.maxBudget} DT / mois</p>` : ""}
          </div>
          
          <p style="color: #374151; font-size: 14px;">
            Les propriétaires correspondant à votre recherche seront informés et pourront vous proposer des logements adaptés.
          </p>
        </div>
      </div>
    `;

    const res = await this.sendEmail({ to, subject, html });
    return res.success;
  }
}

export const emailService = new EmailService();
