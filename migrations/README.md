# Migration Files Guidelines

## ⚠️ Important Rules

1. **No SQL Comments**: Do not use `--` comments in migration files
   - The migration parser treats them as statements
   - Use this README for documentation instead

2. **One Statement Per Line**: Each SQL statement should be clear and separate

3. **Always Use IF NOT EXISTS**: Migrations should be idempotent
   ```sql
   CREATE TABLE IF NOT EXISTS table_name (...);
   CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);
   ```

4. **No VACUUM in Migrations**: VACUUM cannot run in transactions
   - Use `scripts/db_maintenance.sh` for VACUUM operations

## Migration Files

### Phase 1: Mobile BFF
- (No database changes - API layer only)

### Phase 2: Real-Time WebSocket
- `add_mobile_tables.sql` - Device tokens, sync queue, events
- `add_realtime_triggers.sql` - PostgreSQL NOTIFY triggers

### Phase 3: Analytics
- `add_analytics_views.sql` - Materialized views for analytics
- `add_query_optimizations.sql` - Optimized functions and views

### Phase 4: Social Features
- `add_social_tables.sql` - User connections, groups, wisdom sharing

### Phase 5: Performance
- `add_performance_indexes.sql` - Database indexes only

## Safety Notes

All new tables use foreign keys that REFERENCE existing tables:
- `REFERENCES users(id)` - Read-only access to users
- `REFERENCES gita_verses(id)` - Read-only access to verses
- `ON DELETE CASCADE` - Only affects new tables when user deleted

**ZERO impact on KIAAN core tables.**
