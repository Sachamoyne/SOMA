/**
 * Gestion du consentement aux cookies et chargement conditionnel de Google Tag Manager et Google Analytics
 */

const COOKIE_CONSENT_KEY = "cookie-consent";
const GTM_ID = "GTM-PSFK9VWM";
const GA4_ID = "G-T93D9CKZZT";

export type CookieConsent = "accepted" | "rejected" | null;

/**
 * Récupère le consentement aux cookies depuis le localStorage
 */
export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent === "accepted" || consent === "rejected" ? consent : null;
}

/**
 * Enregistre le consentement aux cookies
 */
export function setCookieConsent(consent: "accepted" | "rejected"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  // Déclencher un événement personnalisé pour notifier les autres composants
  window.dispatchEvent(new Event("cookieConsentChanged"));
}

/**
 * Charge Google Analytics (gtag.js) si le consentement a été donné
 */
export function loadGoogleAnalytics(): void {
  if (typeof window === "undefined") return;
  
  const consent = getCookieConsent();
  if (consent !== "accepted") return;

  // Vérifier si gtag est déjà chargé
  if ((window as any).gtag) return;

  // Vérifier si le script est déjà présent dans le DOM
  const existingScript = document.querySelector(`script[src*="gtag/js?id=${GA4_ID}"]`);
  if (existingScript) return;

  // Initialiser dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Fonction gtag
  function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  }
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_ID);

  // Charger le script gtag.js
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

/**
 * Charge Google Tag Manager si le consentement a été donné
 */
export function loadGoogleTagManager(): void {
  if (typeof window === "undefined") return;
  
  const consent = getCookieConsent();
  if (consent !== "accepted") return;

  // Vérifier si GTM est déjà chargé (vérifier si le script existe dans le DOM)
  const existingGtmScript = document.querySelector(`script[src*="gtm.js?id=${GTM_ID}"]`);
  if (existingGtmScript) return;

  // Initialiser dataLayer si pas déjà fait
  window.dataLayer = window.dataLayer || [];
  
  // Fonction GTM
  (function(w: any, d: Document, s: string, l: string, i: string) {
    w[l] = w[l] || [];
    w[l].push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
    const f = d.getElementsByTagName(s)[0];
    const j = d.createElement(s) as HTMLScriptElement;
    const dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode?.insertBefore(j, f);
  })(window, document, "script", "dataLayer", GTM_ID);
}

/**
 * Déclare les types pour window.dataLayer et gtag
 */
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}
