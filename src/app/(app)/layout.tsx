import AppShellClient from "./AppShellClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Simple server-side auth guard for all routes under (app)
  // - If no authenticated user: redirect to /login
  // - If authenticated: render the authenticated app shell
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce onboarding_status for access to the app:
  // - FREE: email confirmation required AND onboarding_status must be active
  // - PAID: onboarding_status must be active (email confirmation is non-blocking)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name, onboarding_status")
    .eq("id", user.id)
    .single();

  const planName = (profile as any)?.plan_name as string | null | undefined;
  const onboardingStatus = (profile as any)?.onboarding_status as string | null | undefined;

  // Default-safe: if profile missing or status not active, block access
  if (onboardingStatus !== "active") {
    redirect("/pricing");
  }

  if ((planName === "free" || !planName) && !user.email_confirmed_at) {
    redirect("/login");
  }

  return <AppShellClient>{children}</AppShellClient>;
}
