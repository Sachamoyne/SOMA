import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
// @ts-ignore - pdf-parse is CommonJS
import pdf from "pdf-parse";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const PDF_BUCKET = "pdfs";

/**
 * Normalize extracted text from PDF
 * Removes extra line breaks, headers, footers when possible
 */
function normalizeText(text: string): string {
  // Remove excessive line breaks (more than 2 consecutive)
  let normalized = text.replace(/\n{3,}/g, "\n\n");
  
  // Remove common header/footer patterns (page numbers, dates, etc.)
  normalized = normalized.replace(/^\d+\s*$/gm, ""); // Standalone page numbers
  normalized = normalized.replace(/Page \d+ of \d+/gi, ""); // Page X of Y
  normalized = normalized.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, ""); // Dates
  
  // Remove excessive whitespace
  normalized = normalized.replace(/[ \t]+/g, " ");
  
  // Trim each line
  normalized = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  
  return normalized.trim();
}

export async function POST(request: NextRequest) {
  console.log("[generate-cards-from-pdf] Request received");

  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[generate-cards-from-pdf] Returning 401 Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const deckId = formData.get("deck_id") as string | null;
    const language = (formData.get("language") as string) || "fr";

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    if (!deckId) {
      return NextResponse.json(
        { error: "Deck ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "PDF too large" },
        { status: 400 }
      );
    }

    console.log("[generate-cards-from-pdf] File validated:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Verify deck exists and belongs to user
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id, user_id")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    if (deck.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: deck does not belong to user" },
        { status: 403 }
      );
    }

    // Upload PDF to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    
    console.log("[generate-cards-from-pdf] Uploading PDF to storage:", fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[generate-cards-from-pdf] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    console.log("[generate-cards-from-pdf] PDF uploaded successfully");

    // Extract text from PDF
    console.log("[generate-cards-from-pdf] Extracting text from PDF...");
    let extractedText: string;
    
    try {
      const pdfData = await pdf(Buffer.from(fileBuffer));
      extractedText = normalizeText(pdfData.text);
      
      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from PDF" },
          { status: 400 }
        );
      }
      
      console.log("[generate-cards-from-pdf] Text extracted:", {
        length: extractedText.length,
        preview: extractedText.substring(0, 100),
      });
    } catch (parseError) {
      console.error("[generate-cards-from-pdf] PDF parsing failed:", parseError);
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 500 }
      );
    }

    // Truncate text if too long (same limit as text input)
    const MAX_TEXT_LENGTH = 20000;
    const truncatedText =
      extractedText.length > MAX_TEXT_LENGTH
        ? extractedText.substring(0, MAX_TEXT_LENGTH) + "\n\n[Texte tronqué...]"
        : extractedText;

    // Call the existing generate-cards endpoint internally
    // We reuse the logic by calling it as an internal API call
    // This avoids duplicating the AI generation, quota checking, and card insertion logic
    const baseUrl = request.nextUrl.origin;
    
    console.log("[generate-cards-from-pdf] Calling generate-cards endpoint with extracted text");
    
    const generateResponse = await fetch(`${baseUrl}/api/generate-cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward all cookies from the original request to maintain authentication
        Cookie: request.headers.get("cookie") || "",
        // Forward authorization header if present
        ...(request.headers.get("authorization") && {
          Authorization: request.headers.get("authorization")!,
        }),
      },
      body: JSON.stringify({
        text: truncatedText,
        deck_id: deckId,
        language: language,
      }),
    });

    const generateData = await generateResponse.json();

    if (!generateResponse.ok) {
      console.error("[generate-cards-from-pdf] generate-cards endpoint returned error:", generateData);
      return NextResponse.json(generateData, { status: generateResponse.status });
    }

    console.log("[generate-cards-from-pdf] Successfully generated cards from PDF");
    
    // Return the same format as /api/generate-cards
    return NextResponse.json(generateData);
  } catch (error) {
    console.error("[generate-cards-from-pdf] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process PDF",
      },
      { status: 500 }
    );
  }
}
