'use client'

/**
 * useStreamingResponse — SSE-based Streaming Response Hook
 *
 * Connects to the KIAAN voice companion streaming endpoint via Server-Sent Events.
 * Receives text tokens in real-time and triggers TTS synthesis at sentence boundaries.
 *
 * SSE event types consumed:
 * - token: Individual text token for live display
 * - tts_chunk: Complete sentence ready for TTS synthesis
 * - voice_emotion: Merged emotion state for response adaptation
 * - predictive_action: KIAAN suggests an action proactively
 * - done: Stream complete
 * - error: Error occurred
 *
 * Usage:
 *   const { streamResponse, fullText, isStreaming, ttsChunks } = useStreamingResponse({
 *     onTTSChunk: (text) => synthesizeAndPlay(text),
 *     onComplete: () => console.log('done'),
 *   })
 *   streamResponse('How am I doing today?')
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreamEvent {
  type: 'token' | 'tts_chunk' | 'voice_emotion' | 'predictive_action' | 'done' | 'error'
  text?: string
  emotion?: Record<string, unknown>
  action?: string
  message?: string
}

interface PredictiveAction {
  type: string
  message: string
  action: string
  confidence: number
}

interface UseStreamingResponseOptions {
  /** Called with each complete sentence for TTS synthesis */
  onTTSChunk?: (text: string) => void
  /** Called when the full response is complete */
  onComplete?: (fullText: string) => void
  /** Called when an error occurs */
  onError?: (error: string) => void
  /** Called when voice emotion is received */
  onVoiceEmotion?: (emotion: Record<string, unknown>) => void
  /** Called when KIAAN suggests a predictive action */
  onPredictiveAction?: (action: PredictiveAction) => void
  /** API endpoint URL */
  endpoint?: string
}

interface UseStreamingResponseReturn {
  /** Initiate a streaming response for a user message */
  streamResponse: (text: string, options?: { voiceEmotion?: Record<string, unknown>; language?: string }) => void
  /** Abort the current stream */
  abort: () => void
  /** The accumulated full response text so far */
  fullText: string
  /** Whether a stream is currently active */
  isStreaming: boolean
  /** Number of TTS chunks emitted so far */
  ttsChunkCount: number
  /** Any error message */
  error: string | null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStreamingResponse(options: UseStreamingResponseOptions = {}): UseStreamingResponseReturn {
  const {
    onTTSChunk,
    onComplete,
    onError,
    onVoiceEmotion,
    onPredictiveAction,
    endpoint = '/api/voice-companion/stream',
  } = options

  const [fullText, setFullText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [ttsChunkCount, setTtsChunkCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // Stable callback refs
  const onTTSChunkRef = useRef(onTTSChunk)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)
  const onVoiceEmotionRef = useRef(onVoiceEmotion)
  const onPredictiveActionRef = useRef(onPredictiveAction)
  onTTSChunkRef.current = onTTSChunk
  onCompleteRef.current = onComplete
  onErrorRef.current = onError
  onVoiceEmotionRef.current = onVoiceEmotion
  onPredictiveActionRef.current = onPredictiveAction

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (mountedRef.current) {
      setIsStreaming(false)
    }
  }, [])

  const streamResponse = useCallback(async (
    text: string,
    opts?: { voiceEmotion?: Record<string, unknown>; language?: string },
  ) => {
    // Abort any existing stream
    abort()

    if (!mountedRef.current) return
    setFullText('')
    setTtsChunkCount(0)
    setError(null)
    setIsStreaming(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_emotion: opts?.voiceEmotion,
          language: opts?.language || 'en',
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      // Inactivity timeout: abort the stream if no data received for 60 seconds.
      // Prevents the UI from being stuck in "loading" forever if the server hangs.
      const STREAM_INACTIVITY_TIMEOUT_MS = 60_000
      let inactivityTimer = setTimeout(() => controller.abort(), STREAM_INACTIVITY_TIMEOUT_MS)
      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer)
        inactivityTimer = setTimeout(() => controller.abort(), STREAM_INACTIVITY_TIMEOUT_MS)
      }

      try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        resetInactivityTimer()
        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const event: StreamEvent = JSON.parse(line.slice(6))

            switch (event.type) {
              case 'token':
                if (event.text) {
                  accumulated += event.text
                  if (mountedRef.current) setFullText(accumulated)
                }
                break

              case 'tts_chunk':
                if (event.text && mountedRef.current) {
                  setTtsChunkCount(c => c + 1)
                  onTTSChunkRef.current?.(event.text)
                }
                break

              case 'voice_emotion':
                if (event.emotion) {
                  onVoiceEmotionRef.current?.(event.emotion)
                }
                break

              case 'predictive_action':
                if (event.message && event.action) {
                  onPredictiveActionRef.current?.(event as unknown as PredictiveAction)
                }
                break

              case 'done':
                if (mountedRef.current) {
                  setIsStreaming(false)
                  onCompleteRef.current?.(accumulated)
                }
                break

              case 'error':
                if (mountedRef.current) {
                  const errMsg = event.message || 'Stream error'
                  setError(errMsg)
                  setIsStreaming(false)
                  onErrorRef.current?.(errMsg)
                }
                break
            }
          } catch {
            // Skip malformed SSE events
          }
        }
      }

      // Stream ended naturally
      if (mountedRef.current && isStreaming) {
        setIsStreaming(false)
        onCompleteRef.current?.(accumulated)
      }
      } finally {
        clearTimeout(inactivityTimer)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return // Intentional abort

      if (mountedRef.current) {
        const errMsg = (err as Error).message || 'Streaming failed'
        setError(errMsg)
        setIsStreaming(false)
        onErrorRef.current?.(errMsg)
      }
    }
  }, [abort, endpoint]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    streamResponse,
    abort,
    fullText,
    isStreaming,
    ttsChunkCount,
    error,
  }
}

export type {
  UseStreamingResponseOptions,
  UseStreamingResponseReturn,
  StreamEvent,
  PredictiveAction,
}
