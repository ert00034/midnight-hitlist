import OpenAI from 'openai';

const systemPrompt = `You are an analyst summarizing World of Warcraft articles with a focus on addon/API impact.
Write 2-3 concise sentences, plain text, no lists, no code, under 500 characters.
Call out specific APIs, UI systems, or addon implications when present.`;

export async function summarizeArticleText(text: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return text.slice(0, 280);
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  });
  const model = process.env.OPENROUTER_MODEL || 'gpt-5-mini';
  const resp = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text.slice(0, 8000) },
    ],
  });
  const content = resp.choices[0]?.message?.content?.trim() || '';
  return content || text.slice(0, 280);
}


