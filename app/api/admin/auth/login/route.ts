import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/admin/auth/login', 'POST')
