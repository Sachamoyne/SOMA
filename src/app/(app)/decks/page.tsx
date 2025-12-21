"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/shell/Topbar";
import { DeckTree } from "@/components/DeckTree";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listDecks, createDeck, getDueCount, getDeckCardCounts } from "@/store/decks";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { ImportDialog } from "@/components/ImportDialog";
import type { Deck } from "@/lib/db";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [learningCounts, setLearningCounts] = useState<
    Record<string, { new: number; learning: number; review: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deckName, setDeckName] = useState("");

  const loadDecks = async () => {
    try {
      await seedDatabase();
      const loadedDecks = await listDecks();
      setDecks(loadedDecks);

      const counts: Record<string, number> = {};
      const due: Record<string, number> = {};
      const learning: Record<string, { new: number; learning: number; review: number }> = {};
      
      // Load all counts in parallel to avoid N+1
      // Load counts for all decks (including sub-decks)
      const countPromises = loadedDecks.map(async (deck) => {
        const [cardCount, dueCount, learningCount] = await Promise.all([
          db.cards.where("deckId").equals(deck.id).count(),
          getDueCount(deck.id),
          getDeckCardCounts(deck.id),
        ]);
        return {
          deckId: deck.id,
          cardCount,
          dueCount,
          learningCount,
        };
      });
      
      const countResults = await Promise.all(countPromises);
      for (const result of countResults) {
        counts[result.deckId] = result.cardCount;
        due[result.deckId] = result.dueCount;
        learning[result.deckId] = result.learningCount;
      }
      
      setCardCounts(counts);
      setDueCounts(due);
      setLearningCounts(learning);
    } catch (error) {
      console.error("Error loading decks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleCreateDeck = async () => {
    if (!deckName.trim()) return;

    try {
      await createDeck(deckName.trim());
      await loadDecks();
      setDeckName("");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating deck:", error);
    }
  };

  const handleImportSuccess = async () => {
    await loadDecks();
  };

  // Get root decks (decks without parent)
  const rootDecks = decks.filter((d) => !d.parentDeckId);

  return (
    <>
      <Topbar
        title="Decks"
        showNewDeck
        onNewDeck={() => setDialogOpen(true)}
        showImport
        onImport={() => setImportDialogOpen(true)}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : rootDecks.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p className="mb-4">No decks yet.</p>
              <Button onClick={() => setDialogOpen(true)}>
                Create your first deck
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {rootDecks.map((deck) => (
                <DeckTree
                  key={deck.id}
                  deck={deck}
                  allDecks={decks}
                  cardCounts={cardCounts}
                  dueCounts={dueCounts}
                  learningCounts={learningCounts}
                  level={0}
                  onDeckCreated={loadDecks}
                  onDeckDeleted={loadDecks}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
            <DialogDescription>
              Create a new deck to organize your cards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Deck name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateDeck();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeck}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        initialDeckId={null}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}
