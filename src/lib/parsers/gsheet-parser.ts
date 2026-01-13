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

  const response = await fetch(csvUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FeedbackBot/1.0)',
    },
  });

  if (!response.ok) {
    // Check if it's a redirect that wasn't followed
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectResponse = await fetch(location, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FeedbackBot/1.0)',
          },
        });
        if (redirectResponse.ok) {
          const csvText = await redirectResponse.text();
          const rows = parseCsv(csvText);
          const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.length > 0));
          return { rows: nonEmptyRows, sheetId };
        }
      }
    }
    throw new Error(
      `Failed to fetch Google Sheet: ${response.status} ${response.statusText}. Make sure the sheet is publicly accessible (Share → Anyone with the link).`
    );
  }

  const csvText = await response.text();

  // Check if Google returned HTML instead of CSV (login/captcha page)
  if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
    console.error('Google returned HTML instead of CSV. First 500 chars:', csvText.substring(0, 500));
    throw new Error(
      'Google Sheets returned a login page instead of data. This can happen when accessing from cloud servers. Please try using the Google Sheets API with a service account, or copy-paste the data directly.'
    );
  }

  const rows = parseCsv(csvText);

  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.length > 0));

  if (nonEmptyRows.length === 0) {
    throw new Error('No data found in the Google Sheet. Make sure the sheet contains data in the first tab.');
  }

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
