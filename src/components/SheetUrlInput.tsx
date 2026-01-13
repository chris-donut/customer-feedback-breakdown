"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";

const GOOGLE_SHEETS_REGEX =
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

export interface SheetUrlInputProps {
  onImport: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SheetUrlInput({
  onImport,
  isLoading = false,
  disabled = false,
}: SheetUrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateUrl = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setError("Please enter a Google Sheets URL");
      return false;
    }

    if (!GOOGLE_SHEETS_REGEX.test(value)) {
      setError(
        "Invalid Google Sheets URL. Expected format: https://docs.google.com/spreadsheets/d/..."
      );
      return false;
    }

    setError(null);
    return true;
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setUrl(value);
      if (error && value.trim()) {
        setError(null);
      }
    },
    [error]
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (disabled || isLoading) return;

      if (validateUrl(url)) {
        onImport(url);
      }
    },
    [url, disabled, isLoading, validateUrl, onImport]
  );

  const handleImportClick = useCallback(() => {
    if (disabled || isLoading) return;

    if (validateUrl(url)) {
      onImport(url);
    }
  }, [url, disabled, isLoading, validateUrl, onImport]);

  const isDisabled = disabled || isLoading;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label
          htmlFor="sheet-url-input"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Google Sheets URL
        </label>

        <div className="flex gap-2">
          <input
            id="sheet-url-input"
            type="url"
            value={url}
            onChange={handleInputChange}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            disabled={isDisabled}
            className={`
              flex-1 px-4 py-2.5
              text-sm
              bg-white dark:bg-zinc-900
              border rounded-lg
              placeholder:text-zinc-400 dark:placeholder:text-zinc-500
              text-zinc-900 dark:text-zinc-100
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
              ${error ? "border-red-400 dark:border-red-600" : "border-zinc-300 dark:border-zinc-700"}
            `}
          />

          <button
            type="submit"
            disabled={isDisabled || !url.trim()}
            onClick={handleImportClick}
            className={`
              px-5 py-2.5
              text-sm font-medium
              text-white
              bg-blue-600 hover:bg-blue-700
              rounded-lg
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
              flex items-center gap-2
            `}
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
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
                <span>Importing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span>Import</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sheet must be publicly accessible (Anyone with the link can view)
        </p>
      </form>
    </div>
  );
}
