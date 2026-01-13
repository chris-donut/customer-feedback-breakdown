import { chat } from "@/lib/ai/client";

export async function translateToChinese(text: string): Promise<string> {
  const systemPrompt = `You are a professional translator. Translate the following user feedback from English to Simplified Chinese (简体中文).

Rules:
- Preserve the meaning and tone of the original feedback
- Use natural, professional Chinese suitable for product managers
- Keep technical terms in their commonly used Chinese translations
- If the text is already in Chinese, return it as-is
- Return ONLY the translated text, nothing else`;

  const response = await chat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    { temperature: 0.2, maxTokens: 500 }
  );

  return response.trim();
}

export async function translateMany(
  items: Array<{ id: string; text: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const translations = await Promise.all(
    items.map(async (item) => {
      const translation = await translateToChinese(item.text);
      return { id: item.id, translation };
    })
  );

  for (const { id, translation } of translations) {
    results.set(id, translation);
  }

  return results;
}
