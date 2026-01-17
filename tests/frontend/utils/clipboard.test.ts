/**
 * Tests for clipboard utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard, isClipboardSupported } from '@/utils/clipboard'

describe('clipboard utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('isClipboardSupported', () => {
    it('should return true when Clipboard API is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn() },
        writable: true,
      })

      expect(isClipboardSupported()).toBe(true)
    })

    it('should return true when execCommand is supported', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      })
      
      Object.defineProperty(document, 'queryCommandSupported', {
        value: vi.fn(() => true),
        writable: true,
      })

      expect(isClipboardSupported()).toBe(true)
    })
  })

  describe('copyToClipboard', () => {
    it('should call onSuccess when copy succeeds', async () => {
      const onSuccess = vi.fn()
      const writeText = vi.fn().mockResolvedValue(undefined)

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })

      const result = await copyToClipboard('test text', { onSuccess })

      expect(result).toBe(true)
      expect(writeText).toHaveBeenCalledWith('test text')
      expect(onSuccess).toHaveBeenCalled()
    })

    it('should call onError when copy fails', async () => {
      const onError = vi.fn()
      const writeText = vi.fn().mockRejectedValue(new Error('Copy failed'))

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
      })

      const result = await copyToClipboard('test text', { onError })

      expect(result).toBe(false)
      expect(onError).toHaveBeenCalled()
    })
  })
})
