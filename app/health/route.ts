import { NextResponse } from 'next/server'
import { buildHealthStatus } from '../../lib/health/status'

export async function GET() {
  const status = buildHealthStatus()
  return NextResponse.json(status, { status: 200 })
}
