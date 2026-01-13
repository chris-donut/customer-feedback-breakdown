import { chat } from "@/lib/ai/client";
import { readContext, type ProjectContext } from "@/lib/context-storage";

export interface TitleGeneratorOptions {
  context?: ProjectContext;
  maxLength?: number;
}

export async function generateTitle(
  feedbackText: string,
  options: TitleGeneratorOptions = {}
): Promise<string> {
  const { maxLength = 80 } = options;

  const context = options.context ?? (await readContext());

  const contextInfo = buildContextPrompt(context);

  const systemPrompt = `You are a technical issue title generator. Generate a concise, actionable title for customer feedback that would work well as a bug report or feature request title.

Rules:
- Maximum ${maxLength} characters
- Use present tense imperative form when possible (e.g., "Add...", "Fix...", "Improve...")
- Be specific but concise
- Do not include quotes or special formatting
- Return ONLY the title text, nothing else

${contextInfo}`;

  const response = await chat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: feedbackText },
    ],
    { temperature: 0.3, maxTokens: 100 }
  );

  const title = response.trim().slice(0, maxLength);

  return title;
}

export async function generateTitles(
  feedbackItems: Array<{ id: string; originalText: string }>,
  options: TitleGeneratorOptions = {}
): Promise<Map<string, string>> {
  const context = options.context ?? (await readContext());
  const optionsWithContext = { ...options, context };

  const results = new Map<string, string>();

  for (const item of feedbackItems) {
    const title = await generateTitle(item.originalText, optionsWithContext);
    results.set(item.id, title);
  }

  return results;
}

function buildContextPrompt(context: ProjectContext): string {
  const parts: string[] = [];

  if (context.codebaseInfo) {
    const info = context.codebaseInfo;
    if (info.name) {
      parts.push(`Project: ${info.name}`);
    }
    if (info.description) {
      parts.push(`Description: ${info.description}`);
    }
  }

  if (context.strategicPlan) {
    parts.push(`Strategic context: ${context.strategicPlan.slice(0, 500)}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `Context about the project this feedback relates to:
${parts.join("\n")}`;
}
