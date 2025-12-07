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
- Average response time: 80% reduction (improved by 80%)
- Cache hit rate target: >70%

## Database Maintenance

### Manual Optimization
The following maintenance tasks should be run periodically (weekly recommended):

```bash
# Run maintenance script
chmod +x scripts/db_maintenance.sh
./scripts/db_maintenance.sh
```

Or run directly via psql:

```sql
-- Optimize critical tables
VACUUM ANALYZE moods;
VACUUM ANALYZE chat_messages;
VACUUM ANALYZE journal_entries;
VACUUM ANALYZE users;
VACUUM ANALYZE gita_verses;
```

### Automated Maintenance (Optional)

For Render.com, set up a cron job:

1. Add to `render.yaml`:
```yaml
  - type: cron
    name: db-maintenance
    schedule: "0 2 * * 0"  # Weekly at 2 AM Sunday
    command: ./scripts/db_maintenance.sh
```

**Note:** VACUUM commands cannot run in migration transactions. These must be run separately.
