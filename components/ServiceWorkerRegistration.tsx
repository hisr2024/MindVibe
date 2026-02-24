/**
 * Service Worker Registration Component
 * Registers the service worker on client side
 */

'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates periodically
          setInterval(() => {
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

      // Reload page when a new service worker takes control (clears stale caches)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_QUEUE') {
          // The offline manager will handle sync automatically
        }
      })
    }
  }, [])

  return null // This component doesn't render anything
}
