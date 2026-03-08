/**
 * Weekly Assessment API Proxy Routes
 *
 * Proxies requests to the backend weekly assessment endpoints.
 * GET  /api/kiaan/weekly-assessment → questions
 * POST /api/kiaan/weekly-assessment → submit assessment
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/kiaan/weekly-assessment/questions', 'GET')
export const POST = createProxyHandler('/api/kiaan/weekly-assessment/submit', 'POST')
