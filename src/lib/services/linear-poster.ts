import { createIssue, listLabels, type LabelInfo } from "@/lib/linear/client";
import { type ProcessedFeedback } from "./process-feedback";
import { type FeedbackCategory } from "./categorizer";

export interface PostResult {
  feedbackId: string;
  linearIssueId?: string;
  linearUrl?: string;
  success: boolean;
  error?: string;
}

export interface PostToLinearOptions {
  teamId?: string;
}

const CATEGORY_LABEL_MAP: Record<FeedbackCategory, string> = {
  Bug: "Bug",
  "Feature Request": "Feature",
  "UI/UX Issue": "UX",
  "AI Hallucination": "AI",
  "New Feature": "Feature",
  Documentation: "Documentation",
};

async function findOrMatchLabel(
  category: FeedbackCategory,
  availableLabels: LabelInfo[]
): Promise<string | undefined> {
  const preferredName = CATEGORY_LABEL_MAP[category];
  const lowerPreferred = preferredName.toLowerCase();

  const exactMatch = availableLabels.find(
    (l) => l.name.toLowerCase() === lowerPreferred
  );
  if (exactMatch) {
    return exactMatch.id;
  }

  const partialMatch = availableLabels.find(
    (l) =>
      l.name.toLowerCase().includes(lowerPreferred) ||
      lowerPreferred.includes(l.name.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch.id;
  }

  const categoryMatch = availableLabels.find(
    (l) => l.name.toLowerCase() === category.toLowerCase()
  );
  if (categoryMatch) {
    return categoryMatch.id;
  }

  return undefined;
}

async function postSingleFeedback(
  item: ProcessedFeedback,
  labelMap: Map<FeedbackCategory, string | undefined>,
  options: PostToLinearOptions
): Promise<PostResult> {
  const labelId = labelMap.get(item.category);
  const labelIds = labelId ? [labelId] : undefined;

  const description = `**Original Feedback:**\n\n${item.originalText}\n\n---\n*Category: ${item.category} (${Math.round(item.confidence * 100)}% confidence)*`;

  try {
    const result = await createIssue({
      title: item.generatedTitle,
      description,
      teamId: options.teamId,
      labelIds,
    });

    if (result.success && result.issue) {
      return {
        feedbackId: item.id,
        linearIssueId: result.issue.id,
        linearUrl: result.url,
        success: true,
      };
    }

    return {
      feedbackId: item.id,
      success: false,
      error: result.error ?? "Unknown error creating issue",
    };
  } catch (error) {
    return {
      feedbackId: item.id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function postToLinear(
  items: ProcessedFeedback[],
  options: PostToLinearOptions = {}
): Promise<PostResult[]> {
  if (items.length === 0) {
    return [];
  }

  const availableLabels = await listLabels(options.teamId);

  const uniqueCategories = [...new Set(items.map((item) => item.category))];
  const labelMap = new Map<FeedbackCategory, string | undefined>();

  for (const category of uniqueCategories) {
    const labelId = await findOrMatchLabel(category, availableLabels);
    labelMap.set(category, labelId);
  }

  const results = await Promise.all(
    items.map((item) => postSingleFeedback(item, labelMap, options))
  );

  return results;
}

export interface PostSummary {
  total: number;
  successful: number;
  failed: number;
  byCategory: Record<FeedbackCategory, number>;
}

export function summarizeResults(results: PostResult[], items: ProcessedFeedback[]): PostSummary {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const byCategory: Record<FeedbackCategory, number> = {
    Bug: 0,
    "Feature Request": 0,
    "UI/UX Issue": 0,
    "AI Hallucination": 0,
    "New Feature": 0,
    Documentation: 0,
  };

  for (const result of results) {
    if (result.success) {
      const item = itemMap.get(result.feedbackId);
      if (item) {
        byCategory[item.category]++;
      }
    }
  }

  return {
    total: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    byCategory,
  };
}
