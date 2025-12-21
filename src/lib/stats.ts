"use client";

import { db } from "./db";
import { liveQuery } from "dexie";
import { getDeckAndAllChildren } from "@/store/decks";
import { useEffect, useState } from "react";
import type { DependencyList } from "react";

export interface ReviewByDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}

export interface CardStateBreakdown {
  new: number;
  learning: number;
  review: number;
}

export interface CardDistribution {
  new: number;
  learning: number;
  learned: number;
}

/**
 * Get reviews grouped by day for the last N days
 */
export async function getReviewsByDay(days: number): Promise<ReviewByDay[]> {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  
  const reviews = await db.reviews
    .where("reviewedAt")
    .between(startTime, now, true, true)
    .toArray();
  
  // Group by date
  const byDate = new Map<string, number>();
  for (const review of reviews) {
    const date = new Date(review.reviewedAt);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    byDate.set(dateStr, (byDate.get(dateStr) || 0) + 1);
  }
  
  // Fill in missing days with 0
  const result: ReviewByDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: byDate.get(dateStr) || 0,
    });
  }
  
  return result;
}

/**
 * Get heatmap data for the last N days (GitHub-style)
 * Returns array of cells with date, count, and dayOfWeek
 */
export async function getHeatmapData(days: number): Promise<HeatmapCell[]> {
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  
  const reviews = await db.reviews
    .where("reviewedAt")
    .between(startTime, now, true, true)
    .toArray();
  
  // Group by date
  const byDate = new Map<string, number>();
  for (const review of reviews) {
    const date = new Date(review.reviewedAt);
    const dateStr = date.toISOString().split("T")[0];
    byDate.set(dateStr, (byDate.get(dateStr) || 0) + 1);
  }
  
  // Create cells for all days
  const result: HeatmapCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    result.push({
      date: dateStr,
      count: byDate.get(dateStr) || 0,
      dayOfWeek,
    });
  }
  
  return result;
}

/**
 * Get card state breakdown (New / Learning / Review)
 * If deckId is provided, includes that deck and all sub-decks
 */
export async function getCardStateBreakdown(
  deckId?: string
): Promise<CardStateBreakdown> {
  const now = Date.now();
  let deckIds: string[];
  
  if (deckId) {
    deckIds = await getDeckAndAllChildren(deckId);
  } else {
    // All decks
    const allDecks = await db.decks.toArray();
    deckIds = allDecks.map((d) => d.id);
  }
  
  const cards = await db.cards
    .where("deckId")
    .anyOf(deckIds)
    .filter((card) => !card.suspended)
    .toArray();
  
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  
  for (const card of cards) {
    if (card.state === "new") {
      newCount++;
    } else if (card.state === "learning" && card.dueAt <= now) {
      learningCount++;
    } else if (card.state === "review" && card.dueAt <= now) {
      reviewCount++;
    }
  }
  
  return { new: newCount, learning: learningCount, review: reviewCount };
}

/**
 * Get card distribution (New / Learning / Learned) based on reps and state
 * This is for the pie chart showing the overall card stock
 * If deckId is provided, includes that deck and all sub-decks
 */
export async function getCardDistribution(
  deckId?: string
): Promise<CardDistribution> {
  let deckIds: string[];
  
  if (deckId) {
    deckIds = await getDeckAndAllChildren(deckId);
  } else {
    // All decks
    const allDecks = await db.decks.toArray();
    deckIds = allDecks.map((d) => d.id);
  }
  
  const cards = await db.cards
    .where("deckId")
    .anyOf(deckIds)
    .filter((card) => !card.suspended)
    .toArray();
  
  let newCount = 0;
  let learningCount = 0;
  let learnedCount = 0;
  
  for (const card of cards) {
    if (card.reps === 0) {
      // New: never studied
      newCount++;
    } else if (card.reps > 0 && card.state === "learning") {
      // Learning: studied but still in learning phase
      learningCount++;
    } else if (card.reps > 0 && card.state === "review") {
      // Learned: studied and moved to review phase
      learnedCount++;
    }
  }
  
  return { new: newCount, learning: learningCount, learned: learnedCount };
}

/**
 * Hook to use liveQuery in React
 * For arrays, returns empty array instead of undefined when loading
 */
function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps: DependencyList = [],
  defaultValue?: T
): T | undefined {
  const [data, setData] = useState<T | undefined>(defaultValue);

  useEffect(() => {
    const observable = liveQuery(querier);
    const subscription = observable.subscribe({
      next: (result) => setData(result),
      error: (error) => {
        console.error("LiveQuery error:", error);
        setData(defaultValue);
      },
    });

    return () => subscription.unsubscribe();
  }, deps);

  return data;
}

/**
 * Live query for reviews by day
 */
export function useReviewsByDay(days: number) {
  return useLiveQuery(() => getReviewsByDay(days), [days], []);
}

/**
 * Live query for heatmap data
 */
export function useHeatmapData(days: number) {
  return useLiveQuery(() => getHeatmapData(days), [days], []);
}

/**
 * Live query for card state breakdown
 */
export function useCardStateBreakdown(deckId?: string) {
  return useLiveQuery(
    () => getCardStateBreakdown(deckId),
    [deckId],
    { new: 0, learning: 0, review: 0 }
  );
}

/**
 * Live query for card distribution
 */
export function useCardDistribution(deckId?: string) {
  return useLiveQuery(
    () => getCardDistribution(deckId),
    [deckId],
    { new: 0, learning: 0, learned: 0 }
  );
}

