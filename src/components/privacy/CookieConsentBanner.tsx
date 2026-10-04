"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import {
  getConsentStatus,
  setConsentStatus,
  type ConsentStatus,
} from "@/lib/analytics/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ConsentStatus>("undecided");

  useEffect(() => {
    // Check initial consent status
    const status = getConsentStatus();
    setCurrentStatus(status);
    if (status === "undecided") {
      setVisible(true);
    }

    const consentChangedHandler = (e: Event) => {
      const custom = e as CustomEvent;
      const newStatus = custom.detail?.status;
      if (newStatus) {
        setCurrentStatus(newStatus);
        if (newStatus === "undecided") {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    };

    const openHandler = () => {
      setCurrentStatus(getConsentStatus());
      setVisible(true);
    };

    window.addEventListener("loc_maison_consent_changed", consentChangedHandler);
    window.addEventListener("loc_maison_open_consent", openHandler);

    return () => {
      window.removeEventListener("loc_maison_consent_changed", consentChangedHandler);
      window.removeEventListener("loc_maison_open_consent", openHandler);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Gestion des cookies et vie privée"
      className="fixed bottom-16 left-0 right-0 z-50 p-4 sm:p-6 lg:bottom-4"
    >
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  Respect de votre vie privée
                </p>
                {currentStatus !== "undecided" && (
                  <span className="rounded-full bg-sand px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground border border-border">
                    {currentStatus === "granted" ? "Actuellement accepté" : "Actuellement refusé"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                LOC MAISON utilise des cookies techniques nécessaires au fonctionnement et, avec votre accord, des cookies de mesure d&apos;audience anonymes pour améliorer votre recherche de logements en Tunisie (Mahdia).
                En savoir plus sur notre{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            <button
              type="button"
              onClick={() => {
                setConsentStatus("denied");
                setVisible(false);
              }}
              className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              Continuer sans accepter
            </button>
            <button
              type="button"
              onClick={() => {
                setConsentStatus("granted");
                setVisible(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-dark transition-colors cursor-pointer"
            >
              Accepter
            </button>
            {currentStatus !== "undecided" && (
              <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Fermer la bannière"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
