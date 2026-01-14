# Customer Feedback Breakdown

A tool that analyzes customer feedback documents, categorizes issues by type, and posts them to Linear for tracking.

## Features

- **Multi-format Support**: Upload PDF, Word (.doc, .docx), Excel (.xls, .xlsx), or CSV files
- **Google Sheets Integration**: Import directly from Google Sheets URLs (supports multiple sheets)
- **AI-Powered Analysis**: Automatically generates titles and categorizes feedback
- **Chinese Translation**: Auto-translates feedback to Simplified Chinese for Chinese product managers
- **Linear Integration**: Post categorized issues directly to Linear with tags, priority, and state
- **Source Tracking**: Automatically tracks the source URL of each feedback item
- **Persistent Storage**: Feedback items persist in localStorage across sessions
- **History Tracking**: View all previously posted items with Linear links

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Linear API key
- OpenAI or Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/DonutLabs-ai/customer-feedback-breakdown.git
cd customer-feedback-breakdown

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# AI Provider (choose one)
ANTHROPIC_API_KEY=     # Anthropic API key (uses Claude Sonnet 4)
OPENAI_API_KEY=        # OpenAI API key (uses GPT-4o-mini)

# Linear Integration
LINEAR_API_KEY=        # Linear API key for issue creation
LINEAR_TEAM_ID=        # Target Linear team ID
```

### Running the App

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

## Usage

### 1. Upload Feedback

- **File Upload**: Drag and drop or click to upload PDF, Word, Excel, or CSV files
- **Google Sheets**: Paste one or more Google Sheets URLs (must be publicly accessible)

### 2. Review & Edit

- AI automatically generates titles and categorizes each item
- Edit titles, categories, issue types, sources, and priorities
- View Chinese translations for each item
- Filter by confidence level, issue type, or priority
- Items with <80% confidence are excluded by default

### 3. Post to Linear

- Select items to post
- Click "Approve & Post to Linear"
- View results with direct links to created issues

## Linear Integration

Issues are posted with:
- **Title**: AI-generated summary
- **State**: Workflow state (Backlog, Todo, In Progress, etc.)
- **Priority**: 0-4 (None, Urgent, High, Medium, Low)
- **Labels**: Issue Type + Issue Source labels
- **Project**: Optional project assignment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude / OpenAI GPT
- **Issue Tracking**: Linear API
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Upload page
│   ├── review/            # Review & edit page
│   ├── history/           # Posted items history
│   ├── results/           # Post results page
│   └── api/               # API routes
├── components/            # React components
│   ├── FileUpload.tsx
│   ├── SheetUrlInput.tsx
│   ├── FeedbackTable.tsx
│   ├── QuickFilters.tsx
│   └── ProgressStepper.tsx
└── lib/                   # Utilities
    ├── parsers/           # Document parsers
    ├── services/          # Business logic
    ├── ai/                # AI client
    └── linear/            # Linear client
```

## License

MIT

---

<details>
<summary>中文说明</summary>

# 客户反馈分解工具

一个分析客户反馈文档、按类型分类问题并发布到 Linear 进行跟踪的工具。

## 功能特点

- **多格式支持**: 上传 PDF、Word、Excel 或 CSV 文件
- **Google 表格集成**: 直接从 Google 表格 URL 导入（支持多个表格）
- **AI 驱动分析**: 自动生成标题和分类反馈
- **中文翻译**: 自动将反馈翻译成简体中文
- **Linear 集成**: 直接发布到 Linear，带标签、优先级和状态
- **来源追踪**: 自动追踪每个反馈项的来源 URL
- **持久存储**: 反馈项跨会话保持在本地存储中
- **历史记录**: 查看所有已发布的项目及 Linear 链接

## 使用方法

1. 上传文档或粘贴 Google 表格 URL
2. AI 自动生成标题、分类和中文翻译
3. 审核并编辑反馈项目
4. 批量发布到 Linear

</details>
