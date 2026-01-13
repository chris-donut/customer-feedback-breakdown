// AI Client - supports both Anthropic and OpenAI
// Set ANTHROPIC_API_KEY to use Claude, or OPENAI_API_KEY to use GPT

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type Provider = "anthropic" | "openai";

function getProvider(): Provider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  throw new Error("No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY");
}

async function callAnthropic(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.3 } = options;

  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text ?? "";
}

async function callOpenAI(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.3, jsonMode = false } = options;

  const body: Record<string, unknown> = {
    model: "gpt-5.1",
    messages,
    temperature,
    max_completion_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

export async function chat(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const provider = getProvider();

  if (provider === "anthropic") {
    return callAnthropic(messages, options);
  } else {
    return callOpenAI(messages, options);
  }
}

export async function generateJSON<T>(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const provider = getProvider();

  // Add JSON instruction to the last user message
  const messagesWithJsonInstruction = messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === "user") {
      return {
        ...m,
        content: m.content + "\n\nRespond with valid JSON only, no other text.",
      };
    }
    return m;
  });

  let content: string;

  if (provider === "anthropic") {
    content = await callAnthropic(messagesWithJsonInstruction, options);
  } else {
    content = await callOpenAI(messagesWithJsonInstruction, {
      ...options,
      jsonMode: true,
    });
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
  const jsonStr = jsonMatch[1]?.trim() || content.trim();

  return JSON.parse(jsonStr) as T;
}
