export async function openRouterChat(input: {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
}): Promise<{ content: string; model: string } | null> {
  const key = (process.env.OPENROUTER_API_KEY ?? '').trim()
  const model = (process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini').trim()
  if (!key) return null
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5174',
        'X-Title': 'TripFlow Dynamic Twin',
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 900,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
      }),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; model?: string }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) return null
    return { content, model: data.model ?? model }
  } catch {
    return null
  }
}

export function parseJsonObject<T>(text: string): T | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  const raw = fenced?.[1] ?? text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T
  } catch {
    return null
  }
}
