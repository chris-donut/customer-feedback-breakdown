"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  ISSUE_TYPES,
  ISSUE_SOURCES,
  PRIORITIES,
  type IssueType,
  type IssueSource,
  type Priority,
  type ProcessedFeedback,
} from "@/lib/types";
import { type HistoryEntry } from "@/lib/feedback-storage";

export interface FeedbackTableProps {
  items: ProcessedFeedback[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onItemUpdate?: (itemId: string, updates: Partial<Pick<ProcessedFeedback, "generatedTitle" | "category" | "issueType" | "issueSource" | "priority" | "sourceUrl">>) => void;
  editedIds?: Set<string>;
  postedMap?: Map<string, HistoryEntry>;
  onDeleteItem?: (itemId: string) => void;
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

// Issue Type styling with distinctive icons and colors
const ISSUE_TYPE_CONFIG: Record<IssueType, { bg: string; text: string; icon: string; border: string }> = {
  "Bug": {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  },
  "Feature": {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
  },
  "Improvement": {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
  },
  "Design": {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
  },
  "Security": {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
  },
  "Infrastructure": {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
  },
  "gtm": {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
  },
};

// Priority styling
const PRIORITY_CONFIG: Record<Priority, { bg: string; text: string; label: string }> = {
  0: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-500 dark:text-zinc-400", label: "None" },
  1: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", label: "Urgent" },
  2: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "High" },
  3: { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", label: "Medium" },
  4: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", label: "Low" },
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

interface EditableSourceUrlProps {
  value: string;
  onChange: (newValue: string) => void;
}

function EditableSourceUrl({ value, onChange }: EditableSourceUrlProps) {
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
    if (trimmed !== value) {
      onChange(trimmed);
    }
    setIsEditing(false);
  }, [editValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
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
      <input
        ref={inputRef}
        type="url"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="https://example.com/feedback-source"
        className="w-full px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 group">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {value.length > 50 ? value.substring(0, 50) + "..." : value}
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-blue-500 transition-all"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      Add source URL
    </button>
  );
}

interface IssueTypeSelectorProps {
  value: IssueType;
  onChange: (newValue: IssueType) => void;
}

function IssueTypeSelector({ value, onChange }: IssueTypeSelectorProps) {
  const config = ISSUE_TYPE_CONFIG[value];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IssueType)}
        className={`appearance-none pl-8 pr-8 py-1.5 rounded-lg text-sm font-medium cursor-pointer border ${config.bg} ${config.text} ${config.border} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:shadow-sm`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.5rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1rem 1rem",
        }}
      >
        {ISSUE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
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

interface PrioritySelectorProps {
  value: Priority;
  onChange: (newValue: Priority) => void;
}

function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const config = PRIORITY_CONFIG[value];

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as Priority)}
      className={`appearance-none px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${config.bg} ${config.text} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:shadow-sm`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundPosition: "right 0.25rem center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "0.75rem 0.75rem",
        paddingRight: "1.5rem",
      }}
    >
      {PRIORITIES.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}

interface IssueSourceSelectorProps {
  value: IssueSource;
  onChange: (newValue: IssueSource) => void;
}

function IssueSourceSelector({ value, onChange }: IssueSourceSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IssueSource)}
      className="appearance-none px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:shadow-sm"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundPosition: "right 0.25rem center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "0.75rem 0.75rem",
        paddingRight: "1.5rem",
      }}
    >
      {ISSUE_SOURCES.map((source) => (
        <option key={source} value={source}>
          {source}
        </option>
      ))}
    </select>
  );
}

interface FeedbackCardProps {
  item: ProcessedFeedback;
  isSelected: boolean;
  isEdited: boolean;
  onSelect: () => void;
  onTitleChange?: (newTitle: string) => void;
  onIssueTypeChange?: (newType: IssueType) => void;
  onIssueSourceChange?: (newSource: IssueSource) => void;
  onPriorityChange?: (newPriority: Priority) => void;
  onSourceUrlChange?: (newUrl: string) => void;
  postedEntry?: HistoryEntry;
  onDelete?: () => void;
}

