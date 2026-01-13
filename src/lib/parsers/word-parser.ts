import mammoth from "mammoth";

export interface WordParseResult {
  text: string;
  textBlocks: string[];
}

export async function parseWord(buffer: Buffer): Promise<WordParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    const textBlocks = result.value
      .split(/\n\n+/)
      .map((block: string) => block.trim())
      .filter((block: string) => block.length > 0);

    return {
      text: result.value,
      textBlocks,
    };
  } catch (error) {
    // Check if this is a "not a zip file" error - likely means it's an old .doc format
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("central directory") || errorMessage.includes("zip")) {
      throw new Error(
        "Unable to read this Word document. This may be an old .doc format file. " +
        "Please save it as .docx (Word 2007+ format) and try again. " +
        "In Microsoft Word: File → Save As → select 'Word Document (.docx)'"
      );
    }
    throw error;
  }
}
