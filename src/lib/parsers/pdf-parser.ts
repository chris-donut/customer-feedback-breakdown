import { PDFParse } from "pdf-parse";

export interface PdfParseResult {
  text: string;
  pageCount: number;
  textBlocks: string[];
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  const parser = new PDFParse({ data: buffer });

  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo(),
    ]);

    const textBlocks = textResult.text
      .split(/\n\n+/)
      .map((block: string) => block.trim())
      .filter((block: string) => block.length > 0);

    return {
      text: textResult.text,
      pageCount: infoResult.pages.length,
      textBlocks,
    };
  } finally {
    await parser.destroy();
  }
}
