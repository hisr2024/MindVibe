/**
 * Next.js Middleware for nonce-based Content Security Policy.
 *
 * Generates a per-request cryptographic nonce and sets the CSP header
 * so that only scripts with the matching nonce attribute can execute.
 * This eliminates the need for 'unsafe-inline' in script-src, which
 * antivirus heuristic engines flag as a security weakness.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://mindvibe-api.onrender.com https://*.firebaseio.com https://*.googleapis.com https://cdn.pixabay.com https://*.freesound.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|icons|locales|favicon\\.ico|robots\\.txt|manifest\\.json|sw\\.js|kiaan-logo|mindvibe-logo|\\.well-known).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
