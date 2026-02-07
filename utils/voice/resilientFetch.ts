/**
 * Resilient Fetch - Request deduplication + retry with exponential backoff
 *
 * Features:
 * - Automatic retry with exponential backoff (configurable attempts)
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Circuit breaker with timed recovery (resets after cooldown)
 * - AbortController support with configurable timeout
 */

interface ResilientFetchOptions {
  maxRetries?: number
  baseDelay?: number       // ms, doubles each retry
  timeout?: number         // ms, per-request timeout
  retryOn?: number[]       // HTTP status codes to retry on
  signal?: AbortSignal     // External abort signal
}

interface CircuitBreakerState {
  failures: number
  disabledUntil: number    // timestamp when circuit breaker resets
  threshold: number        // failures before opening
  cooldownMs: number       // how long to wait before retrying
}

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<Response>>()

// Per-domain circuit breakers
const circuitBreakers = new Map<string, CircuitBreakerState>()

const DEFAULT_CIRCUIT_BREAKER: Omit<CircuitBreakerState, 'failures' | 'disabledUntil'> = {
  threshold: 3,
  cooldownMs: 5 * 60 * 1000,  // 5 minutes
}

function getCircuitBreaker(url: string): CircuitBreakerState {
  const key = new URL(url, window.location.origin).pathname
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      ...DEFAULT_CIRCUIT_BREAKER,
      failures: 0,
      disabledUntil: 0,
    })
  }
  return circuitBreakers.get(key)!
}

function isCircuitOpen(breaker: CircuitBreakerState): boolean {
  if (breaker.failures < breaker.threshold) return false
  if (Date.now() >= breaker.disabledUntil) {
    // Cooldown expired - half-open: allow one request through
    breaker.failures = breaker.threshold - 1
    return false
  }
  return true
}

function recordSuccess(breaker: CircuitBreakerState): void {
  breaker.failures = 0
  breaker.disabledUntil = 0
}

function recordFailure(breaker: CircuitBreakerState): void {
  breaker.failures++
  if (breaker.failures >= breaker.threshold) {
    breaker.disabledUntil = Date.now() + breaker.cooldownMs
  }
}

/**
 * Generate dedup key from request (method + url + body hash)
 */
function getDedupKey(url: string, init?: RequestInit): string {
  const method = init?.method || 'GET'
  const body = typeof init?.body === 'string' ? init.body : ''
  return `${method}:${url}:${body.slice(0, 200)}`
}

/**
 * Fetch with retry, deduplication, circuit breaker, and timeout
 */
export async function resilientFetch(
  url: string,
  init?: RequestInit,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    timeout = 15000,
    retryOn = [502, 503, 504, 429],
    signal: externalSignal,
  } = options

  // Circuit breaker check
  const breaker = getCircuitBreaker(url)
  if (isCircuitOpen(breaker)) {
    throw new Error(`Circuit breaker open for ${url} - retrying in ${Math.ceil((breaker.disabledUntil - Date.now()) / 1000)}s`)
  }

  // Request deduplication
  const dedupKey = getDedupKey(url, init)
  const existing = inFlightRequests.get(dedupKey)
  if (existing && init?.method !== 'POST') {
    // Only dedup GET requests (POST may have side effects)
    return existing.then(r => r.clone())
  }

  const execute = async (): Promise<Response> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Link external signal
      if (externalSignal?.aborted) {
        controller.abort()
      }
      const onExternalAbort = () => controller.abort()
      externalSignal?.addEventListener('abort', onExternalAbort)

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        externalSignal?.removeEventListener('abort', onExternalAbort)

        // Auth failures: open circuit breaker immediately, don't retry
        if (response.status === 401 || response.status === 403) {
          recordFailure(breaker)
          return response
        }

        // Retryable status codes
        if (retryOn.includes(response.status) && attempt < maxRetries) {
          lastError = new Error(`HTTP ${response.status}`)
          continue
        }

        recordSuccess(breaker)
        return response
      } catch (err) {
        clearTimeout(timeoutId)
        externalSignal?.removeEventListener('abort', onExternalAbort)

        if (externalSignal?.aborted) {
          throw new DOMException('Aborted', 'AbortError')
        }

        lastError = err instanceof Error ? err : new Error(String(err))

        // Don't retry on abort
        if (lastError.name === 'AbortError' && attempt < maxRetries) {
          // Timeout - retry
          continue
        }
      }
    }

    recordFailure(breaker)
    throw lastError || new Error(`Fetch failed after ${maxRetries + 1} attempts`)
  }

  const promise = execute().finally(() => {
    inFlightRequests.delete(dedupKey)
  })

  inFlightRequests.set(dedupKey, promise)
  return promise
}

/**
 * Reset circuit breaker for a specific endpoint
 */
export function resetCircuitBreaker(urlPath: string): void {
  circuitBreakers.delete(urlPath)
}

/**
 * Reset all circuit breakers (e.g., after login)
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.clear()
}

/**
 * Check if an endpoint's circuit breaker is open
 */
export function isEndpointDisabled(urlPath: string): boolean {
  const breaker = circuitBreakers.get(urlPath)
  if (!breaker) return false
  return isCircuitOpen(breaker)
}
