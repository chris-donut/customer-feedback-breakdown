"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FeedbackTable } from "@/components/FeedbackTable";
import { ProgressStepper } from "@/components/ProgressStepper";
import { QuickFilters } from "@/components/QuickFilters";
import {
  ISSUE_TYPES,
  type IssueType,
  type ProcessedFeedback,
} from "@/lib/types";
import {
  getCurrentFeedback,
  addFeedbackItems,
  saveCurrentFeedback,
  moveToHistory,
  getPostedHistory,
  getPostedTextMap,
  type HistoryEntry,
} from "@/lib/feedback-storage";

const CONFIDENCE_THRESHOLD = 0.8;

function getIssueTypeColor(type: IssueType | string): string {
  switch (type) {
    case "Bug":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "Feature":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "Improvement":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300";
    case "Design":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    case "Security":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "Infrastructure":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "gtm":
      return "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-64 mb-4" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-96 mb-8" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded-xl mb-6" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

function ReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ProcessedFeedback[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [postedMap, setPostedMap] = useState<Map<string, HistoryEntry>>(new Map());

  // Load existing feedback from localStorage and merge with new data
  useEffect(() => {
    // Load existing items from localStorage
    const existingItems = getCurrentFeedback();
    const history = getPostedHistory();
    setHistoryCount(history.length);
    setPostedMap(getPostedTextMap());

    // Check for new data from sessionStorage (just uploaded)
    const storedData = sessionStorage.getItem("feedbackData");
    const dataParam = searchParams.get("data");
    const dataString = storedData || (dataParam ? decodeURIComponent(dataParam) : null);

    if (dataString) {
      try {
        const parsed = JSON.parse(dataString);
        if (Array.isArray(parsed)) {
          // Merge new items with existing (avoiding duplicates)
          const mergedItems = addFeedbackItems(parsed);
          setItems(mergedItems);

          // Auto-select high confidence items from new batch
          const newIds = new Set(parsed.map((item: ProcessedFeedback) => item.id));
          const highConfidenceIds = new Set(
            mergedItems
              .filter((item: ProcessedFeedback) =>
                newIds.has(item.id) && item.confidence >= CONFIDENCE_THRESHOLD
              )
              .map((item: ProcessedFeedback) => item.id)
          );
          setSelectedIds(highConfidenceIds);
        }
        // Clear sessionStorage after reading
        if (storedData) {
          sessionStorage.removeItem("feedbackData");
        }
      } catch {
        setError("Failed to parse feedback data.");
        setItems(existingItems);
      }
    } else {
      // No new data, just load existing
      setItems(existingItems);
    }

    setIsLoaded(true);
  }, [searchParams]);

  const issueTypeDistribution = useMemo(() => {
    const distribution: Record<IssueType, number> = {} as Record<IssueType, number>;
    for (const type of ISSUE_TYPES) {
      distribution[type] = 0;
    }
    for (const item of items) {
      const type = item.issueType || item.category;
      if (type) {
        distribution[type as IssueType] = (distribution[type as IssueType] || 0) + 1;
      }
    }
    return distribution;
  }, [items]);

  const handleItemUpdate = useCallback(
    (itemId: string, updates: Partial<Pick<ProcessedFeedback, "generatedTitle" | "category">>) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        // Persist to localStorage
        saveCurrentFeedback(updated);
        return updated;
      });
      setEditedIds((prev) => new Set(prev).add(itemId));
    },
    []
  );

  const handleApproveAndPost = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    setIsPosting(true);
    setError(null);

    try {
      const response = await fetch("/api/post-to-linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = "Failed to post to Linear";
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid response from server");
      }

      // Move successfully posted items to history
      const postedItemIds = selectedItems.map((item) => item.id);
      const { remaining, history } = moveToHistory(postedItemIds, data.results);

      // Update local state
      setItems(remaining);
      setSelectedIds(new Set());
      setHistoryCount(history.length);

      // Store results for results page
      sessionStorage.setItem("resultsData", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsPosting(false);
    }
  }, [items, selectedIds, router]);

  const handleDeleteItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== itemId);
      saveCurrentFeedback(updated);
      return updated;
    });
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }, []);

  const selectedCount = selectedIds.size;
  const totalCount = items.length;

  // Don't show empty state until we've loaded from localStorage
  if (!isLoaded) {
    return <LoadingFallback />;
  }

  if (items.length === 0 && !error) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              No Feedback to Review
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Upload a document or paste a Google Sheets URL to get started.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Upload
              </Link>
              {historyCount > 0 && (
                <Link
                  href="/history"
                  className="inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
                >
                  View History ({historyCount})
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper currentStep="review" completedSteps={["upload"]} />
        </div>

        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Review Feedback
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Review and edit the processed feedback items before posting to Linear.
              </p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium rounded-lg transition-colors text-sm shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
              {historyCount > 0 && (
                <span className="bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded text-xs">
                  {historyCount}
                </span>
              )}
            </Link>
          </div>

          {/* Uncommitted items status */}
          {items.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {items.length} uncommitted item{items.length !== 1 ? "s" : ""} pending
                </span>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                These items will persist until posted to Linear or removed
              </span>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <section className="mb-6 p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Issue Type Distribution
          </h2>
          <div className="flex flex-wrap gap-3">
            {ISSUE_TYPES.map((issueType) => {
              const count = issueTypeDistribution[issueType];
              if (count === 0) return null;
              return (
                <div
                  key={issueType}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getIssueTypeColor(issueType)}`}
                >
                  <span>{issueType}</span>
                  <span className="bg-white/30 dark:bg-black/20 px-1.5 py-0.5 rounded text-xs font-bold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Filters */}
        <section className="mb-6 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <QuickFilters
            items={items}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </section>

        <section className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedCount}</span>{" "}
              of <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalCount}</span>{" "}
              items selected
              {selectedCount !== totalCount && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  (Items with &lt;80% confidence are excluded by default)
                </span>
              )}
            </p>
          </div>
          <FeedbackTable
            items={items}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onItemUpdate={handleItemUpdate}
            editedIds={editedIds}
            postedMap={postedMap}
            onDeleteItem={handleDeleteItem}
          />
        </section>

        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back to Upload
          </Link>
          <button
            type="button"
            onClick={handleApproveAndPost}
            disabled={selectedCount === 0 || isPosting}
            className={`
              inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all
              ${
                selectedCount === 0 || isPosting
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
              }
            `}
          >
            {isPosting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Posting to Linear...
              </>
            ) : (
              <>
                Approve & Post to Linear
                {selectedCount > 0 && (
                  <span className="ml-2 bg-blue-500/30 px-2 py-0.5 rounded text-sm">
                    {selectedCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReviewPageContent />
    </Suspense>
  );
}
