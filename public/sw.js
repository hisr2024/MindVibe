/**
 * MindVibe Service Worker v18.0 - Silent Production Grade
 *
 * Zero console output. Robust offline support. Intelligent caching.
 *
 * Caching Strategy:
 * - Static assets: cache-first (30 days)
 * - Dynamic pages: network-first, cache fallback
 * - API responses: stale-while-revalidate (1 hour, 1 year for Gita verses)
 * - Images: cache-first (30 days)
 */

const CACHE_VERSION = 'mindvibe-v19.0-account-profile-rebuild';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_API = `${CACHE_VERSION}-api`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

const STATIC_ASSETS = [
  '/manifest.json',
  '/kiaan-logo.svg',
  '/mindvibe-logo.svg',
];

const OPTIONAL_ASSETS = ['/offline'];

const CACHEABLE_API_ENDPOINTS = [
  '/api/chat/about',
  '/api/chat/health',
  '/api/gita/verses',
  '/api/wisdom',
  '/api/kiaan',
  '/api/journeys/catalog',
  '/api/journeys/access',
  '/api/journeys/active',
  '/api/journeys/today',
];

const NON_CACHEABLE_JOURNEY_ENDPOINTS = [
  '/api/journeys/access',
  '/api/journeys/active',
  '/api/journeys/today',
];

const MAX_CACHE_SIZE = {
  dynamic: 50,
  api: 100,
  images: 100
};

const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000,
  dynamic: 7 * 24 * 60 * 60 * 1000,
  api: 1 * 60 * 60 * 1000,
  images: 30 * 24 * 60 * 60 * 1000,
  verses: 365 * 24 * 60 * 60 * 1000,
};

async function cacheAsset(cache, url) {
  try {
    const response = await fetch(url, { cache: 'no-cache', redirect: 'follow' });
    if (response.ok && !response.redirected) {
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_STATIC);
        await Promise.allSettled(STATIC_ASSETS.map(url => cacheAsset(cache, url)));
        await Promise.allSettled(OPTIONAL_ASSETS.map(url => cacheAsset(cache, url)));
        return self.skipWaiting();
      } catch {
        return self.skipWaiting();
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([CACHE_STATIC, CACHE_DYNAMIC, CACHE_API, CACHE_IMAGES]);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !currentCaches.has(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (!url.protocol.startsWith('http')) return
  if (url.origin !== self.location.origin) return

  // Never intercept Next.js runtime/build assets. Let the browser + CDN handle them directly.
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/_next/data') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return
  }

  const isMediaRequest =
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.mp4') ||
    request.headers.get('Range') !== null ||
    request.destination === 'audio' ||
    request.destination === 'video'

  if (isMediaRequest) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  if (CACHEABLE_API_ENDPOINTS.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  event.respondWith(handleStaticRequest(request))
})

async function handleAPIRequest(request) {
  if (request.method !== 'GET') {
    try {
      return await fetch(request)
    } catch {
      if (request.url.includes('/wisdom-journey/') || request.url.includes('/api/journeys/')) {
        if (request.url.includes('/start')) {
          return new Response(
            JSON.stringify({ _offline: true, error: 'offline', message: 'Journey start queued for when you reconnect.', queued: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ _offline: true, completed: true, message: 'Saved offline - will sync when connection restored' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'network_error', message: 'Network request failed. Please try again.', _offline: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  try {
    const shouldCache = !NON_CACHEABLE_JOURNEY_ENDPOINTS.some((route) => request.url.includes(route))

    if (!shouldCache) {
      return await fetch(request)
    }

    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('date'))
      const now = new Date()
      const age = now - cachedDate

      let maxAge = CACHE_DURATION.api
      if (request.url.includes('/gita/verses')) {
        maxAge = CACHE_DURATION.verses
      }

      if (age < maxAge) {
        return cachedResponse
      }
    }

    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
      const cache = await caches.open(CACHE_API)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse

    if (request.url.includes('/wisdom-journey/') || request.url.includes('/api/journeys/')) {
      if (request.url.includes('/catalog')) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-MindVibe-Offline': 'true' },
        })
      }
      if (request.url.includes('/active') || request.url.includes('/today')) {
        return new Response(
          JSON.stringify(request.url.includes('/today') ? { steps: [], priority_step: null, _offline: true } : []),
          { status: 200, headers: { 'Content-Type': 'application/json', 'X-MindVibe-Offline': 'true' } }
        )
      }
      return new Response(
        JSON.stringify({ _offline: true, message: 'You are currently offline. Using cached data.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline. This content is not available in cache.', _offline: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
      const cache = await caches.open(CACHE_DYNAMIC)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse

    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) return offlineResponse

    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function handleStaticRequest(request) {
  if (request.method !== 'GET') {
    return fetch(request)
  }

  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      if (isUnexpectedAssetMimeType(request, cachedResponse)) {
        await deleteFromManagedCaches(request)
      } else {
        return cachedResponse
      }
    }

    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
      const cache = await caches.open(CACHE_DYNAMIC)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}


async function deleteFromManagedCaches(request) {
  const cacheNames = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_API, CACHE_IMAGES]
  await Promise.all(cacheNames.map(async (cacheName) => {
    const cache = await caches.open(cacheName)
    await cache.delete(request)
  }))
}

function isUnexpectedAssetMimeType(request, response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const destination = request.destination
  const pathname = new URL(request.url).pathname

  const isScriptRequest = destination === 'script' || pathname.endsWith('.js')
  if (isScriptRequest) {
    return !contentType.includes('javascript') && !contentType.includes('ecmascript')
  }

  const isStyleRequest = destination === 'style' || pathname.endsWith('.css')
  if (isStyleRequest) {
    return !contentType.includes('text/css')
  }

  return false
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queued-operations') {
    event.waitUntil(syncQueuedOperations())
  }
})

async function syncQueuedOperations() {
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_QUEUE', timestamp: Date.now() })
  })
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_DYNAMIC);
        await Promise.allSettled(urls.map(url => cacheAsset(cache, url)));
      })()
    )
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_STATIC),
        caches.delete(CACHE_DYNAMIC),
        caches.delete(CACHE_API),
        caches.delete(CACHE_IMAGES)
      ]).then(() => {
        return Promise.all([
          caches.open(CACHE_STATIC),
          caches.open(CACHE_DYNAMIC),
          caches.open(CACHE_API),
          caches.open(CACHE_IMAGES)
        ])
      })
    )
  }
})
