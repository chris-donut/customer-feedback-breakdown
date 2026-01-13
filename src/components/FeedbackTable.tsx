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
  if (confidence >= 0.9) {
    return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
  }
  if (confidence >= 0.8) {
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
  }
  if (confidence >= 0.7) {
    return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30";
  }
  if (confidence >= 0.5) {
    return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30";
  }
  return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
}

function getCategoryBadgeColor(category: FeedbackCategory): string {
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

interface EditableTitleCellProps {
  value: string;
  onChange: (newValue: string) => void;
  isEdited: boolean;
}

function EditableTitleCell({ value, onChange, isEdited }: EditableTitleCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (e.key === "Enter") {
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
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-left text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer focus:outline-none focus:underline"
        title="Click to edit"
      >
        {value}
      </button>
      {isEdited && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500" title="Edited" />
      )}
    </div>
  );
}

interface CategoryDropdownProps {
  value: FeedbackCategory;
  onChange: (newValue: FeedbackCategory) => void;
  isEdited: boolean;
}

function CategoryDropdown({ value, onChange, isEdited }: CategoryDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FeedbackCategory)}
        className={`appearance-none px-2.5 py-0.5 pr-7 rounded-full text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getCategoryBadgeColor(value)}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.25rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.25em 1.25em",
        }}
      >
        {FEEDBACK_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      {isEdited && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500" title="Edited" />
      )}
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
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        No feedback items to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                aria-label="Select all items"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Original Text
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Generated Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Category
            </th>
            <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isItemEdited = editedIds.has(item.id);
            return (
              <tr
                key={item.id}
                className={`
                  border-b border-zinc-100 dark:border-zinc-800
                  transition-colors
                  ${isItemEdited ? "bg-amber-50/40 dark:bg-amber-950/20" : ""}
                  ${selectedIds.has(item.id) ? "bg-blue-50/50 dark:bg-blue-950/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}
                `}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                    aria-label={`Select item: ${item.generatedTitle}`}
                  />
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
                    {item.originalText}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {onItemUpdate ? (
                    <EditableTitleCell
                      value={item.generatedTitle}
                      onChange={(newTitle) => handleTitleChange(item.id, newTitle)}
                      isEdited={isItemEdited}
                    />
                  ) : (
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.generatedTitle}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  {onItemUpdate ? (
                    <CategoryDropdown
                      value={item.category}
                      onChange={(newCategory) => handleCategoryChange(item.id, newCategory)}
                      isEdited={isItemEdited}
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(item.category)}`}
                    >
                      {item.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(item.confidence)}`}
                  >
                    {Math.round(item.confidence * 100)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
