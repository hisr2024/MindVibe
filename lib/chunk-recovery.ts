/**
 * Chunk Recovery Utilities
 *
 * Shared helpers for detecting and recovering from stale Next.js chunk errors
 * that occur after deployments (old cached HTML references chunk hashes that
 * no longer exist on the CDN). Used by error boundaries and the inline
 * recovery script in layout.tsx.
 */

const STORAGE_KEY = '__chunk_reload'
const URL_PARAM = '__chunk_reloaded'

/** Detect chunk/module load failures caused by stale deployments. */
export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /loading chunk [\w.-]+ failed/i.test(error.message) ||
    /failed to fetch dynamically imported module/i.test(error.message)
  )
}

/**
 * Attempt to recover from a chunk load error by reloading the page once.
 *
 * Uses a dual-guard strategy to prevent infinite reload loops:
 *   1. Primary: sessionStorage flag (works in most browsers)
 *   2. Fallback: URL search parameter (works when sessionStorage is unavailable,
 *      e.g. storage quota exceeded)
 *
 * @returns true if a reload/redirect was initiated (caller should `return` immediately),
 *          false if recovery was already attempted (caller should show error UI).
 */
export function attemptChunkRecovery(): boolean {
  // Fallback guard: check URL parameter (survives sessionStorage failures)
  const url = new URL(window.location.href)
  if (url.searchParams.has(URL_PARAM)) {
    // Already reloaded via URL fallback — clean the param and stop
    url.searchParams.delete(URL_PARAM)
    history.replaceState(null, '', url.pathname + url.search + url.hash)
    return false
  }

  try {
    // Primary guard: check sessionStorage
    if (sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.removeItem(STORAGE_KEY)
      return false // Already reloaded once — show error UI
    }

    sessionStorage.setItem(STORAGE_KEY, '1')
    window.location.reload()
    return true
  } catch {
    // sessionStorage unavailable (quota exceeded, private browsing edge case)
    // Fall back to URL parameter approach
    url.searchParams.set(URL_PARAM, '1')
    window.location.assign(url.href)
    return true
  }
}
