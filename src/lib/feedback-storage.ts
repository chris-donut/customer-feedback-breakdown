"use client";

import { type ProcessedFeedback } from "@/lib/types";

const STORAGE_KEYS = {
  CURRENT_FEEDBACK: "feedback_current",
  POSTED_HISTORY: "feedback_history",
} as const;

export interface HistoryEntry {
  id: string;
  feedback: ProcessedFeedback;
  linearIssueId?: string;
  linearUrl?: string;
  postedAt: string;
}

// Get current feedback items from storage
export function getCurrentFeedback(): ProcessedFeedback[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_FEEDBACK);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save current feedback items to storage
export function saveCurrentFeedback(items: ProcessedFeedback[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_FEEDBACK, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save feedback to storage:", error);
  }
}

// Add new feedback items (merge with existing, avoiding duplicates by originalText)
export function addFeedbackItems(newItems: ProcessedFeedback[]): ProcessedFeedback[] {
  const existing = getCurrentFeedback();
  const existingTexts = new Set(existing.map((item) => item.originalText));

  const uniqueNewItems = newItems.filter(
    (item) => !existingTexts.has(item.originalText)
  );

  const merged = [...existing, ...uniqueNewItems];
  saveCurrentFeedback(merged);
  return merged;
}

// Update a feedback item in storage
export function updateFeedbackItem(
  itemId: string,
  updates: Partial<ProcessedFeedback>
): ProcessedFeedback[] {
  const items = getCurrentFeedback();
  const updated = items.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  saveCurrentFeedback(updated);
  return updated;
}

// Remove feedback items from current storage (after posting)
export function removeFeedbackItems(itemIds: string[]): ProcessedFeedback[] {
  const items = getCurrentFeedback();
  const idsToRemove = new Set(itemIds);
  const remaining = items.filter((item) => !idsToRemove.has(item.id));
  saveCurrentFeedback(remaining);
  return remaining;
}

// Clear all current feedback
export function clearCurrentFeedback(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_FEEDBACK);
}

// Get posted history
export function getPostedHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POSTED_HISTORY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Add items to posted history
export function addToHistory(
  items: ProcessedFeedback[],
  results: { feedbackId: string; linearIssueId?: string; linearUrl?: string; success: boolean }[]
): HistoryEntry[] {
  const history = getPostedHistory();
  const resultMap = new Map(results.map((r) => [r.feedbackId, r]));
  const postedAt = new Date().toISOString();

  const newEntries: HistoryEntry[] = items
    .filter((item) => {
      const result = resultMap.get(item.id);
      return result?.success;
    })
    .map((item) => {
      const result = resultMap.get(item.id);
      return {
        id: `history_${Date.now()}_${item.id}`,
        feedback: item,
        linearIssueId: result?.linearIssueId,
        linearUrl: result?.linearUrl,
        postedAt,
      };
    });

  const updatedHistory = [...newEntries, ...history]; // Newest first

  try {
    localStorage.setItem(STORAGE_KEYS.POSTED_HISTORY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to save history:", error);
  }

  return updatedHistory;
}

// Clear posted history
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.POSTED_HISTORY);
}

// Move posted items from current to history
export function moveToHistory(
  postedItemIds: string[],
  results: { feedbackId: string; linearIssueId?: string; linearUrl?: string; success: boolean }[]
): { remaining: ProcessedFeedback[]; history: HistoryEntry[] } {
  const currentItems = getCurrentFeedback();
  const postedItems = currentItems.filter((item) => postedItemIds.includes(item.id));

  // Add successful posts to history
  const history = addToHistory(postedItems, results);

  // Remove successfully posted items from current
  const successfulIds = results.filter((r) => r.success).map((r) => r.feedbackId);
  const remaining = removeFeedbackItems(successfulIds);

  return { remaining, history };
}

// Check if feedback text has already been posted (returns history entry if found)
export function findInHistory(originalText: string): HistoryEntry | undefined {
  const history = getPostedHistory();
  return history.find((entry) => entry.feedback.originalText === originalText);
}

// Get a map of originalText -> HistoryEntry for quick lookups
export function getPostedTextMap(): Map<string, HistoryEntry> {
  const history = getPostedHistory();
  const map = new Map<string, HistoryEntry>();
  for (const entry of history) {
    map.set(entry.feedback.originalText, entry);
  }
  return map;
}
