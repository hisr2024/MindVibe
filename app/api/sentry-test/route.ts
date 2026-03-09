/**
 * Sentry Test Endpoint
 *
 * Fires a test event to verify Sentry is receiving errors
 * from the Next.js frontend. Hit GET /api/sentry-test and
 * check your Sentry dashboard for the event.
 */

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const testError = new Error('MindVibe frontend Sentry test')
    Sentry.captureException(testError)

    await Sentry.flush(2000)

    return NextResponse.json({
      success: true,
      message: 'Test error sent to Sentry. Check your Sentry dashboard.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test error to Sentry',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
