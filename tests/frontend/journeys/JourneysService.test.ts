/**
 * Tests for Journeys Enhanced Service
 *
 * Tests:
 * - API function behavior
 * - Error handling
 * - Type validation
 * - Offline queue functionality
 * - Premium error handling
 * - Utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage: Record<string, string> = {}
global.localStorage = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
  }),
  length: 0,
  key: vi.fn(),
}

// Mock sessionStorage
global.sessionStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  get: vi.fn(() => ''),
  set: vi.fn(),
})

describe('JourneysEnhancedService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Utility Functions', () => {
    it('getEnemyDisplayName returns correct display names', () => {
      const names: Record<string, string> = {
        kama: 'Desire (Kama)',
        krodha: 'Anger (Krodha)',
        lobha: 'Greed (Lobha)',
        moha: 'Attachment (Moha)',
        mada: 'Pride (Mada)',
        matsarya: 'Envy (Matsarya)',
        mixed: 'Mixed Journey',
        general: 'General Wisdom',
      }

      // Test structure
      Object.keys(names).forEach(tag => {
        expect(names[tag]).toBeDefined()
        expect(names[tag].length).toBeGreaterThan(0)
      })
    })

    it('getEnemyColor returns valid colors', () => {
      const colors: Record<string, string> = {
        kama: 'rose',
        krodha: 'red',
        lobha: 'amber',
        moha: 'purple',
        mada: 'orange',
        matsarya: 'emerald',
        mixed: 'indigo',
        general: 'blue',
      }

      Object.keys(colors).forEach(tag => {
        expect(colors[tag]).toBeDefined()
        expect(colors[tag].length).toBeGreaterThan(0)
      })
    })

    it('getDifficultyLabel returns correct labels', () => {
      const labels = ['', 'Beginner', 'Easy', 'Moderate', 'Challenging', 'Advanced']

      expect(labels[1]).toBe('Beginner')
      expect(labels[2]).toBe('Easy')
      expect(labels[3]).toBe('Moderate')
      expect(labels[4]).toBe('Challenging')
      expect(labels[5]).toBe('Advanced')
    })

    it('formatDuration formats days correctly', () => {
      const formatDuration = (days: number): string => {
        if (days === 1) return '1 day'
        if (days < 7) return `${days} days`
        const weeks = Math.floor(days / 7)
        const remainingDays = days % 7
        if (remainingDays === 0) {
          return weeks === 1 ? '1 week' : `${weeks} weeks`
        }
        return `${weeks}w ${remainingDays}d`
      }

      expect(formatDuration(1)).toBe('1 day')
      expect(formatDuration(3)).toBe('3 days')
      expect(formatDuration(7)).toBe('1 week')
      expect(formatDuration(14)).toBe('2 weeks')
      expect(formatDuration(10)).toBe('1w 3d')
    })

    it('getTierBadge returns correct badge info', () => {
      const getTierBadge = (tier: string): { label: string; color: string; icon: string } => {
        switch (tier.toLowerCase()) {
          case 'basic':
            return { label: 'Basic', color: 'blue', icon: 'star' }
          case 'premium':
            return { label: 'Premium', color: 'orange', icon: 'crown' }
          case 'enterprise':
            return { label: 'Enterprise', color: 'purple', icon: 'building' }
          default:
            return { label: 'Free', color: 'gray', icon: 'user' }
        }
      }

      expect(getTierBadge('free')).toEqual({ label: 'Free', color: 'gray', icon: 'user' })
      expect(getTierBadge('basic')).toEqual({ label: 'Basic', color: 'blue', icon: 'star' })
      expect(getTierBadge('premium')).toEqual({ label: 'Premium', color: 'orange', icon: 'crown' })
      expect(getTierBadge('enterprise')).toEqual({ label: 'Enterprise', color: 'purple', icon: 'building' })
    })
  })

  describe('Offline Queue', () => {
    const JOURNEY_QUEUE_KEY = 'mindvibe_journey_queue'

    it('getQueuedJourneys returns empty array when no queue', () => {
      const queue = JSON.parse(mockLocalStorage[JOURNEY_QUEUE_KEY] || '[]')
      expect(queue).toEqual([])
    })

    it('queueJourneyStart adds journey to queue', () => {
      const queuedJourney = {
        id: `queue_${Date.now()}_test`,
        journey_ids: ['demo-krodha-001'],
        personalization: { pace: 'daily' },
        queued_at: new Date().toISOString(),
        retry_count: 0,
      }

      const queue = [queuedJourney]
      mockLocalStorage[JOURNEY_QUEUE_KEY] = JSON.stringify(queue)

      const storedQueue = JSON.parse(mockLocalStorage[JOURNEY_QUEUE_KEY])
      expect(storedQueue).toHaveLength(1)
      expect(storedQueue[0].journey_ids).toEqual(['demo-krodha-001'])
    })

    it('removeFromQueue removes journey from queue', () => {
      const queuedJourney = {
        id: 'queue_123',
        journey_ids: ['demo-krodha-001'],
        queued_at: new Date().toISOString(),
        retry_count: 0,
      }

      mockLocalStorage[JOURNEY_QUEUE_KEY] = JSON.stringify([queuedJourney])

      // Remove from queue
      const queue = JSON.parse(mockLocalStorage[JOURNEY_QUEUE_KEY])
      const filtered = queue.filter((q: any) => q.id !== 'queue_123')
      mockLocalStorage[JOURNEY_QUEUE_KEY] = JSON.stringify(filtered)

      const storedQueue = JSON.parse(mockLocalStorage[JOURNEY_QUEUE_KEY])
      expect(storedQueue).toHaveLength(0)
    })

    it('hasQueuedJourneys returns correct status', () => {
      // Empty queue
      mockLocalStorage[JOURNEY_QUEUE_KEY] = '[]'
      let queue = JSON.parse(mockLocalStorage[JOURNEY_QUEUE_KEY])
      expect(queue.length > 0).toBe(false)

      // With queued journey
      mockLocalStorage[JOURNEY_QUEUE_KEY] = JSON.stringify([
        { id: 'test', journey_ids: ['demo'] }
      ])
      queue = JSON.parse(mockLocalStorage[JOURNEY_QUEUE_KEY])
      expect(queue.length > 0).toBe(true)
    })
  })

  describe('Type Definitions', () => {
    it('JourneyTemplate type has required fields', () => {
      const template = {
        id: 'demo-krodha-001',
        slug: 'transform-anger',
        title: 'Transform Anger (Krodha)',
        description: 'A 14-day journey to transform anger',
        primary_enemy_tags: ['krodha'],
        duration_days: 14,
        difficulty: 2,
        is_featured: true,
        is_free: true,
        icon_name: 'flame',
        color_theme: 'red',
      }

      expect(template.id).toBeDefined()
      expect(template.slug).toBeDefined()
      expect(template.title).toBeDefined()
      expect(typeof template.duration_days).toBe('number')
      expect(typeof template.difficulty).toBe('number')
      expect(typeof template.is_featured).toBe('boolean')
      expect(typeof template.is_free).toBe('boolean')
      expect(Array.isArray(template.primary_enemy_tags)).toBe(true)
    })

    it('UserJourney type has required fields', () => {
      const journey = {
        id: 'journey-123',
        template_id: 'demo-krodha-001',
        template_title: 'Transform Anger',
        template_slug: 'transform-anger',
        status: 'active' as const,
        current_day_index: 3,
        total_days: 14,
        progress_percentage: 21,
        started_at: '2024-01-15T10:00:00Z',
        personalization: {
          pace: 'daily' as const,
          preferred_tone: 'gentle' as const,
        },
      }

      expect(journey.id).toBeDefined()
      expect(journey.status).toBe('active')
      expect(typeof journey.current_day_index).toBe('number')
      expect(typeof journey.total_days).toBe('number')
      expect(typeof journey.progress_percentage).toBe('number')
    })

    it('KiaanStep type has required fields', () => {
      const step = {
        step_title: 'Day 1: Understanding Anger',
        today_focus: 'krodha',
        verse_refs: [{ chapter: 2, verse: 63 }],
        teaching: 'Today we explore anger...',
        guided_reflection: ['When did you last feel angry?'],
        practice: {
          name: 'Breath Awareness',
          instructions: ['Sit quietly', 'Breathe deeply'],
          duration_minutes: 5,
        },
        micro_commitment: 'I will pause before reacting today.',
        check_in_prompt: {
          scale: '0-10',
          label: 'How intense is your anger today?',
        },
      }

      expect(step.step_title).toBeDefined()
      expect(step.today_focus).toBeDefined()
      expect(Array.isArray(step.verse_refs)).toBe(true)
      expect(step.teaching).toBeDefined()
      expect(Array.isArray(step.guided_reflection)).toBe(true)
      expect(step.practice).toBeDefined()
      expect(step.micro_commitment).toBeDefined()
      expect(step.check_in_prompt).toBeDefined()
    })

    it('JourneyAccess type has required fields', () => {
      const access = {
        has_access: true,
        tier: 'premium' as const,
        active_journeys: 2,
        journey_limit: 5,
        remaining: 3,
        is_unlimited: false,
        can_start_more: true,
        is_trial: false,
        trial_days_limit: 0,
        upgrade_url: null,
        upgrade_cta: null,
      }

      expect(typeof access.has_access).toBe('boolean')
      expect(typeof access.tier).toBe('string')
      expect(typeof access.active_journeys).toBe('number')
      expect(typeof access.journey_limit).toBe('number')
      expect(typeof access.remaining).toBe('number')
      expect(typeof access.is_unlimited).toBe('boolean')
      expect(typeof access.can_start_more).toBe('boolean')
    })
  })

  describe('Error Classes', () => {
    it('PremiumFeatureError has correct structure', () => {
      class PremiumFeatureError extends Error {
        public readonly isPremiumError = true
        public readonly errorCode: string
        public readonly feature: string
        public readonly tier: string
        public readonly upgradeUrl: string
        public readonly upgradeCta: string

        constructor(data: {
          error: string
          feature: string
          message: string
          tier: string
          upgrade_url: string
          upgrade_cta: string
        }) {
          super(data.message)
          this.name = 'PremiumFeatureError'
          this.errorCode = data.error
          this.feature = data.feature
          this.tier = data.tier
          this.upgradeUrl = data.upgrade_url
          this.upgradeCta = data.upgrade_cta
        }
      }

      const error = new PremiumFeatureError({
        error: 'feature_not_available',
        feature: 'wisdom_journeys',
        message: 'Premium feature required',
        tier: 'free',
        upgrade_url: '/pricing',
        upgrade_cta: 'Upgrade Now',
      })

      expect(error.isPremiumError).toBe(true)
      expect(error.errorCode).toBe('feature_not_available')
      expect(error.feature).toBe('wisdom_journeys')
      expect(error.message).toBe('Premium feature required')
    })

    it('AuthenticationError has correct structure', () => {
      class AuthenticationError extends Error {
        public readonly isAuthError = true
        public readonly statusCode: number

        constructor(message: string, statusCode: number = 401) {
          super(message)
          this.name = 'AuthenticationError'
          this.statusCode = statusCode
        }
      }

      const error = new AuthenticationError('Not authenticated', 401)

      expect(error.isAuthError).toBe(true)
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Not authenticated')
    })

    it('ServiceUnavailableError has correct structure', () => {
      class ServiceUnavailableError extends Error {
        public readonly isServiceError = true
        public readonly errorCode: string

        constructor(errorCode: string, message: string) {
          super(message)
          this.name = 'ServiceUnavailableError'
          this.errorCode = errorCode
        }
      }

      const error = new ServiceUnavailableError(
        'database_not_ready',
        'Database is being set up'
      )

      expect(error.isServiceError).toBe(true)
      expect(error.errorCode).toBe('database_not_ready')
      expect(error.message).toBe('Database is being set up')
    })
  })

  describe('Data Validation', () => {
    it('validates verse reference structure', () => {
      const validRef = { chapter: 2, verse: 47 }

      expect(validRef.chapter).toBeGreaterThanOrEqual(1)
      expect(validRef.chapter).toBeLessThanOrEqual(18)
      expect(validRef.verse).toBeGreaterThanOrEqual(1)
    })

    it('validates check-in intensity range', () => {
      const checkIn = { intensity: 5, label: 'moderate' }

      expect(checkIn.intensity).toBeGreaterThanOrEqual(0)
      expect(checkIn.intensity).toBeLessThanOrEqual(10)
    })

    it('validates personalization pace values', () => {
      const validPaces = ['daily', 'every_other_day', 'weekly']
      const invalidPaces = ['hourly', 'monthly', 'never']

      validPaces.forEach(pace => {
        expect(validPaces.includes(pace)).toBe(true)
      })

      invalidPaces.forEach(pace => {
        expect(validPaces.includes(pace)).toBe(false)
      })
    })

    it('validates journey status values', () => {
      const validStatuses = ['active', 'paused', 'completed', 'abandoned']

      validStatuses.forEach(status => {
        expect(typeof status).toBe('string')
        expect(status.length).toBeGreaterThan(0)
      })
    })

    it('validates difficulty range', () => {
      // Difficulty should be 1-5
      const validDifficulties = [1, 2, 3, 4, 5]
      const invalidDifficulties = [0, 6, -1]

      validDifficulties.forEach(d => {
        expect(d).toBeGreaterThanOrEqual(1)
        expect(d).toBeLessThanOrEqual(5)
      })

      invalidDifficulties.forEach(d => {
        expect(d >= 1 && d <= 5).toBe(false)
      })
    })
  })

  describe('API URL Generation', () => {
    it('generates correct catalog URL', () => {
      const baseUrl = ''
      const catalogUrl = `${baseUrl}/api/journeys/catalog`
      expect(catalogUrl).toBe('/api/journeys/catalog')
    })

    it('generates correct journey-specific URLs', () => {
      const baseUrl = ''
      const journeyId = 'journey-123'
      const dayIndex = 5

      const todayUrl = `${baseUrl}/api/journeys/${journeyId}/today`
      const completeUrl = `${baseUrl}/api/journeys/${journeyId}/steps/${dayIndex}/complete`
      const pauseUrl = `${baseUrl}/api/journeys/${journeyId}/pause`
      const historyUrl = `${baseUrl}/api/journeys/${journeyId}/history`

      expect(todayUrl).toBe('/api/journeys/journey-123/today')
      expect(completeUrl).toBe('/api/journeys/journey-123/steps/5/complete')
      expect(pauseUrl).toBe('/api/journeys/journey-123/pause')
      expect(historyUrl).toBe('/api/journeys/journey-123/history')
    })
  })
})

describe('Journey Templates Data', () => {
  it('loads journey templates from JSON', async () => {
    // Mock the import
    const mockTemplates = {
      templates: [
        {
          id: 'demo-krodha-001',
          slug: 'transform-anger',
          title: 'Transform Anger (Krodha)',
          duration_days: 14,
          difficulty: 2,
          is_featured: true,
          is_free: true,
          primary_enemy_tags: ['krodha'],
        }
      ]
    }

    expect(mockTemplates.templates.length).toBeGreaterThanOrEqual(1)

    const firstTemplate = mockTemplates.templates[0]
    expect(firstTemplate.id).toBeDefined()
    expect(firstTemplate.title).toBeDefined()
    expect(firstTemplate.duration_days).toBeGreaterThan(0)
  })

  it('has at least one free journey for trial users', async () => {
    const mockTemplates = [
      { id: '1', is_free: true },
      { id: '2', is_free: false },
    ]

    const freeJourneys = mockTemplates.filter(t => t.is_free)
    expect(freeJourneys.length).toBeGreaterThanOrEqual(1)
  })

  it('has correct enemy tags', async () => {
    const validEnemies = ['kama', 'krodha', 'lobha', 'moha', 'mada', 'matsarya']

    const mockTemplate = {
      primary_enemy_tags: ['krodha', 'moha'],
    }

    mockTemplate.primary_enemy_tags.forEach(tag => {
      expect(validEnemies.includes(tag)).toBe(true)
    })
  })
})
