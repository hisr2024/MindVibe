export type CodexMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type CodexRequest = {
  model?: string
  messages: CodexMessage[]
  temperature?: number
}

const CODEX_MODEL = process.env.CODEX_MODEL || 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export async function codex({ model = CODEX_MODEL, messages, temperature = 0.7 }: CodexRequest) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY

  if (!apiKey) {
    throw new Error('Missing OpenAI API key for codex helper')
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature
    })
  })

  const data = await response.json()

  if (!response.ok) {
    const message = typeof data?.error?.message === 'string' ? data.error.message : 'Codex request failed'
    throw new Error(message)
  }

  const content: string = data?.choices?.[0]?.message?.content ?? ''

  return { content, raw: data }
}
