'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected'

interface UseReconnectingWebSocketOptions {
  /** WebSocket URL. Pass null to disable connection. */
  url: string | null
  /** Called with parsed JSON for each incoming message. */
  onMessage: (data: unknown) => void
  /** Max reconnection attempts before giving up (default: 5). */
  maxRetries?: number
  /** Base delay in ms for exponential backoff (default: 1000). */
  baseDelay?: number
  /** Maximum delay in ms between retries (default: 30000). */
  maxDelay?: number
}

interface UseReconnectingWebSocketReturn {
  /** Send a string message through the WebSocket. No-op if not connected. */
  send: (data: string) => void
  /** Current connection status. */
  status: WebSocketStatus
  /** Manually trigger a reconnection attempt (resets retry counter). */
  reconnect: () => void
  /** Current retry attempt number (0 when connected or idle). */
  retryAttempt: number
  /** Max retries configured. */
  maxRetries: number
}

/**
 * WebSocket hook with automatic reconnection using exponential backoff + jitter.
 *
 * Reconnects automatically on close/error up to maxRetries times.
 * Listens for the browser `online` event to reconnect immediately when
 * network is restored. Cleans up sockets and timers on unmount.
 */
export function useReconnectingWebSocket({
  url,
  onMessage,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 30000,
}: UseReconnectingWebSocketOptions): UseReconnectingWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [retryAttempt, setRetryAttempt] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  const intentionalCloseRef = useRef(false)

  // Keep onMessage ref current without triggering reconnections
  onMessageRef.current = onMessage

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  const closeSocket = useCallback(() => {
    intentionalCloseRef.current = true
    clearRetryTimer()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [clearRetryTimer])

  const connect = useCallback(() => {
    if (!url) return

    closeSocket()
    intentionalCloseRef.current = false
    setStatus('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      retryCountRef.current = 0
      setRetryAttempt(0)
      setStatus('connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessageRef.current(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message', error)
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (intentionalCloseRef.current) {
        setStatus('disconnected')
        return
      }
      scheduleReconnect()
    }

    ws.onerror = () => {
      // onclose will fire after onerror, so reconnection is handled there
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, closeSocket])

  const scheduleReconnect = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      setStatus('disconnected')
      return
    }

    setStatus('disconnected')
    const attempt = retryCountRef.current
    // Exponential backoff with random jitter (0-500ms) to prevent thundering herd
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay) + Math.random() * 500

    retryCountRef.current = attempt + 1
    setRetryAttempt(attempt + 1)

    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null
      if (!intentionalCloseRef.current) {
        connect()
      }
    }, delay)
  }, [maxRetries, baseDelay, maxDelay, connect])

  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    setRetryAttempt(0)
    connect()
  }, [connect])

  // Connect when URL changes
  useEffect(() => {
    if (url) {
      connect()
    } else {
      closeSocket()
      setStatus('disconnected')
    }
    return () => {
      closeSocket()
    }
  }, [url, connect, closeSocket])

  // Reconnect immediately when browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (url && wsRef.current?.readyState !== WebSocket.OPEN) {
        retryCountRef.current = 0
        setRetryAttempt(0)
        clearRetryTimer()
        connect()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [url, connect, clearRetryTimer])

  return { send, status, reconnect, retryAttempt, maxRetries }
}
