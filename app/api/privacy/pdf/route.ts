/**
 * app/api/privacy/pdf/route.ts
 *
 * GET /api/privacy/pdf → serves the Kiaanverse Privacy Policy as a branded,
 * print-optimised PDF built with @react-pdf/renderer.
 *
 * Architecture:
 *   - Runtime:      Node.js (react-pdf needs streams). Vercel-compatible;
 *                   explicitly NOT puppeteer.
 *   - Rendering:    ReactPDF.renderToStream(document) → Node Readable, then
 *                   bridged to a Web ReadableStream via Node's Readable.toWeb()
 *                   so the Next.js Response can stream bytes straight to the
 *                   client with no full-document buffering.
 *   - Rate limit:   10 requests / 60 s / IP. Uses Upstash Redis REST if the
 *                   env vars are present (edge/Node safe, no client lib
 *                   needed), else falls back to an in-process sliding window
 *                   that protects single-instance deployments.
 *   - Cache:        `public, max-age=86400` — the policy only changes when we
 *                   cut a new version.
 *   - Errors:       500 JSON body `{error, message}` on any failure;
 *                   429 JSON body on rate-limit breach with Retry-After header.
 *
 * Why streaming matters:
 *   A 14-page branded PDF is ~70 KB. Streaming lets the browser start the
 *   download dialog immediately and keeps route memory pressure low even
 *   under burst load.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Readable } from 'node:stream'
import * as ReactPDF from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'

import { getPrivacyDocument } from '@/lib/mdx/privacy'
import { PrivacyPDFDocument } from '@/components/legal/PrivacyPDFDocument'

// ---------------------------------------------------------------------------
// Next.js route config
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // per-request rate limiting
export const revalidate = 0

// ---------------------------------------------------------------------------
// Rate limiter — Redis-first with in-memory fallback
// ---------------------------------------------------------------------------

const WINDOW_SECONDS = 60
const MAX_REQUESTS = 10

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAtSeconds: number
}

/** Upstash Redis REST endpoint pair, if configured. */
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? ''
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const hasRedis = UPSTASH_URL.length > 0 && UPSTASH_TOKEN.length > 0

/**
 * Execute an Upstash REST command. Returns `null` on any transport or parse
 * error so the caller can gracefully fall back to the in-memory limiter.
 */
async function upstash<T>(command: ReadonlyArray<string | number>): Promise<T | null> {
  try {
    const response = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })
    if (!response.ok) return null
    const json = (await response.json()) as { result: T }
    return json.result
  } catch {
    return null
  }
}

/**
 * Redis fixed-window limiter. Uses INCR + EXPIRE semantics so two concurrent
 * requests can't both pass because we set EXPIRE only on first INCR (value === 1).
 */
async function checkRedisLimit(key: string): Promise<RateLimitResult | null> {
  const count = await upstash<number>(['INCR', key])
  if (count === null) return null
  if (count === 1) {
    await upstash(['EXPIRE', key, WINDOW_SECONDS])
  }
  const ttl = (await upstash<number>(['TTL', key])) ?? WINDOW_SECONDS
  return {
    ok: count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - count),
    resetAtSeconds: ttl < 0 ? WINDOW_SECONDS : ttl,
  }
}

/** In-memory sliding window — survives single-process restarts only. */
interface MemoryBucket {
  timestamps: number[]
}
const memoryBuckets: Map<string, MemoryBucket> = new Map()

function checkMemoryLimit(key: string): RateLimitResult {
  const now = Date.now()
  const windowMs = WINDOW_SECONDS * 1000
  const cutoff = now - windowMs
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)
  bucket.timestamps.push(now)
  memoryBuckets.set(key, bucket)

  const count = bucket.timestamps.length
  const oldest = bucket.timestamps[0] ?? now
  const resetAt = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
  return {
    ok: count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - count),
    resetAtSeconds: resetAt,
  }
}

async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (hasRedis) {
    const result = await checkRedisLimit(key)
    if (result) return result
  }
  return checkMemoryLimit(key)
}

// ---------------------------------------------------------------------------
// IP extraction — trusts Vercel / standard proxy headers, falls back to "anon"
// ---------------------------------------------------------------------------

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()
  return 'anon'
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<Response> {
  const ip = extractClientIp(request)
  const rateKey = `ratelimit:privacy-pdf:${ip}`

  let limit: RateLimitResult
  try {
    limit = await checkRateLimit(rateKey)
  } catch {
    // Never let the rate limiter itself break the endpoint — fail open to
    // the in-memory limiter if anything above throws unexpectedly.
    limit = checkMemoryLimit(rateKey)
  }

  const rateHeaders: Record<string, string> = {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(limit.resetAtSeconds),
  }

  if (!limit.ok) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message:
          'Too many PDF requests from this IP. Please retry in a minute.',
      },
      {
        status: 429,
        headers: {
          ...rateHeaders,
          'Retry-After': String(limit.resetAtSeconds),
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  try {
    const privacy = getPrivacyDocument()
    // renderToStream expects a ReactElement<DocumentProps>; our component
    // returns exactly that (its root is <Document>), but the compile-time
    // type can't prove that through the intermediate wrapper, so cast narrowly.
    const element = createElement(PrivacyPDFDocument, {
      doc: privacy,
    }) as unknown as ReactElement<DocumentProps>
    const nodeStream = await ReactPDF.renderToStream(element)
    const webStream = Readable.toWeb(
      nodeStream as unknown as Readable,
    ) as unknown as ReadableStream<Uint8Array>

    return new Response(webStream, {
      status: 200,
      headers: {
        ...rateHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="kiaanverse-privacy-policy.pdf"',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Privacy-Policy-Version': privacy.frontmatter.version,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[api/privacy/pdf] generation failed:', message)
    return NextResponse.json(
      {
        error: 'pdf_generation_failed',
        message,
      },
      {
        status: 500,
        headers: {
          ...rateHeaders,
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
