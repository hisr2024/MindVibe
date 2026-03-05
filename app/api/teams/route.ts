import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/teams', 'GET')
export const POST = createProxyHandler('/api/teams', 'POST')
