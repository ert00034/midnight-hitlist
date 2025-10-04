import OpenAI from 'openai';

export type SuggestedImpact = {
  addon_name: string;
  category: 'Low' | 'Medium' | 'High' | 'Dead';
  severity: number; // 1-5
  reason?: string;
};

const systemPrompt = `You analyze World of Warcraft addon-related articles and suggest addon impact ratings.
Return JSON array of objects: [{ addon_name, category, severity, reason }].
Categories: Low(1-2), Medium(3), High(4), Dead(5). Choose only relevant addons.
Limit to at most 8 suggestions. Output ONLY JSON array.`;

function clampSeverity(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(5, Math.round(v)));
}

export async function suggestAddonImpactsFromText(text: string): Promise<SuggestedImpact[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];
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
    response_format: { type: 'json_object' as any }
  });
  const content = resp.choices[0]?.message?.content || '[]';
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  // Accept multiple shapes returned by JSON mode:
  // - Direct array
  // - { suggestions: [...] }
  // - { items: [...] }
  // - { anyKey: [...] }
  // - Single object (coerce to one-element array)
  let arr: any[] = [];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.suggestions)) arr = parsed.suggestions;
    else if (Array.isArray(parsed.items)) arr = parsed.items;
    else {
      const firstArray = Object.values(parsed).find((v: any) => Array.isArray(v));
      if (Array.isArray(firstArray)) arr = firstArray as any[];
      else if (parsed.addon_name) arr = [parsed];
    }
  }

  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => ({
      addon_name: String(r.addon_name || '').slice(0, 80),
      category: (String(r.category || 'Low') as SuggestedImpact['category']),
      severity: clampSeverity(r.severity),
      reason: r.reason ? String(r.reason) : undefined,
    }))
    .filter((s) => s.addon_name);
}


