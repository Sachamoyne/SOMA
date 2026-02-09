import { Capacitor } from "@capacitor/core";

/**
 * Returns true when running inside a Capacitor native shell (iOS / Android).
 * Safe to call on the server (always returns false).
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
