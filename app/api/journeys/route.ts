/**
 * Journeys API Route - Next.js API route handler for journeys CRUD operations.
 *
 * Proxies requests to the FastAPI backend with proper authentication
 * and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Get authentication headers from the request.
 */
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward Authorization header if present
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Forward X-Auth-UID header if present
  const authUid = request.headers.get('X-Auth-UID');
  if (authUid) {
    headers['X-Auth-UID'] = authUid;
  }

  return headers;
}

/**
 * Get cookies to forward to backend.
 */
async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');
  if (accessToken) {
    return `access_token=${accessToken.value}`;
  }
  return '';
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if status code is retryable.
 */
function isRetryable(status: number): boolean {
  return [502, 503, 504].includes(status);
}

/**
 * Make a request to the backend with retry logic.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      if (isRetryable(response.status) && attempt < MAX_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[Journeys API] Backend returned ${response.status}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await sleep(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[Journeys API] Network error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await sleep(delayMs);
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * GET /api/journeys - List journeys with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/api/journeys${queryString ? `?${queryString}` : ''}`;

    const cookieHeader = await getCookieHeader();
    const headers = getAuthHeaders(request);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Journeys API] GET error:', error);
    return NextResponse.json(
      { detail: { error: 'SERVICE_UNAVAILABLE', message: 'Unable to fetch journeys. Please try again.' } },
      { status: 503 }
    );
  }
}

/**
 * POST /api/journeys - Create a new journey.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${BACKEND_URL}/api/journeys`;

    const cookieHeader = await getCookieHeader();
    const headers = getAuthHeaders(request);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Journeys API] POST error:', error);
    return NextResponse.json(
      { detail: { error: 'SERVICE_UNAVAILABLE', message: 'Unable to create journey. Please try again.' } },
      { status: 503 }
    );
  }
}
