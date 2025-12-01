const CACHE_NAME = 'mindvibe-offline-v1'
const OFFLINE_ASSETS = [
  '/',
  '/dashboard',
  '/flows',
  '/flows/journal',
  '/kiaan',
  '/onboarding',
  '/journeys',
  '/insights',
  '/manifest.json',
  '/icon.png',
  '/icons/icon.svg',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_ASSETS)
    }),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key)),
      ),
    ),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never interfere with dynamic or API traffic (including KIAAN routes).
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/backend') || url.pathname.startsWith('/_next')) {
    return
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/'))),
  )
})
