export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { confirmAndInsertCards, CardPreview } from "@/lib/ai-cards";

const cardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  tags: z.array(z.string()).optional(),
  difficulty: z.number().min(1).max(5).optional(),
});

const requestSchema = z.object({
  deck_id: z.string().uuid(),
  cards: z.array(cardSchema).min(1).max(20),
});

export async function POST(request: NextRequest) {
  console.log("[confirm-cards] Request received");

  try {
    const body = await request.json();
    console.log("[confirm-cards] Body parsed, deck_id:", body.deck_id, "cards count:", body.cards?.length);

    const { deck_id, cards } = requestSchema.parse(body);
    console.log("[confirm-cards] Schema validated, cards to insert:", cards.length);

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log(
      "[confirm-cards] Auth result - user:",
      user?.id ?? "null",
      "authError:",
      authError?.message ?? "none"
    );

    if (authError || !user) {
      console.log("[confirm-cards] Returning 401 Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Confirm and insert cards
    const result = await confirmAndInsertCards({
      deckId: deck_id,
      userId: user.id,
      cards: cards as CardPreview[],
    });

    // Handle error responses
    if (!result.success) {
      console.log("[confirm-cards] Card insertion failed:", result.error);
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          message: result.message,
          plan: result.plan,
          used: result.used,
          limit: result.limit,
          remaining: result.remaining,
          reset_at: result.reset_at,
        },
        { status: result.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Success
    console.log("[confirm-cards] Successfully inserted cards:", result.imported);
    return NextResponse.json(
      {
        deck_id: result.deckId,
        imported: result.imported,
        cards: result.cards,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[confirm-cards] Unexpected error:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors,
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle all other errors - ALWAYS return JSON
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to confirm cards",
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
