import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function buildJourneyHeaders(request: NextRequest): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const xAuthUid = request.headers.get('X-Auth-UID')
  const authorization = request.headers.get('Authorization')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authorization) {
    headers['Authorization'] = authorization
  }

  if (accessToken) {
    headers['Cookie'] = `access_token=${accessToken}`
  }

  if (xAuthUid) {
    headers['X-Auth-UID'] = xAuthUid
  }

  return headers
}
