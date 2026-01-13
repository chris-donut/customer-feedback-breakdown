import { NextRequest, NextResponse } from "next/server";
import { parseGoogleSheet, extractSheetId } from "@/lib/parsers/gsheet-parser";

// Generate unique feedback item ID
function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Convert sheet rows to feedback items
function rowsToFeedbackItems(rows: string[][]) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    const sheetId = extractSheetId(trimmedUrl);
    if (!sheetId) {
      return NextResponse.json(
        {
          error:
            "Invalid Google Sheets URL. Expected format: https://docs.google.com/spreadsheets/d/{spreadsheetId}/...",
        },
        { status: 400 }
      );
    }

    const sheetData = await parseGoogleSheet(trimmedUrl);
    const feedbackItems = rowsToFeedbackItems(sheetData.rows);

    return NextResponse.json({
      success: true,
      sheetId,
      itemCount: feedbackItems.length,
      items: feedbackItems,
    });
  } catch (error) {
    console.error("Parse sheet error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse Google Sheet",
      },
      { status: 500 }
    );
  }
}
