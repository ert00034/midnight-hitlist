import OpenAI from 'openai';

const systemPrompt = `You classify World of Warcraft news/articles for whether they relate to the Midnight API/addon changes.
Return JSON with fields: { related: boolean, reason: string, severity: 1-5 }.
Severity indicates potential impact on addons.
`;

export type Classification = {
  related: boolean;
  reason: string;
  severity: number;
};

export async function classifyArticle(text: string): Promise<Classification> {
  if (!process.env.OPENAI_API_KEY) {
    return { related: false, reason: 'No OPENAI_API_KEY configured', severity: 1 };
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text.slice(0, 8000) },
    ],
    response_format: { type: 'json_object' }
  });
  const content = resp.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return {
    related: !!parsed.related,
    reason: String(parsed.reason || ''),
    severity: Math.min(5, Math.max(1, Number(parsed.severity || 1)))
  };
}


