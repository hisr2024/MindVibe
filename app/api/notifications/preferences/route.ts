import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/notifications/preferences', 'GET')
export const PUT = createProxyHandler('/api/notifications/preferences', 'PUT')
