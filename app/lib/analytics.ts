const PREF_KEY = 'mv-onboarding-preferences'
const SESSION_KEY = 'mv-analytics-session'

function readPrefs(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = window.localStorage.getItem(PREF_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Unable to read analytics preferences', error)
    return {}
  }
}

function ensureSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous-server'
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing

  const generated = (() => {
    if (typeof crypto === 'undefined') return 'anonymous-client'
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
      ].join('-')
    }
    return 'anonymous-client'
  })()

  window.localStorage.setItem(SESSION_KEY, generated)
  return generated
}

export async function trackEvent(
  event: string,
  properties: Record<string, unknown> = {},
  options?: { force?: boolean }
): Promise<void> {
  if (typeof window === 'undefined') return

  const prefs = readPrefs()
  if (!options?.force && prefs.analytics === false) return

  const sessionId = ensureSessionId()
  const userId = typeof prefs.userId === 'string' ? prefs.userId : sessionId
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

  try {
    await fetch(`${baseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        user_id: userId,
        session_id: sessionId,
        source: 'web',
        properties: {
          ...properties,
          path: window.location.pathname,
          user_agent: navigator.userAgent,
        },
      }),
    })
  } catch (error) {
    console.warn('Failed to send analytics event', error)
  }
}

export function analyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const prefs = readPrefs()
  return prefs.analytics !== false
}
