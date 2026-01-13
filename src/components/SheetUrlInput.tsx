"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";

const GOOGLE_SHEETS_REGEX =
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

export interface SheetUrlInputProps {
  onImport: (urls: string[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface UrlValidation {
  url: string;
  valid: boolean;
  error?: string;
}

export function SheetUrlInput({
  onImport,
  isLoading = false,
  disabled = false,
}: SheetUrlInputProps) {
  const [urlsText, setUrlsText] = useState("");
  const [validationResults, setValidationResults] = useState<UrlValidation[]>([]);

  const parseUrls = useCallback((text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  }, []);

  const validateUrls = useCallback((urls: string[]): UrlValidation[] => {
    return urls.map((url) => {
      if (!GOOGLE_SHEETS_REGEX.test(url)) {
        return {
          url,
          valid: false,
          error: "Invalid Google Sheets URL format",
        };
      }
      return { url, valid: true };
    });
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setUrlsText(value);

      // Clear validation when editing
      if (validationResults.length > 0) {
        setValidationResults([]);
      }
    },
    [validationResults.length]
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (disabled || isLoading) return;

      const urls = parseUrls(urlsText);

      if (urls.length === 0) {
        setValidationResults([{ url: "", valid: false, error: "Please enter at least one Google Sheets URL" }]);
        return;
      }

      const results = validateUrls(urls);
      const invalidResults = results.filter((r) => !r.valid);

      if (invalidResults.length > 0) {
        setValidationResults(invalidResults);
        return;
      }

      setValidationResults([]);
      onImport(urls);
    },
    [urlsText, disabled, isLoading, parseUrls, validateUrls, onImport]
  );

  const isDisabled = disabled || isLoading;
  const urlCount = parseUrls(urlsText).length;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label
          htmlFor="sheet-url-input"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Google Sheets URLs
          {urlCount > 0 && (
            <span className="ml-2 text-zinc-500 dark:text-zinc-400 font-normal">
              ({urlCount} URL{urlCount !== 1 ? "s" : ""})
            </span>
          )}
        </label>

        <textarea
          id="sheet-url-input"
          value={urlsText}
          onChange={handleInputChange}
          placeholder="Paste one or more Google Sheets URLs (one per line or comma-separated)&#10;&#10;https://docs.google.com/spreadsheets/d/abc123...&#10;https://docs.google.com/spreadsheets/d/xyz789..."
          disabled={isDisabled}
          rows={4}
          className={`
            w-full px-4 py-3
            text-sm font-mono
            bg-white dark:bg-zinc-900
            border rounded-lg
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            text-zinc-900 dark:text-zinc-100
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            resize-none
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
            ${validationResults.length > 0 ? "border-red-400 dark:border-red-600" : "border-zinc-300 dark:border-zinc-700"}
          `}
        />

        {validationResults.length > 0 && (
          <div className="flex flex-col gap-1">
            {validationResults.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
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
                <span>
                  {result.error}
                  {result.url && (
                    <span className="block text-xs text-red-500 dark:text-red-500 truncate max-w-md">
                      {result.url}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sheets must be publicly accessible (Anyone with the link can view)
          </p>

          <button
            type="submit"
            disabled={isDisabled || urlCount === 0}
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
                <span>Import {urlCount > 1 ? `${urlCount} Sheets` : "Sheet"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
