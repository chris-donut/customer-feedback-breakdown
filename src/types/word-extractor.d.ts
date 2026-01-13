declare module "word-extractor" {
  interface Document {
    getBody(): string;
    getFootnotes(): string;
    getEndnotes(): string;
    getHeaders(): string;
    getFooters(): string;
    getAnnotations(): string;
    getTextboxes(): string;
  }

  class WordExtractor {
    extract(input: string | Buffer): Promise<Document>;
  }

  export = WordExtractor;
}
