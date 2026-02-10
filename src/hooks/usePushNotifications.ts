"use client";

import { useEffect, useRef } from "react";
import { isNativeApp } from "@/lib/native";

/**
 * Registers for iOS push notifications via Capacitor.
 * - Only runs on native iOS (no-op on web)
 * - Requests permission once per app session
 * - Sends APNs token to /api/push-token
 * - Does NOT block the app if permission is denied
 * - Does NOT re-prompt if already denied
 */
export function usePushNotifications() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    if (!isNativeApp()) return;

    registered.current = true;
    registerPush();
  }, []);
}

async function registerPush() {
  try {
    // Dynamic import to avoid loading Capacitor plugin code on web
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Check current permission status
    const permStatus = await PushNotifications.checkPermissions();
    console.log("[Push] Current permission status:", permStatus.receive);

    // If already denied by the OS, don't re-prompt
    if (permStatus.receive === "denied") {
      console.log("[Push] Permission denied by user, skipping registration");
      return;
    }

    // Request permission if not yet granted
    if (permStatus.receive !== "granted") {
      const reqResult = await PushNotifications.requestPermissions();
      console.log("[Push] Permission request result:", reqResult.receive);

      if (reqResult.receive !== "granted") {
        console.log("[Push] Permission not granted, skipping registration");
        return;
      }
    }

    // Listen for successful registration (APNs token)
    PushNotifications.addListener("registration", async (token) => {
      console.log("[Push] APNs token received:", token.value.substring(0, 12) + "...");
      await sendTokenToBackend(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener("registrationError", (error) => {
      console.error("[Push] Registration error:", error.error);
    });

    // Listen for push received while app is in foreground (silent)
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[Push] Notification received in foreground:", notification.title);
    });

    // Listen for user tapping on a notification (opens the app)
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[Push] Notification tapped:", action.notification.title);
      // App is already open/opening — no additional action needed
    });

    // Register with APNs
    await PushNotifications.register();
    console.log("[Push] Registration initiated with APNs");
  } catch (error) {
    // Fail silently — push is not critical
    console.error("[Push] Unexpected error during registration:", error);
  }
}

async function sendTokenToBackend(token: string) {
  try {
    const response = await fetch("/api/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: "ios" }),
    });

    if (!response.ok) {
      console.error("[Push] Failed to save token:", response.status, await response.text());
    } else {
      console.log("[Push] Token saved to backend");
    }
  } catch (error) {
    console.error("[Push] Error sending token to backend:", error);
  }
}
