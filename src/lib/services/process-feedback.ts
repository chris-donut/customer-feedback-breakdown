import { type FeedbackItem } from "@/lib/parsers";
import { generateTitle, type TitleGeneratorOptions } from "./title-generator";
import { categorize, type CategorizationOptions } from "./categorizer";
import { readContext } from "@/lib/context-storage";
import { type ProcessedFeedback } from "@/lib/types";

export { type ProcessedFeedback };

export interface ProcessFeedbackOptions {
  titleOptions?: Omit<TitleGeneratorOptions, "context">;
  categorizationOptions?: Omit<
    CategorizationOptions,
    "codebaseContext" | "strategicPlan"
  >;
}

export async function processFeedbackItem(
  item: FeedbackItem,
  titleOptions: TitleGeneratorOptions,
  categorizationOptions: CategorizationOptions
): Promise<ProcessedFeedback> {
  const [generatedTitle, categorization] = await Promise.all([
    generateTitle(item.originalText, titleOptions),
    categorize(item.originalText, categorizationOptions),
  ]);

  return {
    id: item.id,
    originalText: item.originalText,
    generatedTitle,
    category: categorization.category,
    confidence: categorization.confidence,
  };
}

export async function processFeedback(
  items: FeedbackItem[],
  options: ProcessFeedbackOptions = {}
): Promise<ProcessedFeedback[]> {
  const context = await readContext();

  const titleOptions: TitleGeneratorOptions = {
    ...options.titleOptions,
    context,
  };

  const categorizationOptions: CategorizationOptions = {
    ...options.categorizationOptions,
    codebaseContext: context.codebaseInfo
      ? JSON.stringify(context.codebaseInfo)
      : undefined,
    strategicPlan: context.strategicPlan,
  };

  const results = await Promise.all(
    items.map((item) =>
      processFeedbackItem(item, titleOptions, categorizationOptions)
    )
  );

  return results;
}
