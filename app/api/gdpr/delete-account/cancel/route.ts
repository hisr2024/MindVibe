import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/gdpr/delete-account/cancel', 'POST')
