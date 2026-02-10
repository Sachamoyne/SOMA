"use client";

import { useEffect, useMemo } from "react";
import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from "@capacitor/core";
import { useAppRouter } from "@/hooks/useAppRouter";
import { createClient } from "@/lib/supabase/client";
import {
  isProtectedDeepLinkPath,
  parseDeepLinkUrl,
  setPostLoginRedirect,
} from "@/lib/deepLinks";

type AppUrlOpen = { url: string };
type AppLaunchUrl = { url?: string };
type AppPlugin = {
  addListener(
    eventName: "appUrlOpen",
    listenerFunc: (event: AppUrlOpen) => void,
  ): Promise<PluginListenerHandle>;
  getLaunchUrl(): Promise<AppLaunchUrl>;
};

const App = registerPlugin<AppPlugin>("App");

export function useDeepLinks() {
  const router = useAppRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!Capacitor.isPluginAvailable("App")) return;

    let listener: PluginListenerHandle | null = null;
    let cancelled = false;

    const routeIfValid = async (incomingUrl: string) => {
      const nextPath = parseDeepLinkUrl(incomingUrl);

      if (process.env.NODE_ENV !== "production") {
        console.log(`DeepLink received: ${incomingUrl}`);
      }

      if (!nextPath) return;

      const protectedPath = isProtectedDeepLinkPath(nextPath);
      if (protectedPath) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setPostLoginRedirect(nextPath);
          if (process.env.NODE_ENV !== "production") {
            console.log("Routing to: /login");
          }
          router.push("/login");
          return;
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(`Routing to: ${nextPath}`);
      }
      router.push(nextPath);
    };

    const setup = async () => {
      try {
        listener = await App.addListener("appUrlOpen", (event) => {
          void routeIfValid(event.url);
        });

        const launch = await App.getLaunchUrl();
        if (!cancelled && launch?.url) {
          await routeIfValid(launch.url);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[DeepLink] setup failed:", error);
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, [router, supabase]);
}