function FeedbackCard({
  item,
  isSelected,
  isEdited,
  onSelect,
  onTitleChange,
  onIssueTypeChange,
  onIssueSourceChange,
  onPriorityChange,
  onSourceUrlChange,
  postedEntry,
  onDelete,
}: FeedbackCardProps) {
  const issueTypeConfig = ISSUE_TYPE_CONFIG[item.issueType || "Improvement"];
  const priorityConfig = PRIORITY_CONFIG[item.priority ?? 3];
  const isAlreadyPosted = !!postedEntry;

  return (
    <div
      className={`
        rounded-xl border transition-all duration-200 overflow-hidden relative
        ${isAlreadyPosted
          ? "border-green-300 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20"
          : isSelected
            ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-100 dark:shadow-blue-950"
            : isEdited
              ? "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20"
              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
        }
      `}
    >
      {/* Already Posted Banner */}
      {isAlreadyPosted && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-green-100 dark:bg-green-900/40 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Already posted to Linear
            </span>
            {postedEntry.linearUrl && (
              <a
                href={postedEntry.linearUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 underline"
              >
                {postedEntry.linearIssueId || "View issue"}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Remove from queue"
            >
              Remove
            </button>
          )}
        </div>
      )}
      {/* Header row: checkbox, title, category, confidence */}
      <div className="flex items-start gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800">
        {/* Checkbox */}
        <label className="relative flex items-center cursor-pointer pt-1 flex-shrink-0">
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

        {/* Title - takes remaining space */}
        <div className="flex-1 min-w-0">
          {onTitleChange ? (
            <EditableTitle
              value={item.generatedTitle}
              onChange={onTitleChange}
              isEdited={isEdited}
            />
          ) : (
            <h3 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {item.generatedTitle}
              {isEdited && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Edited" />
              )}
            </h3>
          )}
        </div>

        {/* Issue Type */}
        <div className="flex-shrink-0">
          {onIssueTypeChange ? (
            <IssueTypeSelector value={item.issueType || "Improvement"} onChange={onIssueTypeChange} />
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${issueTypeConfig.bg} ${issueTypeConfig.text} ${issueTypeConfig.border}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={issueTypeConfig.icon} />
              </svg>
              {item.issueType || item.category}
            </span>
          )}
        </div>

        {/* Confidence score */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className={`text-sm font-mono font-bold ${getConfidenceColor(item.confidence)}`}>
            {Math.round(item.confidence * 100)}%
          </span>
          <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getConfidenceBar(item.confidence)} transition-all duration-500`}
              style={{ width: `${item.confidence * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">confidence</span>
        </div>
      </div>

      {/* Tags row: Priority, Issue Source */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Priority:</span>
          {onPriorityChange ? (
            <PrioritySelector value={item.priority ?? 3} onChange={onPriorityChange} />
          ) : (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}>
              {priorityConfig.label}
            </span>
          )}
        </div>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Source:</span>
          {onIssueSourceChange ? (
            <IssueSourceSelector value={item.issueSource || "user feedback"} onChange={onIssueSourceChange} />
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {item.issueSource || "user feedback"}
            </span>
          )}
        </div>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">State:</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            {item.state || "Backlog"}
          </span>
        </div>
      </div>

      {/* Original Feedback - full width, scrollable */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Original Feedback
          </span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="max-h-40 overflow-y-auto rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-700/50">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {item.originalText}
          </p>
        </div>

        {/* Chinese Translation */}
        {item.chineseTranslation && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Chinese Translation
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">中文翻译</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-4 border border-amber-100 dark:border-amber-900/50">
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                {item.chineseTranslation}
              </p>
            </div>
          </div>
        )}

        {/* Source URL */}
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Source URL
            </span>
            {onSourceUrlChange ? (
              <EditableSourceUrl
                value={item.sourceUrl || ""}
                onChange={onSourceUrlChange}
              />
            ) : item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                {item.sourceUrl.length > 50 ? item.sourceUrl.substring(0, 50) + "..." : item.sourceUrl}
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Not set</span>
            )}
          </div>
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
  postedMap = new Map(),
  onDeleteItem,
}: FeedbackTableProps) {
  // Sort items by priority (high priority first), then by confidence (high to low)
  // Priority: 1=Urgent, 2=High, 3=Medium, 4=Low, 0=None (treat 0 as lowest)
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => {
      // Convert priority 0 to 5 for sorting (so "No priority" appears last)
      const priorityA = a.priority === 0 ? 5 : (a.priority ?? 5);
      const priorityB = b.priority === 0 ? 5 : (b.priority ?? 5);

      // Sort by priority first (lower number = higher priority)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Then by confidence (higher confidence first)
      return b.confidence - a.confidence;
    }),
    [items]
  );

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

  const handleIssueTypeChange = useCallback(
    (itemId: string, newType: IssueType) => {
      onItemUpdate?.(itemId, { issueType: newType, category: newType });
    },
    [onItemUpdate]
  );

  const handleIssueSourceChange = useCallback(
    (itemId: string, newSource: IssueSource) => {
      onItemUpdate?.(itemId, { issueSource: newSource });
    },
    [onItemUpdate]
  );

  const handlePriorityChange = useCallback(
    (itemId: string, newPriority: Priority) => {
      onItemUpdate?.(itemId, { priority: newPriority });
    },
    [onItemUpdate]
  );

  const handleSourceUrlChange = useCallback(
    (itemId: string, newUrl: string) => {
      onItemUpdate?.(itemId, { sourceUrl: newUrl });
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

      {/* Cards grid - sorted by confidence (high to low) */}
      <div className="grid gap-4">
        {sortedItems.map((item) => (
          <FeedbackCard
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            isEdited={editedIds.has(item.id)}
            onSelect={() => handleSelectItem(item.id)}
            onTitleChange={onItemUpdate ? (newTitle) => handleTitleChange(item.id, newTitle) : undefined}
            onIssueTypeChange={onItemUpdate ? (newType) => handleIssueTypeChange(item.id, newType) : undefined}
            onIssueSourceChange={onItemUpdate ? (newSource) => handleIssueSourceChange(item.id, newSource) : undefined}
            onPriorityChange={onItemUpdate ? (newPriority) => handlePriorityChange(item.id, newPriority) : undefined}
            onSourceUrlChange={onItemUpdate ? (newUrl) => handleSourceUrlChange(item.id, newUrl) : undefined}
            postedEntry={postedMap.get(item.originalText)}
            onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
