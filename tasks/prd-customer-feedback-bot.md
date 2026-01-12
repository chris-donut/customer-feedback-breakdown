# PRD: Customer Feedback Bot

## Introduction

A bot that analyzes customer feedback documents, categorizes issues by type, and posts them to Linear for tracking. The bot understands the project codebase and strategic context to provide relevant categorization and summaries.

Users upload feedback documents (Google Docs, Sheets, PDFs, Word), and the bot extracts individual feedback items, generates summary titles, categorizes them, and batches them for approval before posting to Linear.

## Goals

- Enable product, GTM, QA, and all team members to process customer feedback efficiently
- Automatically categorize feedback into actionable issue types
- Reduce manual effort of reading, summarizing, and creating Linear issues
- Maintain context-awareness through codebase and strategic plan understanding
- Support batch review workflow before Linear posting

## User Stories

### US-001: Initialize codebase context
**Description:** As a developer, I need the bot to understand my codebase so it can provide relevant categorization.

**Acceptance Criteria:**
- [ ] Bot reads project codebase on first run
- [ ] Extracts key information: file structure, components, features, tech stack
- [ ] Saves context to a 3rd party file (configurable location)
- [ ] Appends incremental changes on subsequent runs
- [ ] Typecheck passes

### US-002: Input strategic plan
**Description:** As a product manager, I want to provide our strategic plan so the bot understands priorities and context.

**Acceptance Criteria:**
- [ ] Prompt or form to input strategic plan text
- [ ] Plan stored alongside codebase context
- [ ] Plan influences issue prioritization suggestions
- [ ] Can update plan without re-reading entire codebase
- [ ] Typecheck passes

### US-003: Upload feedback documents
**Description:** As a user, I want to upload customer feedback documents so they can be analyzed.

**Acceptance Criteria:**
- [ ] Upload interface accepts: Excel (.xlsx), Google Sheets (via URL), PDF, Word (.docx)
- [ ] Drag-and-drop and file picker for local files
- [ ] URL paste input for Google Sheets links
- [ ] Shows upload progress and confirmation
- [ ] Handles multi-page documents
- [ ] Error message for unsupported formats
- [ ] Typecheck passes
- [ ] Verify in browser

### US-004: Parse and extract feedback items
**Description:** As a user, I want the bot to extract individual feedback items from my document.

**Acceptance Criteria:**
- [ ] Identifies separate feedback entries in document
- [ ] Handles various formats (bullet lists, paragraphs, spreadsheet rows)
- [ ] Preserves original text for reference
- [ ] Shows count of extracted items
- [ ] Typecheck passes

### US-005: Generate summary titles
**Description:** As a user, I want each feedback item to have a clear summary title for the Linear issue.

**Acceptance Criteria:**
- [ ] AI generates concise title (< 80 chars) per feedback item
- [ ] Title captures core issue/request
- [ ] User can edit generated titles before approval
- [ ] Typecheck passes

### US-006: Categorize into issue types
**Description:** As a user, I want feedback automatically categorized so issues are organized in Linear.

**Acceptance Criteria:**
- [ ] Categories: Bug, Feature Request, UI/UX Issue, AI Hallucination, New Feature, Documentation
- [ ] AI assigns category with confidence indicator
- [ ] User can override category before approval
- [ ] Shows category distribution summary
- [ ] Typecheck passes
- [ ] Verify in browser

### US-007: Batch review and approval
**Description:** As a user, I want to review all categorized feedback before posting to Linear.

**Acceptance Criteria:**
- [ ] Display all extracted items in a review table/list
- [ ] Each item shows: original text, generated title, category, confidence
- [ ] Bulk select/deselect items
- [ ] Edit individual items inline
- [ ] "Approve & Post to Linear" button for selected items
- [ ] Typecheck passes
- [ ] Verify in browser

### US-008: Post issues to Linear
**Description:** As a user, I want approved feedback items posted as issues in Linear.

**Acceptance Criteria:**
- [ ] Integrates with Linear API
- [ ] Creates issue with: title, description (original feedback), label (category)
- [ ] Posts all approved items in batch
- [ ] Shows success/failure status per item
- [ ] Links to created Linear issues
- [ ] Typecheck passes

### US-009: Display results
**Description:** As a user, I want to see a summary of what was processed and posted.

**Acceptance Criteria:**
- [ ] Shows total items processed
- [ ] Breakdown by category
- [ ] List of created Linear issues with links
- [ ] Option to start new upload
- [ ] Typecheck passes
- [ ] Verify in browser

## Functional Requirements

- FR-1: Read project codebase and save context to configurable 3rd party file
- FR-2: Append codebase changes incrementally (not full re-read)
- FR-3: Accept strategic plan input and store with context
- FR-4: Support file upload (Excel, PDF, Word) and URL paste (Google Sheets)
- FR-5: Extract individual feedback items from uploaded documents
- FR-6: Generate AI summary title for each feedback item
- FR-7: Categorize each item into: Bug, Feature Request, UI/UX Issue, AI Hallucination, New Feature, Documentation
- FR-8: Display batch review interface with edit capabilities
- FR-9: Integrate with Linear API for issue creation
- FR-10: Post approved items as Linear issues with appropriate labels
- FR-11: Show processing results with Linear issue links

## Non-Goals

- No real-time collaboration on reviews
- No automatic scheduling of Linear posts
- No feedback sentiment analysis or scoring
- No direct integration with feedback collection tools (Intercom, Zendesk, etc.)
- No user authentication/multi-tenant support in v1
- No feedback deduplication against existing Linear issues

## Technical Considerations

- **Document parsing:** Use libraries for PDF (pdf-parse), Word (mammoth), Google APIs for Docs/Sheets
- **AI/LLM:** Use for title generation and categorization (OpenAI, Anthropic, or local model)
- **Linear API:** OAuth or API key integration for issue creation
- **Context storage:** JSON or markdown file for codebase/strategic context
- **Frontend:** Minimal React/Next.js app with file upload and table components

## Success Metrics

- Process a feedback document in under 2 minutes
- 90%+ accuracy on categorization (validated by user overrides)
- Reduce time to create Linear issues from feedback by 80%
- Users approve and post batch without editing > 70% of items

## Decisions

- **Linear workspace:** Configurable later by user
- **Context file format:** JSON
- **Supported inputs:** Excel, Google Sheet (via URL), PDF, Word Document
- **Upload methods:** File upload + URL paste for Google Sheets
- **Confidence threshold:** 80% - items below this auto-excluded from batch (user can manually add back)

## Open Questions

- How often should codebase context be refreshed?
