/**
 * MindVibe Service Worker
 * Handles offline caching with cache-first, network-fallback strategy
 */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `mindvibe-cache-${CACHE_VERSION}`

// Resources to cache immediately
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/kiaan-logo.svg',
  '/mindvibe-logo.svg',
]

// API endpoints that should be cached
const CACHEABLE_API_ROUTES = [
  '/api/gita/verses',
  '/api/wisdom',
  '/api/kiaan/chat',
]

// Cache duration in milliseconds
const CACHE_DURATION = {
  CRITICAL: 365 * 24 * 60 * 60 * 1000, // 1 year for Gita verses
  HIGH: 30 * 24 * 60 * 60 * 1000, // 30 days for conversations
  MEDIUM: 7 * 24 * 60 * 60 * 1000, // 7 days for responses
  LOW: 24 * 60 * 60 * 1000, // 24 hours for UI preferences
}

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static resources')
      return cache.addAll(STATIC_CACHE)
    })
  )
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all pages immediately
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle API requests with cache-first strategy
  if (CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  // Handle static resources with cache-first, network-fallback
  event.respondWith(handleStaticRequest(request))
})

/**
 * Handle API requests with cache-first, then network strategy
 */
async function handleAPIRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cachedDate = new Date(cachedResponse.headers.get('date'))
      const now = new Date()
      const age = now - cachedDate
      
      // Determine cache duration based on endpoint
      let maxAge = CACHE_DURATION.MEDIUM
      if (request.url.includes('/gita/verses')) {
        maxAge = CACHE_DURATION.CRITICAL
      } else if (request.url.includes('/chat')) {
        maxAge = CACHE_DURATION.HIGH
      }
      
      if (age < maxAge) {
        console.log('[Service Worker] Serving from cache:', request.url)
        return cachedResponse
      }
    }

    // Try network
    console.log('[Service Worker] Fetching from network:', request.url)
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('[Service Worker] Network fetch failed:', error)
    
    // Return cached response if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[Service Worker] Network failed, serving stale cache:', request.url)
      return cachedResponse
    }
    
    // Return offline fallback
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This content is not available in cache.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Handle static resource requests
 */
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Try network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Return cached response if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page or error
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

/**
 * Handle background sync (for when connection is restored)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queued-operations') {
    console.log('[Service Worker] Syncing queued operations')
    event.waitUntil(syncQueuedOperations())
  }
})

/**
 * Sync queued operations from IndexedDB
 */
async function syncQueuedOperations() {
  // This will be handled by the offline manager in the main thread
  // Service worker just triggers the event
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_QUEUE',
      timestamp: Date.now(),
    })
  })
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urls)
      })
    )
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME)
      })
    )
  }
})

console.log('[Service Worker] Loaded')
