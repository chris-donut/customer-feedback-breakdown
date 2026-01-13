import { createIssue } from "@/lib/linear/client";
import { type ProcessedFeedback } from "./process-feedback";
import {
  LINEAR_STATE_IDS,
  LINEAR_ISSUE_TYPE_IDS,
  LINEAR_ISSUE_SOURCE_IDS,
} from "@/lib/types";

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

async function postSingleFeedback(
  item: ProcessedFeedback,
  options: PostToLinearOptions
): Promise<PostResult> {
  // Build label IDs from issue type and issue source
  const labelIds: string[] = [];
  if (item.issueType && LINEAR_ISSUE_TYPE_IDS[item.issueType]) {
    labelIds.push(LINEAR_ISSUE_TYPE_IDS[item.issueType]);
  }
  if (item.issueSource && LINEAR_ISSUE_SOURCE_IDS[item.issueSource]) {
    labelIds.push(LINEAR_ISSUE_SOURCE_IDS[item.issueSource]);
  }

  // Get state ID from workflow state
  const stateId = item.state ? LINEAR_STATE_IDS[item.state] : undefined;

  const description = `**Original Feedback:**\n\n${item.originalText}\n\n---\n*Issue Type: ${item.issueType} | Source: ${item.issueSource} | Confidence: ${Math.round(item.confidence * 100)}%*`;

  try {
    const result = await createIssue({
      title: item.generatedTitle,
      description,
      teamId: options.teamId,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
      stateId,
      priority: item.priority,
      projectId: item.projectId,
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

  // Use hardcoded Linear IDs from types.ts, no need to fetch labels
  const results = await Promise.all(
    items.map((item) => postSingleFeedback(item, options))
  );

  return results;
}

export interface PostSummary {
  total: number;
  successful: number;
  failed: number;
  byIssueType: Record<string, number>;
}

export function summarizeResults(results: PostResult[], items: ProcessedFeedback[]): PostSummary {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const byIssueType: Record<string, number> = {};

  for (const result of results) {
    if (result.success) {
      const item = itemMap.get(result.feedbackId);
      if (item) {
        const type = item.issueType || item.category;
        byIssueType[type] = (byIssueType[type] || 0) + 1;
      }
    }
  }

  return {
    total: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    byIssueType,
  };
}
