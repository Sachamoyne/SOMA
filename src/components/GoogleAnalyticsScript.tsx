"use client";

import { useEffect } from "react";
import { getCookieConsent } from "@/lib/cookie-consent";

const GA4_ID = "G-T93D9CKZZT";

export function GoogleAnalyticsScript() {
  const loadGoogleAnalytics = () => {
    // Vérifier si le script est déjà chargé
    const existingScript = document.querySelector(
      `script[src*="gtag/js?id=${GA4_ID}"]`
    );
    if (existingScript) return;

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

    // Réactiver l'envoi de données
    if ((window as any).gtag) {
      (window as any).gtag("config", GA4_ID, {
        send_page_view: true,
      });
      // Envoyer la page view actuelle
      (window as any).gtag("event", "page_view");
    }
  };

  useEffect(() => {
    // Initialiser dataLayer et gtag immédiatement (comme recommandé par Google)
    window.dataLayer = window.dataLayer || [];
    
    function gtag(...args: any[]) {
      window.dataLayer!.push(args);
    }
    (window as any).gtag = gtag;
    gtag("js", new Date());

    // Vérifier le consentement
    const consent = getCookieConsent();
    
    if (consent === "accepted") {
      // Si le consentement est déjà donné, charger immédiatement
      loadGoogleAnalytics();
    } else if (consent === null) {
      // Si pas encore de consentement, configurer mais ne pas charger le script
      // Le script sera chargé quand l'utilisateur acceptera
      gtag("config", GA4_ID, {
        // Désactiver l'envoi de données jusqu'à ce que le consentement soit donné
        send_page_view: false,
      });
    }
    // Si consent === "rejected", ne rien faire
  }, []);

  // Écouter les changements de consentement
  useEffect(() => {
    const handleConsentChange = () => {
      const consent = getCookieConsent();
      if (consent === "accepted") {
        loadGoogleAnalytics();
      }
    };

    window.addEventListener("cookieConsentChanged", handleConsentChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "cookie-consent") {
        handleConsentChange();
      }
    });

    return () => {
      window.removeEventListener("cookieConsentChanged", handleConsentChange);
    };
  }, []);

  // Le code Google tag est initialisé dans useEffect, pas besoin de retourner de JSX
  return null;
}
