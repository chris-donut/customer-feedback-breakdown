"use client";

import { FileUpload } from "@/components/FileUpload";

export default function Home() {
  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name, file.type, file.size);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Customer Feedback Breakdown
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Analyze feedback documents, categorize issues, and post to Linear
        </p>

        <div className="w-full mt-4">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
      </main>
    </div>
  );
}
