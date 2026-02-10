"use client";

import { WifiOff } from "lucide-react";
import { useIsNative } from "@/hooks/useIsNative";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const isNative = useIsNative();
  const { online } = useNetworkStatus();

  if (!isNative || online) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-destructive-foreground text-sm font-medium"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>No internet connection</span>
    </div>
  );
}
