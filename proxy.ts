import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware)
 * 
 * This proxy handles request processing before pages are rendered.
 * Currently configured to pass through all requests, as locale handling
 * is done client-side via the LanguageProvider.
 * 
 * Future uses could include:
 * - Request authentication/authorization
 * - Request logging
 * - A/B testing routing
 * - Server-side locale detection
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

  // Pass through all other requests - locale handling is done client-side
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for static files and API routes
    '/((?!_next|api|_vercel|.*\\..*).*)',
  ],
};
