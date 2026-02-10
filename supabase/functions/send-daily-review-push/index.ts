/**
 * Supabase Edge Function: send-daily-review-push
 *
 * Called once per day via cron (e.g., Supabase pg_cron or external scheduler).
 * For each user with cards due today, sends ONE push notification via APNs.
 *
 * Environment variables required:
 *   SUPABASE_URL           — auto-provided by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase
 *   APNS_KEY_ID            — Apple Push Notification key ID
 *   APNS_TEAM_ID           — Apple Developer Team ID
 *   APNS_PRIVATE_KEY       — APNs .p8 private key content (PEM, base64 or raw)
 *   APNS_BUNDLE_ID         — App bundle identifier (com.sachamoyne.soma)
 *   APNS_ENVIRONMENT       — "development" or "production"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID") ?? "";
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID") ?? "";
const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY") ?? "";
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID") ?? "com.sachamoyne.soma";
const APNS_ENVIRONMENT = Deno.env.get("APNS_ENVIRONMENT") ?? "production";

const APNS_HOST =
  APNS_ENVIRONMENT === "production"
    ? "https://api.push.apple.com"
    : "https://api.sandbox.push.apple.com";

Deno.serve(async (req: Request) => {
  try {
    // Optional: verify a shared secret for cron invocations
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const expectedKey = Deno.env.get("CRON_SECRET");
      if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Validate APNs configuration
    if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_PRIVATE_KEY) {
      console.error("[push] Missing APNs configuration");
      return new Response(
        JSON.stringify({ error: "APNs not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date();
    const nowIso = now.toISOString();

    // Step 1: Find all users who have at least one non-suspended card due now
    const { data: usersWithDueCards, error: dueError } = await supabase
      .from("cards")
      .select("user_id")
      .eq("suspended", false)
      .lte("due_at", nowIso)
      .limit(10000);

    if (dueError) {
      console.error("[push] Error querying due cards:", dueError);
      return new Response(
        JSON.stringify({ error: "DB query failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Deduplicate user IDs
    const userIdsWithDueCards = [...new Set((usersWithDueCards || []).map((c) => c.user_id))];
    console.log(`[push] ${userIdsWithDueCards.length} users have cards due`);

    if (userIdsWithDueCards.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No users with due cards" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get device tokens for these users
    const { data: devices, error: devicesError } = await supabase
      .from("push_devices")
      .select("user_id, device_token")
      .in("user_id", userIdsWithDueCards);

    if (devicesError) {
      console.error("[push] Error querying devices:", devicesError);
      return new Response(
        JSON.stringify({ error: "Devices query failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!devices || devices.length === 0) {
      console.log("[push] No registered devices for users with due cards");
      return new Response(
        JSON.stringify({ sent: 0, message: "No devices registered" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Group tokens by user (send max 1 push per user)
    const tokensByUser = new Map<string, string>();
    for (const device of devices) {
      if (!tokensByUser.has(device.user_id)) {
        tokensByUser.set(device.user_id, device.device_token);
      }
    }

    console.log(`[push] Sending pushes to ${tokensByUser.size} users`);

    // Step 3: Generate APNs JWT
    const jwt = await createApnsJwt(APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY);

    // Step 4: Send one push per user
    let sent = 0;
    let failed = 0;
    const expiredTokens: string[] = [];

    for (const [userId, token] of tokensByUser) {
      try {
        const success = await sendApnsPush(jwt, token, {
          title: "Time to review",
          body: "You have cards waiting for you. A quick session keeps your memory sharp!",
        });

        if (success) {
          sent++;
          // Update last_used_at
          await supabase
            .from("push_devices")
            .update({ last_used_at: nowIso })
            .eq("device_token", token);
        } else {
          failed++;
          expiredTokens.push(token);
        }
      } catch (err) {
        console.error(`[push] Error sending to user ${userId}:`, err);
        failed++;
      }
    }

    // Clean up expired/invalid tokens
    if (expiredTokens.length > 0) {
      console.log(`[push] Removing ${expiredTokens.length} expired tokens`);
      await supabase
        .from("push_devices")
        .delete()
        .in("device_token", expiredTokens);
    }

    const result = { sent, failed, expiredTokensRemoved: expiredTokens.length };
    console.log("[push] Done:", result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[push] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ─── APNs helpers ───────────────────────────────────────────

/**
 * Create a JWT for APNs using ES256 (P-256 / SHA-256).
 */
async function createApnsJwt(
  keyId: string,
  teamId: string,
  privateKeyPem: string
): Promise<string> {
  const header = { alg: "ES256", kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: teamId, iat: now };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const key = await importPkcs8Key(privateKeyPem);

  // Sign
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const rawSig = derToRaw(new Uint8Array(signature));
  const encodedSignature = base64UrlEncodeBytes(rawSig);

  return `${signingInput}.${encodedSignature}`;
}

/**
 * Send a single push notification via APNs HTTP/2.
 * Returns true if accepted, false if token is invalid/expired.
 */
async function sendApnsPush(
  jwt: string,
  deviceToken: string,
  alert: { title: string; body: string }
): Promise<boolean> {
  const url = `${APNS_HOST}/3/device/${deviceToken}`;

  const apnsPayload = {
    aps: {
      alert,
      sound: "default",
      badge: 1,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `bearer ${jwt}`,
      "apns-topic": APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "5", // Low priority — can be delayed by iOS
      "apns-expiration": "0", // Don't store if device is offline
      "Content-Type": "application/json",
    },
    body: JSON.stringify(apnsPayload),
  });

  if (response.ok) {
    return true;
  }

  const errorBody = await response.text();
  console.error(
    `[push] APNs error for token ${deviceToken.substring(0, 8)}...: ${response.status} ${errorBody}`
  );

  // 410 Gone = token is no longer valid
  // 400 BadDeviceToken = token format is wrong
  if (response.status === 410 || errorBody.includes("BadDeviceToken")) {
    return false; // Signal to remove this token
  }

  return true; // Other errors — keep the token
}

// ─── Crypto utilities ───────────────────────────────────────

async function importPkcs8Key(pem: string): Promise<CryptoKey> {
  // Clean PEM: remove headers, whitespace
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

function base64UrlEncode(str: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Convert a DER-encoded ECDSA signature to raw r||s format (64 bytes for P-256).
 */
function derToRaw(der: Uint8Array): Uint8Array {
  // DER structure: 0x30 [total_length] 0x02 [r_length] [r] 0x02 [s_length] [s]
  let offset = 2; // Skip 0x30 and total length

  // Read r
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const rLength = der[offset];
  offset++;
  let r = der.slice(offset, offset + rLength);
  offset += rLength;

  // Read s
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const sLength = der[offset];
  offset++;
  let s = der.slice(offset, offset + sLength);

  // Pad or trim to 32 bytes each
  r = padOrTrim(r, 32);
  s = padOrTrim(s, 32);

  const raw = new Uint8Array(64);
  raw.set(r, 0);
  raw.set(s, 32);
  return raw;
}

function padOrTrim(bytes: Uint8Array, targetLength: number): Uint8Array {
  if (bytes.length === targetLength) return bytes;
  if (bytes.length > targetLength) {
    // Remove leading zero padding
    return bytes.slice(bytes.length - targetLength);
  }
  // Left-pad with zeros
  const padded = new Uint8Array(targetLength);
  padded.set(bytes, targetLength - bytes.length);
  return padded;
}
