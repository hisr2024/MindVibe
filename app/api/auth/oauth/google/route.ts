/**
 * GET /api/auth/oauth/google — Google OAuth redirect
 *
 * Redirects the user to the backend Google OAuth initiation endpoint.
 * The backend handles the OAuth flow and redirects back with auth cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  const callbackUrl = `${request.nextUrl.origin}/m`
  const backendUrl = `${BACKEND_URL}/api/auth/oauth/google?callback_url=${encodeURIComponent(callbackUrl)}`
  return NextResponse.redirect(backendUrl)
}
