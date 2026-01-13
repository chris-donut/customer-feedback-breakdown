# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Customer Feedback Breakdown - A tool that analyzes customer feedback documents, categorizes issues by type, and posts them to Linear for tracking.

**Core workflow:**
1. User uploads feedback documents (PDF, Word, Excel) or pastes Google Sheets URL
2. System extracts individual feedback items from documents
3. AI generates summary titles and categorizes each item
4. User reviews batch and approves items for posting
5. Approved items are posted to Linear as issues

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
│   └── FeedbackTable.tsx  # Review table with editing
└── lib/                   # Core utilities and services
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
    │   ├── categorizer.ts
    │   ├── process-feedback.ts
    │   └── linear-poster.ts
    ├── ai/
    │   └── client.ts      # OpenAI/Anthropic client
    └── linear/
        └── client.ts      # Linear API client
```

## Key Interfaces

```typescript
// Context storage (lib/context-storage.ts)
interface ProjectContext {
  codebaseInfo?: CodebaseInfo;
  strategicPlan?: string;
  updatedAt?: string;
}

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
  category: FeedbackCategory;
  confidence: number;
}

// Issue categories
type FeedbackCategory =
  | 'Bug'
  | 'Feature Request'
  | 'UI/UX Issue'
  | 'AI Hallucination'
  | 'New Feature'
  | 'Documentation';
```

## Environment Variables

```bash
# AI Provider (choose one)
ANTHROPIC_API_KEY=     # Anthropic API key (uses Claude Sonnet 4)
OPENAI_API_KEY=        # OpenAI API key (uses GPT-4o-mini)

# Other
CONTEXT_FILE_PATH=     # Path to project context JSON (default: project-context.json)
LINEAR_API_KEY=        # Linear API key for issue creation
LINEAR_TEAM_ID=        # Target Linear team ID
```

**Note:** If both API keys are set, Anthropic takes priority.

## Data Flow

1. **Upload** → `POST /api/upload` or `POST /api/parse-sheet`
   - Returns: `FeedbackItem[]`

2. **Process** → `POST /api/process`
   - Input: `FeedbackItem[]`
   - Returns: `ProcessedFeedback[]` with titles, categories, confidence

3. **Post** → `POST /api/post-to-linear`
   - Input: approved `ProcessedFeedback[]`
   - Returns: Linear issue URLs and status

## Confidence Threshold

Items with AI categorization confidence below 80% are auto-excluded from the batch but can be manually added back by the user during review.
