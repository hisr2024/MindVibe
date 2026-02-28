import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/auth/sessions', 'GET')
export const DELETE = createProxyHandler('/api/auth/sessions', 'DELETE')
