import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/2fa/disable', 'POST')
