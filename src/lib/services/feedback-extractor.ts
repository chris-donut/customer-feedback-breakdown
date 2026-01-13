import type { FeedbackItem } from "../parsers";

export interface RawDocumentContent {
  type: "text" | "rows";
  text?: string;
  rows?: string[][];
}

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const BULLET_PATTERNS = [
  /^[-•●◦▪▸►]\s+/,
  /^[*]\s+/,
  /^\d+[.)]\s+/,
  /^[a-zA-Z][.)]\s+/,
  /^\[\s*[xX]?\s*\]\s+/,
];

function isBulletOrNumberedItem(line: string): boolean {
  return BULLET_PATTERNS.some((pattern) => pattern.test(line.trim()));
}

function removeBulletPrefix(line: string): string {
  let result = line.trim();
  for (const pattern of BULLET_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function splitTextIntoFeedbackItems(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const items: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      if (currentParagraph.length > 0) {
        items.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
      continue;
    }

    if (isBulletOrNumberedItem(trimmedLine)) {
      if (currentParagraph.length > 0) {
        items.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
      items.push(removeBulletPrefix(trimmedLine));
    } else {
      currentParagraph.push(trimmedLine);
    }
  }

  if (currentParagraph.length > 0) {
    items.push(currentParagraph.join(" "));
  }

  return items.filter((item) => item.length > 0);
}

function rowsToFeedbackStrings(rows: string[][]): string[] {
  return rows
    .map((row) => {
      const nonEmptyCells = row.filter((cell) => cell.trim().length > 0);
      return nonEmptyCells.join(" - ");
    })
    .filter((text) => text.length > 0);
}

export function extractFeedbackItems(content: RawDocumentContent): FeedbackItem[] {
  let rawItems: string[];

  if (content.type === "rows" && content.rows) {
    rawItems = rowsToFeedbackStrings(content.rows);
  } else if (content.type === "text" && content.text) {
    rawItems = splitTextIntoFeedbackItems(content.text);
  } else {
    return [];
  }

  return rawItems.map((text) => ({
    id: generateId(),
    originalText: text,
  }));
}

export function extractFromText(text: string): FeedbackItem[] {
  return extractFeedbackItems({ type: "text", text });
}

export function extractFromRows(rows: string[][]): FeedbackItem[] {
  return extractFeedbackItems({ type: "rows", rows });
}
