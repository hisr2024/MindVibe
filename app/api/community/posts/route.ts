import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/community/posts', 'GET')
export const POST = createProxyHandler('/api/community/posts', 'POST')
