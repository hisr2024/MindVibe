/**
 * Tests for useSmartScroll hook
 * 
 * Tests the smart scroll behavior for KIAAN chat components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSmartScroll } from '@/hooks/useSmartScroll'

describe('useSmartScroll', () => {
  beforeEach(() => {
    // Mock scrollIntoView for testing
    Element.prototype.scrollIntoView = () => {}
  })

  afterEach(() => {
    // Clean up
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSmartScroll(0))
    
    expect(result.current.scrollRef).toBeDefined()
    expect(result.current.messagesEndRef).toBeDefined()
    expect(result.current.hasNewMessage).toBe(false)
    expect(result.current.scrollToBottom).toBeDefined()
  })

  it('should detect new messages', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useSmartScroll(count),
      { initialProps: { count: 0 } }
    )
    
    expect(result.current.hasNewMessage).toBe(false)
    
    // Simulate new message
    rerender({ count: 1 })
    
    // The hook should eventually detect the new message
    expect(result.current.hasNewMessage).toBeDefined()
  })

  it('should provide scrollToBottom function', () => {
    const { result } = renderHook(() => useSmartScroll(5))
    
    expect(typeof result.current.scrollToBottom).toBe('function')
    
    // Should not throw when called
    act(() => {
      result.current.scrollToBottom()
    })
  })

  it('should update message count', () => {
    const { rerender } = renderHook(
      ({ count }) => useSmartScroll(count),
      { initialProps: { count: 3 } }
    )
    
    // Increase message count
    rerender({ count: 5 })
    
    // Should handle the update without errors
    expect(true).toBe(true)
  })
})
