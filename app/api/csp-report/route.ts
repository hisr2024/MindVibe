import { NextResponse } from 'next/server'

/**
 * CSP Violation Report Endpoint
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * Logs them for monitoring without exposing details to clients.
 */
export async function POST(request: Request) {
  try {
    const report = await request.json()
    // Log the CSP violation for monitoring
    console.warn('[CSP Violation]', JSON.stringify(report, null, 2))
  } catch {
    // Silently handle malformed reports
  }
  return new NextResponse(null, { status: 204 })
}
