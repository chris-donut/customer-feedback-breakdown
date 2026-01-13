import { NextRequest, NextResponse } from "next/server";
import { parseDocument, detectFileType } from "@/lib/parsers";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const filename = file.name;
    const mimeType = file.type;

    const fileType = detectFileType(filename, mimeType);
    if (!fileType) {
      const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
      const isValidMime = ALLOWED_MIME_TYPES.includes(mimeType);
      const isValidExt = ALLOWED_EXTENSIONS.includes(ext);

      if (!isValidMime && !isValidExt) {
        return NextResponse.json(
          {
            error: `Unsupported file type. Allowed types: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)`,
          },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const feedbackItems = await parseDocument(buffer, filename, mimeType);

    return NextResponse.json({
      success: true,
      filename,
      itemCount: feedbackItems.length,
      items: feedbackItems,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process uploaded file",
      },
      { status: 500 }
    );
  }
}
