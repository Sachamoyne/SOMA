"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2 } from "lucide-react";
import { getDeckCardCounts, deleteDeck } from "@/store/decks";

export default function DeckOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;
  const [loading, setLoading] = useState(true);
  const [cardCounts, setCardCounts] = useState<{
    new: number;
    learning: number;
    review: number;
  }>({ new: 0, learning: 0, review: 0 });

  useEffect(() => {
    async function loadCounts() {
      try {
        const normalizedDeckId = String(deckId);
        const counts = await getDeckCardCounts(normalizedDeckId);
        setCardCounts(counts);
      } catch (error) {
        console.error("Error loading card counts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCounts();
  }, [deckId]);

  const handleDeleteDeck = async () => {
    if (!confirm("Delete this deck and all its cards and sub-decks?")) return;

    try {
      const normalizedDeckId = String(deckId);
      await deleteDeck(normalizedDeckId);
      router.push("/decks");
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  };

  const handleStudy = () => {
    router.push(`/study/${String(deckId)}`);
  };

  const totalCards = cardCounts.new + cardCounts.learning + cardCounts.review;
  const hasDueCards = totalCards > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Card counts - clean, no card wrapper */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-16 py-8">
          {/* New cards */}
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-3">
              {cardCounts.new}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              New
            </div>
          </div>

          {/* Learning cards */}
          <div className="text-center">
            <div className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-3">
              {cardCounts.learning}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Learning
            </div>
          </div>

          {/* Review cards */}
          <div className="text-center">
            <div className="text-6xl font-bold text-green-600 dark:text-green-400 mb-3">
              {cardCounts.review}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              To Review
            </div>
          </div>
        </div>
      </div>

      {/* Primary action - Study Now */}
      <div className="flex justify-center">
        {hasDueCards ? (
          <Button
            size="lg"
            onClick={handleStudy}
            className="px-16 py-7 text-lg font-semibold shadow-lg"
          >
            <BookOpen className="mr-3 h-6 w-6" />
            Study Now
          </Button>
        ) : totalCards === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-3">
              This deck is empty.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the <span className="font-semibold text-foreground">Add</span> tab to create cards.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-2">
              Congratulations!
            </p>
            <p className="text-sm text-muted-foreground">
              All cards in this deck are up to date.
            </p>
          </div>
        )}
      </div>

      {/* Footer - minimal, danger action only */}
      <div className="pt-12 border-t flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteDeck}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Deck
        </Button>
      </div>
    </div>
  );
}
