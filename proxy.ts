import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware)
 *
 * Handles request processing before pages are rendered:
 * - Generates a per-request cryptographic nonce for Content Security Policy
 * - Sets CSP header with nonce-based script-src (no 'unsafe-inline')
 * - Passes nonce to layout via x-nonce request header
 * - Auto-detects mobile devices and redirects to /m/* routes
 */

// Routes that should never be redirected to mobile
const MOBILE_SKIP_PATTERNS = [
  '/m/',
  '/m',
  '/api/',
  '/_next/',
  '/admin',
  '/login',
  '/signup',
  '/introduction',
  '/onboarding',
  '/favicon',
  '/manifest',
  '/sw.',
  '/icons/',
];

// Desktop route -> mobile route mapping
const MOBILE_ROUTE_MAP: Record<string, string> = {
  '/dashboard': '/m',
  '/kiaan/chat': '/m/kiaan',
  '/kiaan': '/m/kiaan',
  '/journeys': '/m/journeys',
  '/sacred-reflections': '/m/journal',
  '/profile': '/m/profile',
  '/settings': '/m/settings',
  '/tools': '/m/tools',
};

function isMobileUserAgent(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
}

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

  // Mobile auto-detection and redirect
  const preferDesktop = request.cookies.get('prefer-desktop')?.value;
  if (preferDesktop !== 'true') {
    const userAgent = request.headers.get('user-agent') || '';
    if (isMobileUserAgent(userAgent)) {
      // Check if already on mobile route
      const isAlreadyMobile = MOBILE_SKIP_PATTERNS.some(pattern => pathname.startsWith(pattern));

      if (!isAlreadyMobile) {
        // Find matching mobile route
        const mobileRoute = MOBILE_ROUTE_MAP[pathname];
        if (mobileRoute) {
          const url = request.nextUrl.clone();
          url.pathname = mobileRoute;
          return NextResponse.redirect(url);
        }

        // Redirect home/root to mobile home
        if (pathname === '/' || pathname === '/home') {
          const url = request.nextUrl.clone();
          url.pathname = '/m';
          return NextResponse.redirect(url);
        }
      }
    }
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
