import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/notifications/unsubscribe', 'POST')
