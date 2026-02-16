import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware)
 *
 * Handles request processing before pages are rendered:
 * - Generates a per-request cryptographic nonce for Content Security Policy
 * - Sets CSP header with nonce-based script-src (no 'unsafe-inline')
 * - Passes nonce to layout via x-nonce request header
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static files, API routes, and special Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.') || // files with extensions
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Generate a per-request nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

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
  ].join('; ');

  // Pass the nonce to layout via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set CSP header on the response
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for static files and API routes
    '/((?!_next|api|_vercel|.*\\..*).*)',
  ],
};
