"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FeedbackTable } from "@/components/FeedbackTable";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type ProcessedFeedback,
} from "@/lib/types";

const CONFIDENCE_THRESHOLD = 0.8;

function getCategoryColor(category: FeedbackCategory): string {
  switch (category) {
    case "Bug":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "Feature Request":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "UI/UX Issue":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    case "AI Hallucination":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "New Feature":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    case "Documentation":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
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

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        if (Array.isArray(parsed)) {
          setItems(parsed);
          const highConfidenceIds = new Set(
            parsed
              .filter((item: ProcessedFeedback) => item.confidence >= CONFIDENCE_THRESHOLD)
              .map((item: ProcessedFeedback) => item.id)
          );
          setSelectedIds(highConfidenceIds);
        }
      } catch {
        setError("Failed to parse feedback data.");
      }
    }
  }, [searchParams]);

  const categoryDistribution = useMemo(() => {
    const distribution: Record<FeedbackCategory, number> = {} as Record<FeedbackCategory, number>;
    for (const category of FEEDBACK_CATEGORIES) {
      distribution[category] = 0;
    }
    for (const item of items) {
      distribution[item.category] = (distribution[item.category] || 0) + 1;
    }
    return distribution;
  }, [items]);

  const handleItemUpdate = useCallback(
    (itemId: string, updates: Partial<Pick<ProcessedFeedback, "generatedTitle" | "category">>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post to Linear");
      }

      router.push(`/results?data=${encodeURIComponent(JSON.stringify(data))}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsPosting(false);
    }
  }, [items, selectedIds, router]);

  const selectedCount = selectedIds.size;
  const totalCount = items.length;

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
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Upload
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Review Feedback
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Review and edit the processed feedback items before posting to Linear.
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <section className="mb-6 p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Category Distribution
          </h2>
          <div className="flex flex-wrap gap-3">
            {FEEDBACK_CATEGORIES.map((category) => {
              const count = categoryDistribution[category];
              if (count === 0) return null;
              return (
                <div
                  key={category}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getCategoryColor(category)}`}
                >
                  <span>{category}</span>
                  <span className="bg-white/30 dark:bg-black/20 px-1.5 py-0.5 rounded text-xs font-bold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
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
