import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function buildJourneyHeaders(_request: NextRequest): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Forward the httpOnly auth cookie to the backend
  if (accessToken) {
    headers['Cookie'] = `access_token=${accessToken}`
  }

  return headers
}
