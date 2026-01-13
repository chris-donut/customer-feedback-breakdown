"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";

const ACCEPTED_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "text/csv": ".csv",
};

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  isUploading = false,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    const mimeType = file.type;

    const validExtension = ACCEPTED_EXTENSIONS.includes(extension);
    const validMime =
      mimeType === "" || Object.keys(ACCEPTED_TYPES).includes(mimeType);

    if (!validExtension) {
      setError(
        `Invalid file type. Accepted formats: ${ACCEPTED_EXTENSIONS.join(", ")}`
      );
      return false;
    }

    if (mimeType && !validMime) {
      setError(
        `Invalid file type. Accepted formats: ${ACCEPTED_EXTENSIONS.join(", ")}`
      );
      return false;
    }

    setError(null);
    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) {
        setIsDragOver(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleButtonClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const isDisabled = disabled || isUploading;

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[200px] p-8
          border-2 border-dashed rounded-lg
          transition-colors duration-200
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-zinc-300 dark:border-zinc-700"
          }
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600"}
          ${error ? "border-red-400 dark:border-red-600" : ""}
        `}
        onClick={handleButtonClick}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label="Upload file"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleButtonClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isDisabled}
          aria-hidden="true"
        />

        <svg
          className={`w-12 h-12 mb-4 ${isDragOver ? "text-blue-500" : "text-zinc-400 dark:text-zinc-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {isUploading ? (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <svg
              className="w-5 h-5 animate-spin"
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
            <span>Uploading...</span>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              PDF, Word (.doc, .docx), Excel (.xls, .xlsx), or CSV (.csv)
            </p>
          </>
        )}
      </div>

      {selectedFile && !error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Selected: <strong>{selectedFile.name}</strong>
          </span>
          <span className="text-zinc-400">
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
