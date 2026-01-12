// Re-export all deck functions from the Supabase implementation
export {
  listDecks,
  createDeck,
  renameDeck,
  deleteDeck,
  getDeckAndAllChildren,
  getDeckPath,
  listDecksWithPaths,
  listCards,
  createCard,
  deleteCard,
  updateCard,
  suspendCard,
  unsuspendCard,
  moveCardsToDeck,
  getDueCards,
  getDueCount,
  getDeckCardCounts,
  reviewCard,
  getCardsStudiedToday,
  getCurrentStreak,
  getTotalReviews,
  type Deck,
  type Card,
  type Review,
  type ImportDoc,
  type GeneratedCard,
} from "@/lib/supabase-db";

// Import-related functions
export { createImport, listImports, generateCards, persistGeneratedCards, type CardProposal, type GenerateCardsResult } from "./imports";
