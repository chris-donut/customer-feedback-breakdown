// Issue Type labels from Linear
export type IssueType =
  | "Bug"
  | "Feature"
  | "Improvement"
  | "Design"
  | "Security"
  | "Infrastructure"
  | "gtm";

export const ISSUE_TYPES: IssueType[] = [
  "Bug",
  "Feature",
  "Improvement",
  "Design",
  "Security",
  "Infrastructure",
  "gtm",
];

// Issue Source labels from Linear
export type IssueSource =
  | "user feedback"
  | "product"
  | "team"
  | "market research"
  | "data insight";

export const ISSUE_SOURCES: IssueSource[] = [
  "user feedback",
  "product",
  "team",
  "market research",
  "data insight",
];

// Priority levels (Linear uses 0-4)
export type Priority = 0 | 1 | 2 | 3 | 4;

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 0, label: "No priority" },
  { value: 1, label: "Urgent" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" },
];

// Workflow states from Linear GTM team
export type WorkflowState =
  | "Backlog"
  | "Todo"
  | "In Progress"
  | "In Review"
  | "Done"
  | "Canceled"
  | "Duplicate";

export const WORKFLOW_STATES: WorkflowState[] = [
  "Backlog",
  "Todo",
  "In Progress",
  "In Review",
  "Done",
  "Canceled",
  "Duplicate",
];

// Linear ID mappings
export const LINEAR_STATE_IDS: Record<WorkflowState, string> = {
  "Backlog": "ec15d9a7-c041-4332-af21-dd7ad157a820",
  "Todo": "9e09bc56-e7e0-4a21-bf3a-eb488d43f9eb",
  "In Progress": "e2e4074a-b013-4d89-9549-625f8bc35876",
  "In Review": "2976b2b7-025b-48c1-925d-387407674470",
  "Done": "1a60dbc4-eaf3-4ccd-9e31-e90530f839bf",
  "Canceled": "39fd7ff7-a594-4979-8d44-2a95edef835f",
  "Duplicate": "1f1518ba-cf2b-4b3a-ae4a-b58ae4b6ab34",
};

export const LINEAR_ISSUE_TYPE_IDS: Record<IssueType, string> = {
  "Bug": "c9e45eb6-2cf6-4798-893f-83f4763efac2",
  "Feature": "29139b5a-794e-4677-8fb0-3de4ee7a0111",
  "Improvement": "5dd8bdd8-296c-4e47-bc95-3ba43e515bd6",
  "Design": "53e860ad-f61f-4ef3-b885-369f9c6ee255",
  "Security": "24d96c2c-5f2b-4bb6-9909-24603cf087b7",
  "Infrastructure": "d4b14aaf-6b95-4bba-acbe-414491432cdb",
  "gtm": "9083697f-3440-4804-8c7e-c04e4e8f080b",
};

export const LINEAR_ISSUE_SOURCE_IDS: Record<IssueSource, string> = {
  "user feedback": "dd983c52-864a-45f0-9456-8a5ce4012f69",
  "product": "9b926056-55b9-424d-b2b6-32504b22eac7",
  "team": "b159edde-a146-4a76-bbc4-317e6187a093",
  "market research": "8d6ea2a4-9124-4594-a61b-e36927a4fe46",
  "data insight": "e7c622a7-3f86-41f7-a11c-06fac1c4ffa6",
};

// Projects from Linear
export const LINEAR_PROJECTS: { id: string; name: string }[] = [
  { id: "57fe7f48-a707-400c-8113-fc9bcaf33c6b", name: "Donut HIL User Feedback 用户对产品的建议" },
  { id: "c202443f-dd1a-4e8a-86dc-9962cad0a356", name: "Donut HIL User Feedback Loop 产品反馈AI自动化" },
  { id: "e68518b7-d5b2-4e48-809e-0df8f5b922c4", name: "Donut AI Agent Launch Plan 冷启动方案" },
  { id: "94b69a55-2a5a-43f5-b8b4-6ea4f1afcfbd", name: "Donut AI Narrative 叙事升级" },
  { id: "2d0418f2-3541-41d2-bc5a-482ca2205e02", name: "Donut HIL Users Document 用户手册" },
  { id: "98f64fe2-297f-419b-8636-a42127f4fc53", name: "Donut HIL Users Interview 用户调研" },
  { id: "c18a86d3-6e73-46a1-95c4-718d46ad2eba", name: "Donut KOL Plan & Budgeting" },
  { id: "cd86da96-b33f-461a-9c57-8bcf6a2e7ab3", name: "Donut KOC 管理" },
  { id: "1d3f30e2-e7a7-4930-b0b2-b0b9fdf0a06c", name: "Donut AI Glazy Mascot 相关" },
  { id: "7bc4d413-0b29-4932-9db1-e2a380883db5", name: "Donut HIL New Feature article/video 新功能上线视频文章物料" },
  { id: "69753166-db43-4771-bdca-a6601c0d6861", name: "Donut Browser" },
  { id: "aad989cd-8685-4261-980f-7513c2862486", name: "Donut Agents" },
];

// Legacy category type for backwards compatibility
export type FeedbackCategory = IssueType;
export const FEEDBACK_CATEGORIES = ISSUE_TYPES;

export interface ProcessedFeedback {
  id: string;
  originalText: string;
  generatedTitle: string;
  category: FeedbackCategory;
  confidence: number;
  // New Linear fields
  issueType: IssueType;
  issueSource: IssueSource;
  priority: Priority;
  state: WorkflowState;
  projectId?: string;
}
