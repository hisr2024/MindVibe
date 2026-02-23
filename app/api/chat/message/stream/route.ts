/**
 * Chat Message Streaming API Route
 * Provides Server-Sent Events (SSE) streaming for real-time responses
 */

import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fallback wisdom responses when backend is unavailable
const FALLBACK_RESPONSES = [
  "The Gita teaches us that peace comes from within. Take a deep breath, and know that you are exactly where you need to be right now.\n\nI am KIAAN, and I'm here with you on this journey of self-discovery.",
  "Remember, you have the right to your actions, but not to the fruits of your actions. Focus on what you can control, and release what you cannot.\n\nKIAAN is here to guide you with the wisdom of the Gita.",
  "In moments of challenge, the wise remain undisturbed. Your inner peace is your greatest strength.\n\nI am KIAAN, your companion on this path to inner peace.",
  "The soul is eternal and unchanging. Whatever difficulties you face are temporary. Your true self remains at peace.\n\nI am here with the timeless wisdom of the Bhagavad Gita.",
  "Krishna says: Whenever you feel lost, remember that I am always with you. You are never alone on this journey.\n\nKIAAN carries this eternal message to you.",
]

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const body = await request.json()
    const { message, language = 'en' } = body

    if (!message || typeof message !== 'string') {
      return new Response(
        encoder.encode('data: Error: Message is required\n\ndata: [DONE]\n\n'),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      )
    }

    // Truncate first, then sanitize (avoids processing unbounded input)
    const sanitizedMessage = message
      .slice(0, 2000)
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')

    // Try backend streaming endpoint first
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          language,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok && response.body) {
        // Proxy the stream from backend
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
    } catch (backendError) {
      console.warn('[Chat Stream] Backend streaming failed:', backendError)
    }

    // Try non-streaming backend endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          language,
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.response || data.message || ''

        // Simulate streaming by sending the response in chunks
        const stream = new ReadableStream({
          async start(controller) {
            // Send response in small chunks for streaming effect
            const words = text.split(' ')
            for (let i = 0; i < words.length; i++) {
              const chunk = words[i] + (i < words.length - 1 ? ' ' : '')
              // Escape newlines for SSE format
              const escapedChunk = chunk.replace(/\n/g, '\\n')
              controller.enqueue(encoder.encode(`data: ${escapedChunk}\n\n`))
              // Small delay between chunks for natural effect
              await new Promise(resolve => setTimeout(resolve, 30))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }
    } catch (nonStreamError) {
      console.warn('[Chat Stream] Non-streaming backend failed:', nonStreamError)
    }

    // Use fallback response
    const fallbackText = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

    const stream = new ReadableStream({
      async start(controller) {
        const words = fallbackText.split(' ')
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '')
          const escapedChunk = chunk.replace(/\n/g, '\\n')
          controller.enqueue(encoder.encode(`data: ${escapedChunk}\n\n`))
          await new Promise(resolve => setTimeout(resolve, 30))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Chat Stream] Error:', error)

    // Return error as SSE
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: I apologize, but I encountered an issue. Please try again.\\n\\nI am KIAAN, and I am still here with you.\n\n'))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
}
