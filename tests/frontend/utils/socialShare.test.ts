/**
 * Tests for social sharing utilities
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeShareContent,
  formatShareContent,
  limitTextLength,
} from '@/utils/socialShare'

describe('social sharing utilities', () => {
  describe('sanitizeShareContent', () => {
    it('should not modify text when anonymize is false', () => {
      const text = 'My name is John and I am happy'
      expect(sanitizeShareContent(text, false)).toBe(text)
    })

    it('should remove name patterns when anonymize is true', () => {
      const text = 'My name is John and I am feeling great'
      const result = sanitizeShareContent(text, true)
      expect(result).toContain('[name removed]')
      expect(result).not.toContain('John')
    })

    it('should remove email addresses when anonymize is true', () => {
      const text = 'Contact me at john@example.com for details'
      const result = sanitizeShareContent(text, true)
      expect(result).toContain('[email removed]')
      expect(result).not.toContain('john@example.com')
    })

    it('should remove phone numbers when anonymize is true', () => {
      const text = 'Call me at 555-123-4567 anytime'
      const result = sanitizeShareContent(text, true)
      expect(result).toContain('[phone removed]')
      expect(result).not.toContain('555-123-4567')
    })

    it('should remove age patterns when anonymize is true', () => {
      const text = 'I am 25 years old and feeling anxious'
      const result = sanitizeShareContent(text, true)
      expect(result).toContain('[age removed]')
      expect(result).not.toContain('25 years old')
    })
  })

  describe('formatShareContent', () => {
    it('should add MindVibe prefix and suffix', () => {
      const text = 'This is my message'
      const result = formatShareContent(text, false)
      
      expect(result).toContain('Shared from MindVibe - KIAAN AI:')
      expect(result).toContain('This is my message')
      expect(result).toContain('kiaanverse.com')
    })

    it('should apply anonymization when requested', () => {
      const text = 'My name is John'
      const result = formatShareContent(text, true)
      
      expect(result).toContain('[name removed]')
      expect(result).not.toContain('John')
    })
  })

  describe('limitTextLength', () => {
    it('should not truncate text shorter than limit', () => {
      const text = 'Short message'
      expect(limitTextLength(text, 'telegram')).toBe(text)
    })

    it('should truncate text longer than platform limit', () => {
      const text = 'a'.repeat(5000)
      const result = limitTextLength(text, 'telegram')
      
      // Telegram limit is 4096
      expect(result.length).toBeLessThanOrEqual(4096)
      expect(result).toContain('...')
    })

    it('should respect WhatsApp high limit', () => {
      const text = 'a'.repeat(10000)
      const result = limitTextLength(text, 'whatsapp')
      
      // WhatsApp limit is 65536
      expect(result.length).toBe(10000) // Should not truncate
    })

    it('should respect Instagram caption limit', () => {
      const text = 'a'.repeat(3000)
      const result = limitTextLength(text, 'instagram')
      
      // Instagram limit is 2200
      expect(result.length).toBeLessThanOrEqual(2200)
      expect(result).toContain('...')
    })
  })
})
