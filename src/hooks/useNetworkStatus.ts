"use client";

import { useEffect, useState } from "react";

/**
 * Centralized network status hook based on browser connectivity signals.
 * Uses navigator.onLine + online/offline window events.
 */
export function useNetworkStatus(): { online: boolean } {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => {
      setOnline(window.navigator.onLine);
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return { online };
}
