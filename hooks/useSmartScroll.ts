'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export function useSmartScroll(messageCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const previousMessageCount = useRef(messageCount)
  const userScrollTimeout = useRef<NodeJS.Timeout>()

  const checkIfAtBottom = useCallback(() => {
    const container = scrollRef.current
    if (!container) return false
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight <= 100
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current) return
    if (force || isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      setHasNewMessage(false)
    }
  }, [isAtBottom])

  const handleScroll = useCallback(() => {
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
        scrollToBottom(true)
      } else {
        setHasNewMessage(true)
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
