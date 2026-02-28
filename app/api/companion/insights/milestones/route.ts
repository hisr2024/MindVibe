import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/companion/insights/milestones', 'GET')
