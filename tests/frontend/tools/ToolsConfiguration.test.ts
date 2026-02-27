/**
 * Tests for Tool Configuration
 *
 * Validates that all tools are properly configured in lib/constants/tools.ts
 */

import { describe, it, expect } from 'vitest'
import {
  KARMA_TOOLS,
  ALL_TOOLS,
  TOOLS_BY_CATEGORY,
  type ToolConfig,
} from '@/lib/constants/tools'

describe('Tool Configuration', () => {
  describe('KARMA_TOOLS', () => {
    it('should contain Karma Reset tool', () => {
      const karmaReset = KARMA_TOOLS.find(tool => tool.id === 'karma-reset')
      expect(karmaReset).toBeDefined()
    })

    it('Karma Reset should have correct configuration', () => {
      const karmaReset = KARMA_TOOLS.find(tool => tool.id === 'karma-reset')
      expect(karmaReset).toMatchObject({
        id: 'karma-reset',
        icon: '💚',
        title: 'Karma Reset',
        description: 'Heal relational harm with compassion',
        gradient: 'from-emerald-400/30 to-teal-400/30',
        href: '/tools/karma-reset',
        badge: 'new',
      })
    })

    it('should have correct order of tools', () => {
      const toolIds = KARMA_TOOLS.map(tool => tool.id)
      const karmaResetIndex = toolIds.indexOf('karma-reset')
      const karmaFootprintIndex = toolIds.indexOf('karma-footprint')
      const emotionalResetIndex = toolIds.indexOf('emotional-reset')

      // Karma Reset should be between Karma Footprint and Emotional Reset
      expect(karmaResetIndex).toBeGreaterThan(karmaFootprintIndex)
      expect(karmaResetIndex).toBeLessThan(emotionalResetIndex)
    })

    it('should contain all expected karma tools', () => {
      const toolIds = KARMA_TOOLS.map(tool => tool.id)
      expect(toolIds).toContain('karmic-tree')
      expect(toolIds).toContain('karma-footprint')
      expect(toolIds).toContain('karma-reset')
      expect(toolIds).toContain('emotional-reset')
    })
  })

  describe('Tool Configuration Validation', () => {
    it('all tools should have required fields', () => {
      ALL_TOOLS.forEach((tool: ToolConfig) => {
        expect(tool.id).toBeDefined()
        expect(tool.icon).toBeDefined()
        expect(tool.title).toBeDefined()
        expect(tool.description).toBeDefined()
        expect(tool.gradient).toBeDefined()
        expect(tool.href).toBeDefined()
      })
    })

    it('all tool IDs should be unique', () => {
      const ids = ALL_TOOLS.map(tool => tool.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all tool hrefs should be unique', () => {
      const hrefs = ALL_TOOLS.map(tool => tool.href)
      const uniqueHrefs = new Set(hrefs)
      expect(uniqueHrefs.size).toBe(hrefs.length)
    })
  })

  describe('TOOLS_BY_CATEGORY', () => {
    it('should include Core Tools category', () => {
      const coreCategory = TOOLS_BY_CATEGORY.find(cat => cat.id === 'core')
      expect(coreCategory).toBeDefined()
      expect(coreCategory?.name).toBe('Core Tools')
    })

    it('should include Quick Access category', () => {
      const quickAccessCategory = TOOLS_BY_CATEGORY.find(cat => cat.id === 'quick-access')
      expect(quickAccessCategory).toBeDefined()
      expect(quickAccessCategory?.name).toBe('Quick Access')
    })

    it('should include Sacred Instruments and Karma & Growth categories', () => {
      const karmaCategory = TOOLS_BY_CATEGORY.find(cat => cat.id === 'karma')
      const guidanceCategory = TOOLS_BY_CATEGORY.find(cat => cat.id === 'guidance')
      expect(karmaCategory).toBeDefined()
      expect(karmaCategory?.name).toBe('Karma & Growth')
      expect(guidanceCategory).toBeDefined()
      expect(guidanceCategory?.name).toBe('Sacred Instruments')
    })
  })
})
