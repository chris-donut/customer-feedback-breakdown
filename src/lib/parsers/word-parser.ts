import mammoth from "mammoth";

export interface WordParseResult {
  text: string;
  textBlocks: string[];
}

export async function parseWord(buffer: Buffer): Promise<WordParseResult> {
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
