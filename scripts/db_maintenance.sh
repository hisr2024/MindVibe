#!/usr/bin/env bash
# Database Maintenance Script
# Run this manually or via cron for database optimization

echo "Running database maintenance..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    exit 1
fi

# Run VACUUM ANALYZE on critical tables
psql "$DATABASE_URL" <<EOF
VACUUM ANALYZE moods;
VACUUM ANALYZE chat_messages;
VACUUM ANALYZE journal_entries;
VACUUM ANALYZE users;
VACUUM ANALYZE gita_verses;
EOF

echo "✅ Database maintenance complete"
