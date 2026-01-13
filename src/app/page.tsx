"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { SheetUrlInput } from "@/components/SheetUrlInput";

export default function Home() {
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(false);

  const isProcessing = isFileUploading || isSheetLoading;

  const handleFileSelect = async (file: File) => {
    console.log("File selected:", file.name, file.type, file.size);
    setIsFileUploading(true);
    // TODO: Wire up API call in US-028
    setTimeout(() => setIsFileUploading(false), 1000);
  };

  const handleSheetImport = async (url: string) => {
    console.log("Sheet URL:", url);
    setIsSheetLoading(true);
    // TODO: Wire up API call in US-028
    setTimeout(() => setIsSheetLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Customer Feedback Breakdown
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Analyze feedback documents, categorize issues, and post to Linear
          </p>
        </div>

        {isProcessing && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-blue-700 dark:text-blue-300">
            <svg
              className="h-5 w-5 animate-spin"
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
            <span className="font-medium">Processing feedback...</span>
          </div>
        )}

        <div className="space-y-8">
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Upload Document
            </h2>
            <FileUpload
              onFileSelect={handleFileSelect}
              isUploading={isFileUploading}
              disabled={isProcessing}
            />
          </section>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-50 dark:bg-black px-4 text-sm text-zinc-500 dark:text-zinc-400">
                or
              </span>
            </div>
          </div>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Import from Google Sheets
            </h2>
            <SheetUrlInput
              onImport={handleSheetImport}
              isLoading={isSheetLoading}
              disabled={isProcessing}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
