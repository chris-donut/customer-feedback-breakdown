import { parsePdf } from "./pdf-parser";
import { parseWord } from "./word-parser";
import { parseExcel } from "./excel-parser";
import { parseGoogleSheet } from "./gsheet-parser";

export interface FeedbackItem {
  id: string;
  originalText: string;
}

export type SupportedFileType = "pdf" | "word" | "excel";

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  ".pdf": "pdf",
  ".doc": "word",
  ".docx": "word",
  ".xls": "excel",
  ".xlsx": "excel",
};

const MIME_TYPE_MAP: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/msword": "word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "word",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
};

export function detectFileType(
  filename: string,
  mimeType?: string
): SupportedFileType | null {
  if (mimeType && MIME_TYPE_MAP[mimeType]) {
    return MIME_TYPE_MAP[mimeType];
  }

  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? EXTENSION_MAP[ext] ?? null : null;
}

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function textBlocksToFeedbackItems(blocks: string[]): FeedbackItem[] {
  return blocks
    .filter((text) => text.trim().length > 0)
    .map((text) => ({
      id: generateId(),
      originalText: text.trim(),
    }));
}

function rowsToFeedbackItems(rows: string[][]): FeedbackItem[] {
  return rows
    .map((row) => {
      const text = row.filter((cell) => cell.length > 0).join(" - ");
      return text.trim();
    })
    .filter((text) => text.length > 0)
    .map((text) => ({
      id: generateId(),
      originalText: text,
    }));
}

export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<FeedbackItem[]> {
  const fileType = detectFileType(filename, mimeType);
  if (!fileType) {
    throw new Error(
      `Unsupported file type for "${filename}". Supported types: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)`
    );
  }

  switch (fileType) {
    case "pdf": {
      const result = await parsePdf(buffer);
      return textBlocksToFeedbackItems(result.textBlocks);
    }
    case "word": {
      const result = await parseWord(buffer);
      return textBlocksToFeedbackItems(result.textBlocks);
    }
    case "excel": {
      const result = await parseExcel(buffer);
      return rowsToFeedbackItems(result.rows);
    }
  }
}

export { parseGoogleSheet };

export async function parseGoogleSheetToFeedback(
  url: string
): Promise<FeedbackItem[]> {
  const result = await parseGoogleSheet(url);
  return rowsToFeedbackItems(result.rows);
}
