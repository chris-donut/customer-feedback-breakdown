"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
} from "@/lib/types";

interface PostResult {
  feedbackId: string;
  linearIssueId?: string;
  linearUrl?: string;
  success: boolean;
  error?: string;
}

interface PostSummary {
  total: number;
  successful: number;
  failed: number;
  byCategory: Record<FeedbackCategory, number>;
}

interface ResultsData {
  success: boolean;
  results: PostResult[];
  summary: PostSummary;
}

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
      <div className="max-w-4xl mx-auto">
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

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setData(parsed);
      } catch {
        setError("Failed to parse results data.");
      }
    }
  }, [searchParams]);

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Error Loading Results
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Start New Upload
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              No Results Available
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Complete the review process to see results here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Start New Upload
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { results, summary } = data;
  const successfulResults = results.filter((r) => r.success && r.linearUrl);
  const failedResults = results.filter((r) => !r.success);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Posted to Linear
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your feedback items have been processed and posted as Linear issues.
          </p>
        </header>

        <section className="mb-6 p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Summary
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {summary.total}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Total Processed
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {summary.successful}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Successfully Posted
              </div>
            </div>
            {summary.failed > 0 && (
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {summary.failed}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  Failed
                </div>
              </div>
            )}
            {summary.failed === 0 && (
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  0
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Failed
                </div>
              </div>
            )}
          </div>

          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Breakdown by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            {FEEDBACK_CATEGORIES.map((category) => {
              const count = summary.byCategory[category];
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
            {Object.values(summary.byCategory).every((v) => v === 0) && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                No categories recorded
              </span>
            )}
          </div>
        </section>

        {successfulResults.length > 0 && (
          <section className="mb-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Created Issues ({successfulResults.length})
              </h2>
            </div>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {successfulResults.map((result) => (
                <li
                  key={result.feedbackId}
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <a
                    href={result.linearUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between group"
                  >
                    <span className="text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {result.linearIssueId}
                    </span>
                    <svg
                      className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {failedResults.length > 0 && (
          <section className="mb-6 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                Failed Items ({failedResults.length})
              </h2>
            </div>
            <ul className="divide-y divide-red-100 dark:divide-red-900/30">
              {failedResults.map((result) => (
                <li key={result.feedbackId} className="p-4">
                  <div className="text-sm text-zinc-900 dark:text-zinc-100">
                    Feedback ID: {result.feedbackId}
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {result.error}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex items-center justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Start New Upload
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsPageContent />
    </Suspense>
  );
}
