import { TickResponse } from './types'

export async function callGroqTick(prompt: string): Promise<TickResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq response missing content')
  }

  let parsed: TickResponse
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    throw new Error(`Failed to parse Groq JSON response: ${content}`)
  }

  if (!Array.isArray(parsed.results)) {
    throw new Error('Groq response missing results array')
  }

  return parsed
}
