import { createProxyHandler } from '@/lib/proxy-utils'

export const POST = createProxyHandler('/api/karma-footprint/analyze', 'POST')
