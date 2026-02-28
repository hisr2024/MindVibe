import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/auth/webauthn/unregister', 'POST')
