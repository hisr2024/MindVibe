import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/auth/2fa/status', 'GET')
