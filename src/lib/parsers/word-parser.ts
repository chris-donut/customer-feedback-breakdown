import mammoth from "mammoth";
import WordExtractor from "word-extractor";

export interface WordParseResult {
  text: string;
  textBlocks: string[];
}

// Use word-extractor for old .doc files (binary OLE format)
async function parseDocWithWordExtractor(buffer: Buffer): Promise<WordParseResult> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);

  const text = doc.getBody();
  const textBlocks = text
    .split(/\n\n+/)
    .map((block: string) => block.trim())
    .filter((block: string) => block.length > 0);

  return {
    text,
    textBlocks,
  };
}

// Use mammoth for .docx files (modern XML-based format)
async function parseDocxWithMammoth(buffer: Buffer): Promise<WordParseResult> {
  const result = await mammoth.extractRawText({ buffer });

  const textBlocks = result.value
    .split(/\n\n+/)
    .map((block: string) => block.trim())
    .filter((block: string) => block.length > 0);

  return {
    text: result.value,
    textBlocks,
  };
}

export async function parseWord(buffer: Buffer, filename?: string): Promise<WordParseResult> {
  const isDocFile = filename?.toLowerCase().endsWith('.doc') && !filename?.toLowerCase().endsWith('.docx');

  // For .doc files, use word-extractor directly
  if (isDocFile) {
    try {
      return await parseDocWithWordExtractor(buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse .doc file: ${errorMessage}`);
    }
  }

  // For .docx files, try mammoth first, fall back to word-extractor
  try {
    return await parseDocxWithMammoth(buffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If mammoth fails with "not a zip" error, try word-extractor (might be mislabeled .doc)
    if (errorMessage.includes("central directory") || errorMessage.includes("zip")) {
      try {
        return await parseDocWithWordExtractor(buffer);
      } catch {
        throw new Error(
          "Unable to read this Word document. The file may be corrupted or in an unsupported format."
        );
      }
    }
    throw error;
  }
}
