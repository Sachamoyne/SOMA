import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  text: z.string().min(1),
  deckName: z.string().optional(),
  mode: z.enum(["qa", "cloze", "vocab"]).optional().default("qa"),
  maxCards: z.number().int().positive().max(50).optional().default(20),
});

const MAX_TEXT_LENGTH = 20000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, deckName, mode, maxCards } = requestSchema.parse(body);

    if (!process.env.LLM_API_KEY) {
      return NextResponse.json(
        { error: "LLM_API_KEY missing" },
        { status: 500 }
      );
    }

    const truncatedText =
      text.length > MAX_TEXT_LENGTH
        ? text.substring(0, MAX_TEXT_LENGTH) + "\n\n[Texte tronqué...]"
        : text;

    const model = process.env.LLM_MODEL || "gpt-4o-mini";
    const baseURL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";

    const systemPrompt = `Tu es un expert en création de flashcards pour la mémorisation efficace.
Génère des flashcards précises, courtes et adaptées à la mémorisation.
Chaque flashcard doit avoir un front (question/concept) et un back (réponse/définition).
Le front doit être concis et mémorisable. Le back doit être clair et complet mais pas trop long.
Génère exactement ${maxCards} flashcards maximum.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, au format suivant :
{
  "cards": [
    {"front": "question", "back": "réponse", "confidence": 0.9, "tags": ["tag1"]}
  ]
}`;

    const userPrompt = `Extrait le texte suivant et génère ${maxCards} flashcards au format ${mode}:
${truncatedText}

${deckName ? `Contexte: deck "${deckName}"` : ""}`;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `LLM API error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content in LLM response" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to parse LLM JSON: ${e}` },
        { status: 500 }
      );
    }

    const cardsSchema = z.object({
      cards: z.array(
        z.object({
          front: z.string(),
          back: z.string(),
          confidence: z.number().optional(),
          tags: z.array(z.string()).optional(),
        })
      ),
    });

    const validated = cardsSchema.parse(parsed);

    return NextResponse.json({ cards: validated.cards });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

