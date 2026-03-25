/**
 * Service Worker Registration Component
 * Registers the service worker on client side.
 *
 * Reload guard: after a SW-triggered reload, a 60-second cooldown prevents
 * further reloads (sessionStorage). This stops infinite reload loops when the
 * SW update check finds a new version on every cycle.
 */

'use client'

import { useEffect } from 'react'

// Module-level flag — survives React re-renders within the same page load
let hasReloadedForSW = false

const SW_RELOAD_COOLDOWN_MS = 60_000
const SW_RELOAD_TS_KEY = 'sw_reload_ts'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let intervalId: ReturnType<typeof setInterval> | undefined

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates periodically
        intervalId = setInterval(() => {
          registration.update().catch(() => {
            // Network error during update check - will retry next interval
          })
        }, 60000) // Check every minute

        // Listen for updates and auto-activate new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Activate the new service worker immediately to clear stale caches
                newWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })

    // Reload page when a new service worker takes control (clears stale caches).
    // Guarded by module-level flag + sessionStorage cooldown to prevent loops.
    // When a new service worker takes control, the SKIP_WAITING message
    // (line 44) already activates it. Subsequent fetches automatically use
    // the new cache, so a hard page reload is unnecessary and causes visible
    // flicker. Instead, just mark the flag to prevent any future reload attempts.
    const handleControllerChange = () => {
      hasReloadedForSW = true
    }

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_QUEUE') {
        // The offline manager will handle sync automatically
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId)
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  return null // This component doesn't render anything
}
