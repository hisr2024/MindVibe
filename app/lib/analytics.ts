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
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `anon-${Math.random().toString(36).slice(2)}`
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
