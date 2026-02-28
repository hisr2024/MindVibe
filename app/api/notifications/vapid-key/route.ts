import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/notifications/vapid-key', 'GET')
