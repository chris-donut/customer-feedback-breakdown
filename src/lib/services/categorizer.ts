import { generateJSON } from "@/lib/ai/client";
import { readContext } from "@/lib/context-storage";
import {
  ISSUE_TYPES,
  ISSUE_SOURCES,
  PRIORITIES,
  type IssueType,
  type IssueSource,
  type Priority,
  type WorkflowState,
  type FeedbackCategory,
  FEEDBACK_CATEGORIES,
} from "@/lib/types";

export { FEEDBACK_CATEGORIES, type FeedbackCategory };

export interface CategorizationResult {
  category: FeedbackCategory;
  confidence: number;
  issueType: IssueType;
  issueSource: IssueSource;
  priority: Priority;
  state: WorkflowState;
}

export interface CategorizationOptions {
  confidenceThreshold?: number;
  codebaseContext?: string;
  strategicPlan?: string;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;

interface AICategorizationResponse {
  issueType: string;
  issueSource: string;
  priority: number;
  confidence: number;
}

export async function categorize(
  feedbackText: string,
  options: CategorizationOptions = {}
): Promise<CategorizationResult> {
  const {
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

  const systemPrompt = `You are a feedback categorization assistant for a product team. Analyze customer feedback and categorize it.

## Issue Types (choose one):
- Bug: Issues where existing functionality is broken or not working as expected
- Feature: Requests for completely new functionality
- Improvement: Suggestions to improve or extend existing features
- Design: UI/UX issues, visual problems, or user experience improvements
- Security: Security vulnerabilities or concerns
- Infrastructure: Backend, performance, or technical infrastructure issues
- gtm: Go-to-market related items (marketing, positioning, launch)

## Issue Sources (choose one based on context):
- user feedback: Direct feedback from end users
- product: Internally identified by product team
- team: From internal team members
- market research: From market research or competitive analysis
- data insight: From analytics or data analysis

## Priority (0-4):
- 0: No priority (unclear importance)
- 1: Urgent (critical issue, needs immediate attention)
- 2: High (important, should be addressed soon)
- 3: Medium (normal priority)
- 4: Low (nice to have, can wait)
${contextInfo}
Respond with JSON:
{
  "issueType": "one of: Bug, Feature, Improvement, Design, Security, Infrastructure, gtm",
  "issueSource": "one of: user feedback, product, team, market research, data insight",
  "priority": 0-4 number,
  "confidence": 0-1 number for categorization confidence
}

Analyze the feedback carefully. Most user feedback will be "user feedback" source. Prioritize based on impact and urgency.`;

  const response = await generateJSON<AICategorizationResponse>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: feedbackText },
    ],
    { temperature: 0.2 }
  );

  const issueType = normalizeIssueType(response.issueType);
  const issueSource = normalizeIssueSource(response.issueSource);
  const priority = normalizePriority(response.priority);
  const confidence = Math.max(0, Math.min(1, response.confidence));

  return {
    category: issueType, // For backwards compatibility
    confidence,
    issueType,
    issueSource,
    priority,
    state: "Backlog", // New issues always start in Backlog
  };
}

function normalizeIssueType(type: string): IssueType {
  const normalized = type.trim().toLowerCase();

  const typeMap: Record<string, IssueType> = {
    bug: "Bug",
    feature: "Feature",
    "feature request": "Feature",
    "new feature": "Feature",
    improvement: "Improvement",
    design: "Design",
    "ui/ux": "Design",
    "ui/ux issue": "Design",
    security: "Security",
    infrastructure: "Infrastructure",
    infra: "Infrastructure",
    gtm: "gtm",
    "go-to-market": "gtm",
    marketing: "gtm",
  };

  if (typeMap[normalized]) {
    return typeMap[normalized];
  }

  if (ISSUE_TYPES.includes(type as IssueType)) {
    return type as IssueType;
  }

  return "Improvement"; // Default
}

function normalizeIssueSource(source: string): IssueSource {
  const normalized = source.trim().toLowerCase();

  const sourceMap: Record<string, IssueSource> = {
    "user feedback": "user feedback",
    "userfeedback": "user feedback",
    "user": "user feedback",
    "feedback": "user feedback",
    "product": "product",
    "team": "team",
    "internal": "team",
    "market research": "market research",
    "research": "market research",
    "data insight": "data insight",
    "data": "data insight",
    "analytics": "data insight",
  };

  if (sourceMap[normalized]) {
    return sourceMap[normalized];
  }

  if (ISSUE_SOURCES.includes(source as IssueSource)) {
    return source as IssueSource;
  }

  return "user feedback"; // Default for most feedback
}

function normalizePriority(priority: number): Priority {
  const p = Math.round(priority);
  if (p >= 0 && p <= 4) {
    return p as Priority;
  }
  return 3; // Default to Medium
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
