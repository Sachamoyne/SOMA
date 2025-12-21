import { db, type Settings } from "@/lib/db";

export type { Settings };

const DEFAULT_SETTINGS: Settings = {
  id: "global",
  newCardsPerDay: 20,
  maxReviewsPerDay: 9999,
  learningMode: "normal",
  againDelayMinutes: 10,
  reviewOrder: "mixed",
};

/**
 * Get settings with defaults if not present
 */
export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get("global");
  if (!settings) {
    // Initialize with defaults
    await db.settings.add(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return settings;
}

/**
 * Update settings (partial update)
 */
export async function updateSettings(
  partialSettings: Partial<Omit<Settings, "id">>
): Promise<void> {
  const existing = await db.settings.get("global");
  if (existing) {
    await db.settings.update("global", partialSettings);
  } else {
    await db.settings.add({
      ...DEFAULT_SETTINGS,
      ...partialSettings,
    });
  }
}

/**
 * Get learning steps based on learning mode
 */
export function getLearningSteps(mode: "fast" | "normal" | "deep"): number[] {
  switch (mode) {
    case "fast":
      return [10, 1440]; // 10 minutes, 1 day
    case "normal":
      return [10, 1440, 4320]; // 10 minutes, 1 day, 3 days
    case "deep":
      return [10, 1440, 4320, 10080]; // 10 minutes, 1 day, 3 days, 7 days
  }
}

