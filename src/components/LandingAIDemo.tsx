"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * LandingAIDemo - Composant ISOLE pour la landing page
 * Animation purement visuelle simulant la generation IA de flashcards
 * AUCUN appel API, AUCUNE logique metier
 */
export function LandingAIDemo() {
  const [phase, setPhase] = useState<"idle" | "typing" | "generating" | "done">("idle");
  const [typedText, setTypedText] = useState("");
  const [showCard, setShowCard] = useState(false);

  const sourceText = "The mitochondria is the powerhouse of the cell.";
  const flashcard = {
    question: "What is the powerhouse of the cell?",
    answer: "The mitochondria",
  };

  // Animation sequence
  useEffect(() => {
    // Start after a short delay
    const startTimer = setTimeout(() => {
      setPhase("typing");
    }, 800);

    return () => clearTimeout(startTimer);
  }, []);

  // Typing animation
  useEffect(() => {
    if (phase !== "typing") return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < sourceText.length) {
        setTypedText(sourceText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        // Move to generating phase
        setTimeout(() => setPhase("generating"), 400);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [phase]);

  // Generating to done transition
  useEffect(() => {
    if (phase !== "generating") return;

    const timer = setTimeout(() => {
      setPhase("done");
      setShowCard(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase]);

  // Loop animation
  useEffect(() => {
    if (phase !== "done") return;

    const resetTimer = setTimeout(() => {
      setPhase("idle");
      setTypedText("");
      setShowCard(false);
      // Restart
      setTimeout(() => setPhase("typing"), 600);
    }, 4000);

    return () => clearTimeout(resetTimer);
  }, [phase]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-16">
      {/* Source text input simulation */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          <span className="text-xs text-muted-foreground">Source text</span>
        </div>
        <p className="text-sm text-foreground min-h-[24px]">
          {typedText}
          {phase === "typing" && (
            <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 animate-pulse" />
          )}
        </p>
      </div>

      {/* AI Processing indicator */}
      {phase === "generating" && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Sparkles className="h-4 w-4 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Generating flashcard...</span>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* Generated flashcard */}
      <div
        className={`mt-4 transition-all duration-500 ${
          showCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          {/* Question side */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Question</span>
            </div>
            <p className="text-sm font-medium text-foreground">{flashcard.question}</p>
          </div>
          {/* Answer side */}
          <div className="p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Answer</span>
            </div>
            <p className="text-sm text-foreground">{flashcard.answer}</p>
          </div>
        </div>
      </div>

      {/* Subtle label */}
      {showCard && (
        <p className="text-center text-xs text-muted-foreground mt-4 animate-fade-in">
          AI-generated flashcard from your notes
        </p>
      )}
    </div>
  );
}
