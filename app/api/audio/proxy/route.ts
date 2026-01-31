/**
 * Audio Proxy API Route
 *
 * Proxies audio requests to external sources (Internet Archive, LibriVox, Freesound)
 * to bypass CORS restrictions. Streams audio with proper headers for browser playback.
 *
 * Usage: /api/audio/proxy?url=<encoded_audio_url>
 */

import { NextRequest, NextResponse } from 'next/server'

// Allowed audio source domains (whitelist for security)
const ALLOWED_DOMAINS = [
  'archive.org',
  'ia800207.us.archive.org',
  'ia801406.us.archive.org',
  'ia600207.us.archive.org',
  'ia801900.us.archive.org',
  'cdn.freesound.org',
  'freesound.org',
  'www.archive.org',
]

// Check if URL is from an allowed domain
function isAllowedDomain(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith('.' + domain) ||
        parsed.hostname.endsWith('.us.archive.org')
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const audioUrl = searchParams.get('url')

  // Validate URL parameter
  if (!audioUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  // Decode URL
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(audioUrl)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL encoding' },
      { status: 400 }
    )
  }

  // Security: Only allow whitelisted domains
  if (!isAllowedDomain(decodedUrl)) {
    return NextResponse.json(
      { error: 'Domain not allowed' },
      { status: 403 }
    )
  }

  try {
    // Get range header for streaming support
    const rangeHeader = request.headers.get('range')

    // Fetch audio from external source
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'MindVibe/1.0 (Audio Player)',
    }

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader
    }

    const response = await fetch(decodedUrl, {
      headers: fetchHeaders,
      // Don't follow redirects automatically - handle them
      redirect: 'follow',
    })

    if (!response.ok && response.status !== 206) {
      console.error(`[Audio Proxy] Failed to fetch: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.status}` },
        { status: response.status }
      )
    }

    // Get content type and length
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')
    const acceptRanges = response.headers.get('accept-ranges')

    // Build response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    }

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }

    if (acceptRanges) {
      responseHeaders['Accept-Ranges'] = acceptRanges
    } else {
      responseHeaders['Accept-Ranges'] = 'bytes'
    }

    // Stream the response
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('[Audio Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy audio request' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

// Handle HEAD requests for audio metadata
export async function HEAD(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const audioUrl = searchParams.get('url')

  if (!audioUrl) {
    return new NextResponse(null, { status: 400 })
  }

  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(audioUrl)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  if (!isAllowedDomain(decodedUrl)) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const response = await fetch(decodedUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'MindVibe/1.0 (Audio Player)',
      },
    })

    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const contentLength = response.headers.get('content-length')

    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    }

    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    return new NextResponse(null, {
      status: response.ok ? 200 : response.status,
      headers,
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
