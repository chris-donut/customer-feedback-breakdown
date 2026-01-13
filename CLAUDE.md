# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Customer Feedback Breakdown - A tool that analyzes customer feedback documents, categorizes issues by type, and posts them to Linear for tracking with proper tags (state, priority, labels, project).

**Core workflow:**
1. User uploads feedback documents (PDF, Word, Excel) or pastes Google Sheets URL
2. System extracts individual feedback items from documents
3. AI generates summary titles and categorizes each item (issue type, source, priority)
4. User reviews batch, edits tags if needed, and approves items for posting
5. Approved items are posted to Linear as issues with all tags applied

## Commands

```bash
npm run dev        # Start development server (port 3000)
npm run build      # Build for production
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run ESLint
```

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Upload page (main entry)
│   ├── review/            # Batch review page
│   ├── results/           # Results page with Linear links
│   └── api/               # API routes
│       ├── upload/        # File upload endpoint
│       ├── parse-sheet/   # Google Sheets URL parsing
│       ├── process/       # AI processing pipeline
│       └── post-to-linear/# Linear issue creation
├── components/            # React components
│   ├── FileUpload.tsx     # Drag-drop file upload
│   ├── SheetUrlInput.tsx  # Google Sheets URL input
│   ├── FeedbackTable.tsx  # Review cards with editing (issue type, source, priority)
│   ├── QuickFilters.tsx   # Filter buttons for bugs, confidence levels
│   └── ProgressStepper.tsx# Visual step indicator
└── lib/                   # Core utilities and services
    ├── types.ts           # All types and Linear ID mappings
    ├── context-storage.ts # Project context JSON storage
    ├── codebase-reader.ts # Codebase analysis utility
    ├── parsers/           # Document parsers
    │   ├── pdf-parser.ts
    │   ├── word-parser.ts
    │   ├── excel-parser.ts
    │   ├── gsheet-parser.ts
    │   └── index.ts       # Unified parser interface
    ├── services/          # Business logic
    │   ├── feedback-extractor.ts
    │   ├── title-generator.ts
    │   ├── categorizer.ts    # AI categorization (type, source, priority)
    │   ├── process-feedback.ts
    │   └── linear-poster.ts  # Posts to Linear with all tags
    ├── ai/
    │   └── client.ts      # OpenAI/Anthropic client
    └── linear/
        └── client.ts      # Linear API client
```

## Key Interfaces

```typescript
// Linear-compatible types (lib/types.ts)
type IssueType = 'Bug' | 'Feature' | 'Improvement' | 'Design' | 'Security' | 'Infrastructure' | 'gtm';
type IssueSource = 'user feedback' | 'product' | 'team' | 'market research' | 'data insight';
type Priority = 0 | 1 | 2 | 3 | 4;  // 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
type WorkflowState = 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Canceled' | 'Duplicate';

// Feedback item after extraction
interface FeedbackItem {
  id: string;
  originalText: string;
}

// Processed feedback ready for review
interface ProcessedFeedback {
  id: string;
  originalText: string;
  generatedTitle: string;
  category: FeedbackCategory;  // Legacy, same as issueType
  confidence: number;
  issueType: IssueType;
  issueSource: IssueSource;
  priority: Priority;
  state: WorkflowState;
  projectId?: string;
}

// Linear ID mappings are stored in types.ts:
// - LINEAR_STATE_IDS: Record<WorkflowState, string>
// - LINEAR_ISSUE_TYPE_IDS: Record<IssueType, string>
// - LINEAR_ISSUE_SOURCE_IDS: Record<IssueSource, string>
// - LINEAR_PROJECTS: { id: string; name: string }[]
```

## Environment Variables

```bash
# AI Provider (choose one)
ANTHROPIC_API_KEY=     # Anthropic API key (uses Claude Sonnet 4)
OPENAI_API_KEY=        # OpenAI API key (uses GPT-4o-mini)

# Linear Integration
LINEAR_API_KEY=        # Linear API key for issue creation
LINEAR_TEAM_ID=        # Target Linear team ID (GTM team)

# Other
CONTEXT_FILE_PATH=     # Path to project context JSON (default: project-context.json)
```

**Note:** If both API keys are set, Anthropic takes priority.

## Data Flow

1. **Upload** → `POST /api/upload` or `POST /api/parse-sheet`
   - Returns: `FeedbackItem[]`

2. **Process** → `POST /api/process`
   - Input: `FeedbackItem[]`
   - Returns: `ProcessedFeedback[]` with titles, issue type, source, priority, state, confidence

3. **Post** → `POST /api/post-to-linear`
   - Input: approved `ProcessedFeedback[]`
   - Creates Linear issues with:
     - `stateId`: Workflow state (defaults to Backlog)
     - `priority`: 0-4 priority level
     - `labelIds`: Issue Type + Issue Source labels
     - `projectId`: Optional project assignment
   - Returns: Linear issue URLs and status

## Linear Integration

The app uses hardcoded Linear IDs for the GTM team. When creating issues:
- **State**: Set via `stateId` (e.g., Backlog → `ec15d9a7-...`)
- **Labels**: Applied via `labelIds` array containing both Issue Type and Issue Source label IDs
- **Priority**: Set directly as 0-4 number
- **Project**: Optional, set via `projectId`

## Confidence Threshold

Items with AI categorization confidence below 80% are auto-excluded from the batch but can be manually added back by the user during review.
