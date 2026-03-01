/**
 * Admin Subscription Links API Proxy
 *
 * POST /api/admin/subscriptions/links → Create a subscription link
 * GET  /api/admin/subscriptions/links → List subscription links
 */

import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/admin/subscriptions/links', 'POST')
export const GET = createProxyHandler('/api/admin/subscriptions/links', 'GET')
