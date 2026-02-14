/**
 * Unit tests for the micro-practice persistence adapter (practiceState).
 *
 * Mocks indexedDBManager to verify that:
 * - getPracticeState reads from IDB and defaults to false
 * - setPracticeState writes the correct record shape
 * - Failures are handled gracefully (no throw)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  practiceKey,
  getPracticeState,
  setPracticeState,
} from '@/lib/journey/practiceState'

// ---------------------------------------------------------------------------
// Mock the IDB manager — no real IndexedDB in jsdom
// ---------------------------------------------------------------------------
const mockGet = vi.fn()
const mockPut = vi.fn()

vi.mock('@/lib/offline/indexedDB', () => ({
  indexedDBManager: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
  STORES: {
    PRACTICE_STATE: 'practiceState',
  },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('practiceKey', () => {
  it('builds a composite key from journeyId and day', () => {
    expect(practiceKey('abc-123', 5)).toBe('abc-123:day-5')
  })

  it('handles day 1 and day 14 boundaries', () => {
    expect(practiceKey('j', 1)).toBe('j:day-1')
    expect(practiceKey('j', 14)).toBe('j:day-14')
  })
})

describe('getPracticeState', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('returns true when IDB record has practiced=true', async () => {
    mockGet.mockResolvedValueOnce({
      id: 'j1:day-3',
      journeyId: 'j1',
      day: 3,
      practiced: true,
      updatedAt: '2026-01-01T00:00:00Z',
    })

    const result = await getPracticeState('j1', 3)
    expect(result).toBe(true)
    expect(mockGet).toHaveBeenCalledWith('practiceState', 'j1:day-3')
  })

  it('returns false when IDB record has practiced=false', async () => {
    mockGet.mockResolvedValueOnce({
      id: 'j1:day-2',
      journeyId: 'j1',
      day: 2,
      practiced: false,
      updatedAt: '2026-01-01T00:00:00Z',
    })

    const result = await getPracticeState('j1', 2)
    expect(result).toBe(false)
  })

  it('returns false when no record exists (undefined)', async () => {
    mockGet.mockResolvedValueOnce(undefined)

    const result = await getPracticeState('j1', 7)
    expect(result).toBe(false)
  })

  it('returns false when IDB throws (graceful fallback)', async () => {
    mockGet.mockRejectedValueOnce(new Error('IDB unavailable'))

    const result = await getPracticeState('j1', 1)
    expect(result).toBe(false)
  })
})

describe('setPracticeState', () => {
  beforeEach(() => {
    mockPut.mockReset()
  })

  it('writes the correct record shape to IDB', async () => {
    mockPut.mockResolvedValueOnce(undefined)

    await setPracticeState('journey-42', 5, true)

    expect(mockPut).toHaveBeenCalledTimes(1)
    const [storeName, record] = mockPut.mock.calls[0]
    expect(storeName).toBe('practiceState')
    expect(record.id).toBe('journey-42:day-5')
    expect(record.journeyId).toBe('journey-42')
    expect(record.day).toBe(5)
    expect(record.practiced).toBe(true)
    expect(record.updatedAt).toBeTruthy()
  })

  it('writes practiced=false correctly', async () => {
    mockPut.mockResolvedValueOnce(undefined)

    await setPracticeState('j1', 3, false)

    const record = mockPut.mock.calls[0][1]
    expect(record.practiced).toBe(false)
  })

  it('does not throw when IDB fails (logs warning)', async () => {
    mockPut.mockRejectedValueOnce(new Error('QuotaExceeded'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(setPracticeState('j1', 1, true)).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
