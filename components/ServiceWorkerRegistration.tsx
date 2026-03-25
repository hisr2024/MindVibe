/**
 * Service Worker Registration Component
 * Registers the service worker on client side and auto-activates updates.
 */

'use client'

import { useEffect } from 'react'

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

    // When a new service worker takes control, the SKIP_WAITING message
    // already activates it. Subsequent fetches automatically use the new
    // cache, so a hard page reload is unnecessary and causes visible flicker.
    const handleControllerChange = () => {
      // No-op: new SW is already active, no reload needed
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
