import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/subscriptions/cancel', 'POST')
