"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type ProcessedFeedback,
} from "@/lib/types";

export interface FeedbackTableProps {
  items: ProcessedFeedback[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onItemUpdate?: (itemId: string, updates: Partial<Pick<ProcessedFeedback, "generatedTitle" | "category">>) => void;
  editedIds?: Set<string>;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "text-emerald-600 dark:text-emerald-400";
  if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
  if (confidence >= 0.7) return "text-amber-600 dark:text-amber-400";
  if (confidence >= 0.5) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getConfidenceBar(confidence: number): string {
  if (confidence >= 0.9) return "bg-emerald-500";
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.7) return "bg-amber-500";
  if (confidence >= 0.5) return "bg-orange-500";
  return "bg-red-500";
}

// Category styling with distinctive icons and colors
const CATEGORY_CONFIG: Record<FeedbackCategory, { bg: string; text: string; icon: string; border: string }> = {
  "Bug": {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  },
  "Feature Request": {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
  },
  "UI/UX Issue": {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
  },
  "AI Hallucination": {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
  },
  "New Feature": {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    icon: "M12 6v6m0 0v6m0-6h6m-6 0H6"
  },
  "Documentation": {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
  },
};

interface EditableTitleProps {
  value: string;
  onChange: (newValue: string) => void;
  isEdited: boolean;
}

function EditableTitle({ value, onChange, isEdited }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  }, [editValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [handleSave, value]
  );

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        rows={2}
        className="w-full px-3 py-2 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="group text-left w-full"
      title="Click to edit title"
    >
      <h3 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {value}
        {isEdited && (
          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Edited" />
        )}
      </h3>
      <span className="text-xs text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to edit
      </span>
    </button>
  );
}

interface CategorySelectorProps {
  value: FeedbackCategory;
  onChange: (newValue: FeedbackCategory) => void;
}

function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const config = CATEGORY_CONFIG[value];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FeedbackCategory)}
        className={`appearance-none pl-8 pr-8 py-1.5 rounded-lg text-sm font-medium cursor-pointer border ${config.bg} ${config.text} ${config.border} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:shadow-sm`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.5rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1rem 1rem",
        }}
      >
        {FEEDBACK_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <svg
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${config.text} pointer-events-none`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
      </svg>
    </div>
  );
}

interface FeedbackCardProps {
  item: ProcessedFeedback;
  isSelected: boolean;
  isEdited: boolean;
  onSelect: () => void;
  onTitleChange?: (newTitle: string) => void;
  onCategoryChange?: (newCategory: FeedbackCategory) => void;
}

function FeedbackCard({
  item,
  isSelected,
  isEdited,
  onSelect,
  onTitleChange,
  onCategoryChange,
}: FeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = CATEGORY_CONFIG[item.category];
  const shouldTruncate = item.originalText.length > 200;

  return (
    <div
      className={`
        relative rounded-xl border transition-all duration-200
        ${isSelected
          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-100 dark:shadow-blue-950"
          : isEdited
            ? "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
        }
      `}
    >
      {/* Selection checkbox - floating top-left */}
      <div className="absolute top-4 left-4 z-10">
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="peer sr-only"
            aria-label={`Select: ${item.generatedTitle}`}
          />
          <div className={`
            w-5 h-5 rounded-md border-2 transition-all
            ${isSelected
              ? "bg-blue-600 border-blue-600"
              : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 peer-hover:border-blue-400"
            }
          `}>
            {isSelected && (
              <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* Confidence indicator - top-right */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getConfidenceBar(item.confidence)} transition-all duration-500`}
              style={{ width: `${item.confidence * 100}%` }}
            />
          </div>
          <span className={`text-xs font-mono font-medium ${getConfidenceColor(item.confidence)}`}>
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-12 px-5 pb-5">
        {/* Title */}
        <div className="mb-4">
          {onTitleChange ? (
            <EditableTitle
              value={item.generatedTitle}
              onChange={onTitleChange}
              isEdited={isEdited}
            />
          ) : (
            <h3 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {item.generatedTitle}
            </h3>
          )}
        </div>

        {/* Original text */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Original Feedback
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className={`relative ${!isExpanded && shouldTruncate ? 'max-h-24 overflow-hidden' : ''}`}>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {item.originalText}
            </p>
            {!isExpanded && shouldTruncate && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pointer-events-none" />
            )}
          </div>
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {isExpanded ? '← Show less' : 'Read more →'}
            </button>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {onCategoryChange ? (
            <CategorySelector value={item.category} onChange={onCategoryChange} />
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
              </svg>
              {item.category}
            </span>
          )}

          {isEdited && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Modified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeedbackTable({
  items,
  selectedIds,
  onSelectionChange,
  onItemUpdate,
  editedIds = new Set(),
}: FeedbackTableProps) {
  const allSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const someSelected = useMemo(
    () =>
      items.some((item) => selectedIds.has(item.id)) &&
      !items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((item) => item.id)));
    }
  }, [allSelected, items, onSelectionChange]);

  const handleSelectItem = useCallback(
    (itemId: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      onSelectionChange(newSelected);
    },
    [selectedIds, onSelectionChange]
  );

  const handleTitleChange = useCallback(
    (itemId: string, newTitle: string) => {
      onItemUpdate?.(itemId, { generatedTitle: newTitle });
    },
    [onItemUpdate]
  );

  const handleCategoryChange = useCallback(
    (itemId: string, newCategory: FeedbackCategory) => {
      onItemUpdate?.(itemId, { category: newCategory });
    },
    [onItemUpdate]
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No feedback items to display</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Upload a document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions header */}
      <div className="flex items-center justify-between px-1 py-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={handleSelectAll}
              className="peer sr-only"
              aria-label="Select all items"
            />
            <div className={`
              w-5 h-5 rounded-md border-2 transition-all
              ${allSelected
                ? "bg-blue-600 border-blue-600"
                : someSelected
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400"
              }
            `}>
              {allSelected && (
                <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {someSelected && !allSelected && (
                <svg className="w-full h-full text-white p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
            {allSelected ? 'Deselect all' : someSelected ? `${selectedIds.size} selected` : 'Select all'}
          </span>
        </label>

        <span className="text-sm text-zinc-400 dark:text-zinc-500">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4">
        {items.map((item) => (
          <FeedbackCard
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            isEdited={editedIds.has(item.id)}
            onSelect={() => handleSelectItem(item.id)}
            onTitleChange={onItemUpdate ? (newTitle) => handleTitleChange(item.id, newTitle) : undefined}
            onCategoryChange={onItemUpdate ? (newCategory) => handleCategoryChange(item.id, newCategory) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
