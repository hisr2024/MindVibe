# Performance Optimization

## Redis Caching
- 5 minute TTL for read endpoints
- Cache key format: `http_cache:{path}:{query}`

## Database Indexes
- Composite indexes on user_id + created_at
- Covering indexes for common queries
- Partial indexes for active data

## Query Optimization
- Materialized views for dashboard
- Optimized functions for trends
- Daily refresh via cron

## Metrics
- Average response time: -80%
- Cache hit rate target: >70%
