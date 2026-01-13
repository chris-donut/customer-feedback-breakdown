"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getPostedHistory,
  clearHistory,
  type HistoryEntry,
} from "@/lib/feedback-storage";
import { type IssueType, PRIORITIES } from "@/lib/types";

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

function getPriorityLabel(priority: number | undefined): string {
  const p = PRIORITIES.find((pr) => pr.value === priority);
  return p?.label || "No priority";
}

function getPriorityColor(priority: number | undefined): string {
  switch (priority) {
    case 1:
      return "text-red-600 dark:text-red-400";
    case 2:
      return "text-orange-600 dark:text-orange-400";
    case 3:
      return "text-yellow-600 dark:text-yellow-400";
    case 4:
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { feedback, linearUrl, linearIssueId, postedAt } = entry;
  const issueType = feedback.issueType || feedback.category;

  return (
    <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate">
            {feedback.generatedTitle}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getIssueTypeColor(issueType)}`}
            >
              {issueType}
            </span>
            <span className={`text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
              {getPriorityLabel(feedback.priority)}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {feedback.issueSource || "user feedback"}
            </span>
          </div>
        </div>

        {linearUrl && (
          <a
            href={linearUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            {linearIssueId || "View in Linear"}
          </a>
        )}
      </div>

      <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
        {feedback.originalText}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <span>Posted {formatDate(postedAt)}</span>
        <span className="font-mono">
          {Math.round(feedback.confidence * 100)}% confidence
        </span>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setHistory(getPostedHistory());
    setIsLoaded(true);
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};

    for (const entry of history) {
      const date = new Date(entry.postedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    }

    return groups;
  }, [history]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-48 mb-4" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-64 mb-8" />
            <div className="space-y-4">
              <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
              <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/review"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Posted History
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              {history.length} feedback item{history.length !== 1 ? "s" : ""} posted to Linear
            </p>
          </div>

          {history.length > 0 && (
            <div className="relative">
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Clear all?</span>
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear History
                </button>
              )}
            </div>
          )}
        </header>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No History Yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Posted feedback items will appear here.
            </p>
            <Link
              href="/review"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Review
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, entries]) => (
              <section key={date}>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
                  {date}
                </h2>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <HistoryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
