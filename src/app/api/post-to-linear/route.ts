import { NextRequest, NextResponse } from "next/server";
import { type ProcessedFeedback } from "@/lib/services/process-feedback";
import {
  postToLinear,
  summarizeResults,
} from "@/lib/services/linear-poster";

interface PostToLinearRequest {
  items: ProcessedFeedback[];
  teamId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PostToLinearRequest = await request.json();

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
        typeof item.id !== "string" ||
        typeof item.originalText !== "string" ||
        typeof item.generatedTitle !== "string" ||
        typeof item.category !== "string" ||
        typeof item.confidence !== "number"
    );
    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          error:
            "Each item must have 'id', 'originalText', 'generatedTitle' (string), 'category' (string), and 'confidence' (number) properties",
        },
        { status: 400 }
      );
    }

    const results = await postToLinear(body.items, { teamId: body.teamId });
    const summary = summarizeResults(results, body.items);

    return NextResponse.json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    console.error("Post to Linear error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to post feedback items to Linear",
      },
      { status: 500 }
    );
  }
}
