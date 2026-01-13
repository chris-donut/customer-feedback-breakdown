export type FeedbackCategory =
  | "Bug"
  | "Feature Request"
  | "UI/UX Issue"
  | "AI Hallucination"
  | "New Feature"
  | "Documentation";

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "Bug",
  "Feature Request",
  "UI/UX Issue",
  "AI Hallucination",
  "New Feature",
  "Documentation",
];

export interface ProcessedFeedback {
  id: string;
  originalText: string;
  generatedTitle: string;
  category: FeedbackCategory;
  confidence: number;
}
