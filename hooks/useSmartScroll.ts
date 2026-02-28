'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export function useSmartScroll(messageCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const previousMessageCount = useRef(messageCount)
  const userScrollTimeout = useRef<NodeJS.Timeout>()
  const isAutoScrolling = useRef(false)

  const checkIfAtBottom = useCallback(() => {
    const container = scrollRef.current
    if (!container) return false
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight <= 100
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    const container = scrollRef.current
    if (!container) return
    if (force || isAtBottom) {
      // Use container scrollTo instead of scrollIntoView to prevent
      // the entire page from jumping/shifting
      isAutoScrolling.current = true
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
      setHasNewMessage(false)
      // Reset auto-scrolling flag after animation completes
      setTimeout(() => {
        isAutoScrolling.current = false
      }, 400)
    }
  }, [isAtBottom])

  const handleScroll = useCallback(() => {
    // Skip scroll state updates during auto-scrolling to prevent flicker
    if (isAutoScrolling.current) return
    setIsAtBottom(checkIfAtBottom())
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current)
    userScrollTimeout.current = setTimeout(() => {
      if (checkIfAtBottom()) setHasNewMessage(false)
    }, 150)
  }, [checkIfAtBottom])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current)
    }
  }, [handleScroll])

  useEffect(() => {
    if (messageCount > previousMessageCount.current) {
      if (isAtBottom) {
        // Use requestAnimationFrame to wait for the DOM to update before scrolling
        requestAnimationFrame(() => {
          scrollToBottom(true)
        })
      } else {
        queueMicrotask(() => setHasNewMessage(true))
      }
    }
    previousMessageCount.current = messageCount
  }, [messageCount, isAtBottom, scrollToBottom])

  return {
    scrollRef,
    messagesEndRef,
    hasNewMessage,
    scrollToBottom: () => scrollToBottom(true)
  }
}
