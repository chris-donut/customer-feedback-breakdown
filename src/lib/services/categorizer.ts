import { generateJSON } from "@/lib/ai/client";
import { readContext } from "@/lib/context-storage";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/types";

export { FEEDBACK_CATEGORIES, type FeedbackCategory };

export interface CategorizationResult {
  category: FeedbackCategory;
  confidence: number;
}

export interface CategorizationOptions {
  confidenceThreshold?: number;
  codebaseContext?: string;
  strategicPlan?: string;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;

interface AICategorizationResponse {
  category: string;
  confidence: number;
}

export async function categorize(
  feedbackText: string,
  options: CategorizationOptions = {}
): Promise<CategorizationResult> {
  const {
    confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
    codebaseContext,
    strategicPlan,
  } = options;

  let contextInfo = "";
  if (codebaseContext || strategicPlan) {
    contextInfo = `\n\nContext for understanding the feedback:\n`;
    if (codebaseContext) {
      contextInfo += `Codebase: ${codebaseContext}\n`;
    }
    if (strategicPlan) {
      contextInfo += `Strategic Plan: ${strategicPlan}\n`;
    }
  }

  const systemPrompt = `You are a feedback categorization assistant. Analyze customer feedback and categorize it into one of these categories:

- Bug: Issues where existing functionality is broken or not working as expected
- Feature Request: Suggestions to improve or extend existing features
- UI/UX Issue: Problems with the user interface, design, or user experience
- AI Hallucination: Cases where AI produced incorrect, fabricated, or misleading output
- New Feature: Requests for completely new functionality that doesn't exist
- Documentation: Issues with documentation, help text, or user guides
${contextInfo}
Respond with a JSON object containing:
- category: one of the exact category names above
- confidence: a number from 0 to 1 representing how confident you are in the categorization

Be precise in your categorization. Use a lower confidence score if the feedback is ambiguous or could fit multiple categories.`;

  const response = await generateJSON<AICategorizationResponse>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: feedbackText },
    ],
    { temperature: 0.2 }
  );

  const category = normalizeCategory(response.category);
  const confidence = Math.max(0, Math.min(1, response.confidence));

  return {
    category,
    confidence: confidence >= confidenceThreshold ? confidence : confidence,
  };
}

function normalizeCategory(category: string): FeedbackCategory {
  const normalized = category.trim();

  const categoryMap: Record<string, FeedbackCategory> = {
    bug: "Bug",
    "feature request": "Feature Request",
    "ui/ux issue": "UI/UX Issue",
    "ui/ux": "UI/UX Issue",
    "uiux issue": "UI/UX Issue",
    "ai hallucination": "AI Hallucination",
    hallucination: "AI Hallucination",
    "new feature": "New Feature",
    documentation: "Documentation",
    docs: "Documentation",
  };

  const lowerCategory = normalized.toLowerCase();
  if (categoryMap[lowerCategory]) {
    return categoryMap[lowerCategory];
  }

  if (FEEDBACK_CATEGORIES.includes(normalized as FeedbackCategory)) {
    return normalized as FeedbackCategory;
  }

  return "Feature Request";
}

export async function categorizeMany(
  feedbackItems: { id: string; text: string }[],
  options: CategorizationOptions = {}
): Promise<Map<string, CategorizationResult>> {
  let contextOptions = options;

  if (!options.codebaseContext && !options.strategicPlan) {
    try {
      const context = await readContext();
      contextOptions = {
        ...options,
        codebaseContext: context.codebaseInfo
          ? JSON.stringify(context.codebaseInfo)
          : undefined,
        strategicPlan: context.strategicPlan,
      };
    } catch {
      // Context not available, proceed without it
    }
  }

  const results = new Map<string, CategorizationResult>();

  const categorizations = await Promise.all(
    feedbackItems.map(async (item) => {
      const result = await categorize(item.text, contextOptions);
      return { id: item.id, result };
    })
  );

  for (const { id, result } of categorizations) {
    results.set(id, result);
  }

  return results;
}
