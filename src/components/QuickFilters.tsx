"use client";

import { useMemo } from "react";
import type { IssueType, ProcessedFeedback } from "@/lib/types";

export interface QuickFiltersProps {
  items: ProcessedFeedback[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

interface FilterButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  filter: (items: ProcessedFeedback[]) => ProcessedFeedback[];
  colorClass: string;
}

const ISSUE_TYPE_COLORS: Record<IssueType, string> = {
  Bug: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60",
  Feature:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60",
  Improvement:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60",
  Design:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60",
  Security:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60",
  Infrastructure:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
  gtm:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/60",
};

export function QuickFilters({
  items,
  selectedIds,
  onSelectionChange,
  activeFilter,
  onFilterChange,
}: QuickFiltersProps) {
  const filterButtons: FilterButton[] = useMemo(() => {
    const bugItems = items.filter((i) => i.issueType === "Bug" || i.category === "Bug");
    const highConfidence = items.filter((i) => i.confidence >= 0.9);
    const lowConfidence = items.filter((i) => i.confidence < 0.7);

    return [
      {
        id: "all",
        label: "All",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ),
        count: items.length,
        filter: (i) => i,
        colorClass:
          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700",
      },
      {
        id: "bugs",
        label: "Bugs",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        count: bugItems.length,
        filter: (i) => i.filter((item) => item.issueType === "Bug" || item.category === "Bug"),
        colorClass: ISSUE_TYPE_COLORS.Bug,
      },
      {
        id: "high-confidence",
        label: "High Confidence",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        count: highConfidence.length,
        filter: (i) => i.filter((item) => item.confidence >= 0.9),
        colorClass:
          "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60",
      },
      {
        id: "needs-review",
        label: "Needs Review",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        count: lowConfidence.length,
        filter: (i) => i.filter((item) => item.confidence < 0.7),
        colorClass:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60",
      },
    ];
  }, [items]);

  const handleFilterClick = (filterId: string) => {
    onFilterChange(activeFilter === filterId ? null : filterId);
  };

  const handleSelectFiltered = () => {
    const activeBtn = filterButtons.find((b) => b.id === activeFilter);
    if (activeBtn) {
      const filteredItems = activeBtn.filter(items);
      const newIds = new Set(filteredItems.map((i) => i.id));
      onSelectionChange(new Set([...selectedIds, ...newIds]));
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Quick Filters:
      </span>
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => handleFilterClick(btn.id)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-800
              ${activeFilter === btn.id
                ? `${btn.colorClass} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-800 ring-blue-500`
                : btn.colorClass
              }
            `}
          >
            {btn.icon}
            {btn.label}
            <span className="bg-white/40 dark:bg-black/20 px-1.5 py-0.5 rounded text-xs">
              {btn.count}
            </span>
          </button>
        ))}
      </div>
      {activeFilter && activeFilter !== "all" && (
        <button
          type="button"
          onClick={handleSelectFiltered}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:underline font-medium px-3 py-2 -my-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
        >
          Select all filtered →
        </button>
      )}
    </div>
  );
}
