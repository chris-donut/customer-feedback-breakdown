import { extractText } from "unpdf";

export interface PdfParseResult {
  text: string;
  pageCount: number;
  textBlocks: string[];
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  // Convert Buffer to Uint8Array for unpdf
  const uint8Array = new Uint8Array(buffer);

  // Extract text - only get serializable data
  const { text, totalPages } = await extractText(uint8Array, { mergePages: true });

  const textBlocks = text
    .split(/\n\n+/)
    .map((block: string) => block.trim())
    .filter((block: string) => block.length > 0);

  return {
    text,
    pageCount: totalPages,
    textBlocks,
  };
}
