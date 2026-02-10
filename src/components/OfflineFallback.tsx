"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type OfflineFallbackProps = {
  onRetry?: () => void;
};

export function OfflineFallback({ onRetry }: OfflineFallbackProps) {
  return (
    <div className="app-shell flex h-screen w-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">Check your internet connection</p>
        <Button className="mt-6 w-full" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
