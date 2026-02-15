"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { consumePostLoginRedirect } from "@/lib/deepLinks";

/** Max time (ms) before giving up and sending the user to /login. */
const TIMEOUT_MS = 15_000;

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    // Guard against double-execution in dev Strict Mode.
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const oauthErrorDesc = searchParams.get("error_description");

    // Determine where to go after success.
    const nextParam = searchParams.get("next");
    const storedRedirect = consumePostLoginRedirect();
    const successPath =
      nextParam && nextParam.startsWith("/")
        ? nextParam
        : storedRedirect ?? "/decks";

    // ---- OAuth error returned by provider ----
    if (oauthError) {
      console.error("[AuthCallback] OAuth error:", oauthError, oauthErrorDesc);
      setError(oauthErrorDesc || oauthError);
      const t = setTimeout(() => router.replace("/login"), 2500);
      return () => clearTimeout(t);
    }

    // ---- No code – nothing to exchange ----
    if (!code) {
      router.replace(successPath);
      return;
    }

    // ---- Exchange the code for a session ----
    let timeoutId: ReturnType<typeof setTimeout>;

    const exchange = async () => {
      // Safety net: never leave the spinner forever.
      timeoutId = setTimeout(() => {
        console.error("[AuthCallback] Timed out");
        setError("Sign-in timed out. Please try again.");
        setTimeout(() => router.replace("/login"), 2500);
      }, TIMEOUT_MS);

      try {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        clearTimeout(timeoutId);

        if (exchangeError) {
          // The code might have already been consumed (Strict Mode / refresh).
          // Check if a session actually exists before treating as an error.
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            router.replace(successPath);
            return;
          }

          console.error(
            "[AuthCallback] Exchange error:",
            exchangeError.message,
          );
          setError(exchangeError.message);
          setTimeout(() => router.replace("/login"), 2500);
          return;
        }

        // Success – navigate to the target page.
        router.replace(successPath);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("[AuthCallback] Unexpected error:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => router.replace("/login"), 2500);
      }
    };

    void exchange();

    return () => clearTimeout(timeoutId);
  }, [router, searchParams, supabase]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Authentication failed
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
          <p className="text-xs text-muted-foreground">
            Redirecting to login…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
