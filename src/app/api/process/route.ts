import { NextRequest, NextResponse } from "next/server";
import { type FeedbackItem } from "@/lib/parsers";
import { processFeedback } from "@/lib/services/process-feedback";

interface ProcessRequest {
  items: FeedbackItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Request body must contain an 'items' array" },
        { status: 400 }
      );
    }

    if (body.items.length === 0) {
      return NextResponse.json(
        { error: "Items array cannot be empty" },
        { status: 400 }
      );
    }

    const invalidItems = body.items.filter(
      (item) =>
        typeof item.id !== "string" || typeof item.originalText !== "string"
    );
    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          error:
            "Each item must have 'id' (string) and 'originalText' (string) properties",
        },
        { status: 400 }
      );
    }

    const processedItems = await processFeedback(body.items);

    return NextResponse.json({
      success: true,
      itemCount: processedItems.length,
      items: processedItems,
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process feedback items",
      },
      { status: 500 }
    );
  }
}
