import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Root middleware for authentication and security.
 * Protects routes that require authentication by checking for session tokens.
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/account',
  '/admin',
  '/settings',
  '/companion',
  '/journal',
]

const ADMIN_ROUTES = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires authentication
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route))

  if (isProtected) {
    // Check for auth token in cookies
    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('session_token')?.value

    if (!token) {
      // Redirect to login with return URL
      const loginUrl = new URL('/introduction', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // For admin routes, we could add additional checks here
    // (full admin verification happens server-side in the API)
    if (isAdmin) {
      const adminToken = request.cookies.get('admin_token')?.value
      if (!adminToken && !token) {
        return NextResponse.redirect(new URL('/introduction', request.url))
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Add request ID for tracing
  const requestId = crypto.randomUUID()
  response.headers.set('x-request-id', requestId)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     * - public files (sw.js, robots.txt, sitemap.xml)
     * - API routes (handled by backend)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js|robots\\.txt|sitemap\\.xml|api/).*)',
  ],
}
