"use client";

import { useState, useEffect } from "react";
import { isNativeApp } from "@/lib/native";

/**
 * Returns true when running inside a Capacitor native shell.
 * Returns false during SSR and the first client render to avoid hydration mismatch.
 */
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeApp());
  }, []);

  return native;
}
