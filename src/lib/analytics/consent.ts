export const CONSENT_STORAGE_KEY = "loc_maison_consent";
export const CONSENT_COOKIE_NAME = "loc_maison_consent";

export type ConsentStatus = "granted" | "denied" | "undecided";

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") {
    return "undecided";
  }

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      return stored;
    }

    const match = document.cookie
      .split(/;\s*/)
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
    if (match) {
      const val = match.split("=")[1];
      if (val === "granted" || val === "denied") {
        return val;
      }
    }
  } catch {
    /* ignore */
  }

  return "undecided";
}

export function hasAnalyticsConsent(): boolean {
  return getConsentStatus() === "granted";
}

export function setConsentStatus(status: "granted" | "denied"): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${CONSENT_COOKIE_NAME}=${status}; path=/; max-age=${maxAge}; SameSite=Lax`;

    window.dispatchEvent(
      new CustomEvent("loc_maison_consent_changed", { detail: { status } })
    );

    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("consent", "update", {
        analytics_storage: status === "granted" ? "granted" : "denied",
      });
    }
  } catch {
    /* ignore */
  }
}

export function resetConsent(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    document.cookie = `${CONSENT_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    window.dispatchEvent(
      new CustomEvent("loc_maison_consent_changed", { detail: { status: "undecided" } })
    );
  } catch {
    /* ignore */
  }
}

export function openConsentBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("loc_maison_open_consent"));
}

// Attach debugging helpers to window in browser
if (typeof window !== "undefined") {
  (window as any).__resetConsent = resetConsent;
  (window as any).__openConsent = openConsentBanner;
  (window as any).__getConsent = getConsentStatus;
}

