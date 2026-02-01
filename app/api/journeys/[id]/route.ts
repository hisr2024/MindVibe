/**
 * Journey Detail API Route - Next.js API route handler for individual journey operations.
 *
 * Handles GET (fetch), PUT (update), and DELETE operations for a specific journey.
 * Proxies requests to the FastAPI backend with proper authentication and retry logic.
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/journeys/[id] - Fetch a specific journey.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = `${BACKEND_URL}/api/journeys/${id}`;

    const cookieHeader = await getCookieHeader();
    const headers = getAuthHeaders(request);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Journeys API] GET error:', error);
    return NextResponse.json(
      { detail: { error: 'SERVICE_UNAVAILABLE', message: 'Unable to fetch journey. Please try again.' } },
      { status: 503 }
    );
  }
}

/**
 * PUT /api/journeys/[id] - Update a specific journey.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const url = `${BACKEND_URL}/api/journeys/${id}`;

    const cookieHeader = await getCookieHeader();
    const headers = getAuthHeaders(request);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetchWithRetry(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Journeys API] PUT error:', error);
    return NextResponse.json(
      { detail: { error: 'SERVICE_UNAVAILABLE', message: 'Unable to update journey. Please try again.' } },
      { status: 503 }
    );
  }
}

/**
 * DELETE /api/journeys/[id] - Delete a specific journey (soft delete).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = `${BACKEND_URL}/api/journeys/${id}`;

    const cookieHeader = await getCookieHeader();
    const headers = getAuthHeaders(request);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetchWithRetry(url, {
      method: 'DELETE',
      headers,
    });

    // Successful delete returns 204 No Content
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // If there's an error, try to parse the response
    if (!response.ok) {
      try {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } catch {
        return NextResponse.json(
          { detail: { error: 'DELETE_FAILED', message: 'Failed to delete journey' } },
          { status: response.status }
        );
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[Journeys API] DELETE error:', error);
    return NextResponse.json(
      { detail: { error: 'SERVICE_UNAVAILABLE', message: 'Unable to delete journey. Please try again.' } },
      { status: 503 }
    );
  }
}
