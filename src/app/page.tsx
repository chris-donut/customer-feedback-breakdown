"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { SheetUrlInput } from "@/components/SheetUrlInput";
import { ProgressStepper } from "@/components/ProgressStepper";

export default function Home() {
  const router = useRouter();
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [strategicPlanOpen, setStrategicPlanOpen] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProcessing = isFileUploading || isSheetLoading;

  const handleSaveStrategicPlan = async () => {
    setSavingPlan(true);
    setPlanSaved(false);
    try {
      // Save to context - in a real app this would call an API
      localStorage.setItem("strategicPlan", strategicPlan);
      setPlanSaved(true);
      setTimeout(() => setPlanSaved(false), 3000);
    } finally {
      setSavingPlan(false);
    }
  };

  const processAndNavigate = async (items: Array<{ id: string; originalText: string }>) => {
    // Call /api/process to get AI-generated titles and categories
    const processResponse = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const text = await processResponse.text();

    if (!processResponse.ok) {
      let errorMessage = "Failed to process feedback";
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    let processedData;
    try {
      processedData = JSON.parse(text);
    } catch {
      throw new Error("Invalid response from server during processing");
    }

    // Store in sessionStorage to avoid URL length limits
    sessionStorage.setItem("feedbackData", JSON.stringify(processedData.items));

    // Navigate to review page
    router.push("/review");
  };

  const handleFileSelect = async (file: File) => {
    setIsFileUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadText = await uploadResponse.text();

      if (!uploadResponse.ok) {
        let errorMessage = "Failed to upload file";
        try {
          const errorData = JSON.parse(uploadText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = uploadText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let uploadData;
      try {
        uploadData = JSON.parse(uploadText);
      } catch {
        throw new Error("Invalid response from server during upload");
      }

      await processAndNavigate(uploadData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsFileUploading(false);
    }
  };

  const handleSheetImport = async (urls: string[]) => {
    setIsSheetLoading(true);
    setError(null);

    try {
      // Fetch all sheets in parallel
      const parsePromises = urls.map(async (url) => {
        const parseResponse = await fetch("/api/parse-sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!parseResponse.ok) {
          const text = await parseResponse.text();
          let errorMessage = `Failed to parse: ${url}`;
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const text = await parseResponse.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Invalid response from server for: ${url}`);
        }
      });

      const results = await Promise.all(parsePromises);

      // Combine all items from all sheets
      const allItems = results.flatMap((data) => data.items || []);

      if (allItems.length === 0) {
        throw new Error("No feedback items found in the provided sheets. Make sure the sheet is publicly accessible.");
      }

      await processAndNavigate(allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsSheetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper currentStep="upload" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Customer Feedback Breakdown
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Analyze feedback documents, categorize issues, and post to Linear
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

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

          {/* Strategic Context - Collapsible */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setStrategicPlanOpen(!strategicPlanOpen)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Strategic Context
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Add your strategic plan for better AI categorization
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-zinc-400 transition-transform ${strategicPlanOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {strategicPlanOpen && (
              <div className="px-6 pb-6 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <textarea
                  value={strategicPlan}
                  onChange={(e) => setStrategicPlan(e.target.value)}
                  placeholder="Enter your product strategy, priorities, and goals. This helps the AI better categorize feedback items..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveStrategicPlan}
                    disabled={savingPlan || !strategicPlan.trim()}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      savingPlan || !strategicPlan.trim()
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {savingPlan ? "Saving..." : "Save Context"}
                  </button>
                  {planSaved && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Context saved
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
