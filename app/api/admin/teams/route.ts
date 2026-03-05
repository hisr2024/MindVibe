import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/admin/teams', 'GET')
