export interface GSheetParseResult {
  rows: string[][];
  sheetId: string;
}

const GSHEET_URL_PATTERN =
  /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

export function extractSheetId(url: string): string | null {
  const match = url.match(GSHEET_URL_PATTERN);
  return match ? match[1] : null;
}

export async function parseGoogleSheet(url: string): Promise<GSheetParseResult> {
  const sheetId = extractSheetId(url);
  if (!sheetId) {
    throw new Error("Invalid Google Sheets URL");
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google Sheet: ${response.status} ${response.statusText}`
    );
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);

  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.length > 0));

  return {
    rows: nonEmptyRows,
    sheetId,
  };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i++;
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows;
}
