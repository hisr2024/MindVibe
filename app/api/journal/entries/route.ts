import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/journal/entries', 'GET')
export const POST = createProxyHandler('/api/journal/entries', 'POST')
