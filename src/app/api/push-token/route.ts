import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push-token
 * Upserts a device push token for the authenticated user.
 * Called by the iOS app after APNs registration succeeds.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform } = body;

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (platform && !["ios", "android"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    // Upsert: if this user+token combo exists, just update last_used_at
    const { error: upsertError } = await supabase
      .from("push_devices")
      .upsert(
        {
          user_id: user.id,
          device_token: token,
          platform: platform || "ios",
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,device_token",
        }
      );

    if (upsertError) {
      console.error("[push-token] Upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[push-token] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
