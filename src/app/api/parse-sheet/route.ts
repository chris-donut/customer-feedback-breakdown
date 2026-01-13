import { NextRequest, NextResponse } from "next/server";
import {
  parseGoogleSheetToFeedback,
  parseGoogleSheet,
} from "@/lib/parsers";
import { extractSheetId } from "@/lib/parsers/gsheet-parser";

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

    const feedbackItems = await parseGoogleSheetToFeedback(trimmedUrl);

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
