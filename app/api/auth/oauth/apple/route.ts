/**
 * GET /api/auth/oauth/apple — Apple OAuth redirect
 *
 * Redirects the user to the backend Apple OAuth initiation endpoint.
 * The backend handles the Sign in with Apple flow and redirects back.
 */

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  const callbackUrl = `${request.nextUrl.origin}/m`
  const backendUrl = `${BACKEND_URL}/api/auth/oauth/apple?callback_url=${encodeURIComponent(callbackUrl)}`
  return NextResponse.redirect(backendUrl)
}
