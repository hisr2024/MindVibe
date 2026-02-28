import { createProxyHandler } from '@/lib/proxy-utils'
export const GET = createProxyHandler('/api/analytics/kiaan-insights', 'GET')
