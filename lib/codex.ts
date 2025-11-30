export type CodexMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type CodexRequest = {
  model?: string
  messages: CodexMessage[]
  temperature?: number
  response_format?: { type: 'json_object' | 'text' }
}

const CODEX_MODEL = process.env.CODEX_MODEL || 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export async function codex({ model = CODEX_MODEL, messages, temperature = 0.7, response_format }: CodexRequest) {
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
      temperature,
      ...(response_format ? { response_format } : {})
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
