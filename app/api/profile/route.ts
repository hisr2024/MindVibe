import { createProxyHandler } from '@/lib/proxy-utils'

export const GET = createProxyHandler('/api/profile', 'GET')
export const PUT = createProxyHandler('/api/profile', 'PUT')
export const PATCH = createProxyHandler('/api/profile', 'PATCH')
