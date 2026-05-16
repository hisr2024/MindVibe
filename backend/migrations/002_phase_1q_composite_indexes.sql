-- Migration: Phase-1Q composite-index gap-fill
-- Date: 2026-05-16
-- Description: Adds composite indexes for tables the original
--   001_add_composite_indexes.sql migration did not cover. Each index
--   matches a specific hot-path query pattern documented inline below.
--
-- To apply: psql -d mindvibe -f backend/migrations/002_phase_1q_composite_indexes.sql
-- To rollback: Run the DROP statements at the bottom of this file
--
-- Why these eight tables specifically: the original migration covered
-- 24 tables. The 8 tables below were added to the schema later (in
-- 20260117..20260420 migration runs) and never received composite
-- coverage. The query patterns they support are all in scrubbed hot
-- code paths:
--   companion_memories         backend/routes/kiaan_voice_companion.py
--   companion_sessions         same + /m/companion screen feed
--   companion_messages         conversation history queries
--   journal_versions           version history pagination
--   wisdom_effectiveness       dynamic_wisdom_corpus learning loop
--   ab_test_assignments        admin AB-test analytics dashboard
--   ab_test_conversions        admin AB-test analytics dashboard
--
-- Performance expectation: each composite turns a (user_id index
-- scan + sort) into a single index range scan. P95 improvement
-- 5-20x depending on row count.

BEGIN;

-- ============================================================
-- CompanionMemory — the just-fixed N+1 in _save_memories()
-- ============================================================

-- Lookup pattern: WHERE user_id=? AND memory_type=? AND key=? AND deleted_at IS NULL
-- After Phase-1Q this is the hot path used by every voice-companion turn.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_memories_lookup
  ON companion_memories(user_id, memory_type, key)
  WHERE deleted_at IS NULL;

-- Recency-ordered list (used by /api/companion/memories listing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_memories_recent
  ON companion_memories(user_id, last_referenced_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- CompanionSession — recent-sessions feed + active-session check
-- ============================================================

-- Recent-sessions feed (Voice Companion home + summaries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_sessions_recent
  ON companion_sessions(user_id, started_at DESC)
  WHERE deleted_at IS NULL;

-- "Is there an active session?" check (used on every WSS connect)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_sessions_active
  ON companion_sessions(user_id)
  WHERE is_active = true AND deleted_at IS NULL;

-- ============================================================
-- CompanionMessage — session message history pagination
-- ============================================================

-- All messages in a session, newest first (chat-history scroll)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_messages_session_time
  ON companion_messages(session_id, created_at DESC);

-- ============================================================
-- JournalVersion — version history of a journal entry
-- ============================================================

-- Lookup: SELECT * FROM journal_versions WHERE entry_id=? ORDER BY version_number DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_versions_entry_version
  ON journal_versions(entry_id, version_number DESC);

-- ============================================================
-- WisdomEffectiveness — dynamic-wisdom learning-loop reads
-- ============================================================

-- For ranking verses per user mood (the effectiveness-score path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wisdom_effectiveness_user_verse
  ON wisdom_effectiveness(user_id, verse_ref);

-- For computing global verse effectiveness (across-users analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wisdom_effectiveness_verse_mood
  ON wisdom_effectiveness(verse_ref, source_mood);

-- ============================================================
-- ABTestAssignment + ABTestConversion — admin analytics GROUP BYs
-- ============================================================

-- The just-optimized variant-aggregation query in admin/ab_tests.py
-- does `WHERE test_id=? GROUP BY variant` — needs this composite for
-- a covering index scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ab_test_assignments_test_variant
  ON ab_test_assignments(test_id, variant);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ab_test_conversions_test_variant
  ON ab_test_conversions(test_id, variant);

-- ============================================================
-- Sanity probe — run these AFTER applying to confirm Postgres
-- picked up the new indexes.
-- ============================================================
--
-- EXPLAIN ANALYZE
-- SELECT * FROM companion_memories
-- WHERE user_id='<sample>' AND memory_type='preference' AND key='persona'
--   AND deleted_at IS NULL;
--
-- Expected: "Index Scan using idx_companion_memories_lookup"
-- Not expected: "Seq Scan on companion_memories"

COMMIT;

-- ============================================================
-- ROLLBACK
-- ============================================================
--
-- BEGIN;
-- DROP INDEX IF EXISTS idx_companion_memories_lookup;
-- DROP INDEX IF EXISTS idx_companion_memories_recent;
-- DROP INDEX IF EXISTS idx_companion_sessions_recent;
-- DROP INDEX IF EXISTS idx_companion_sessions_active;
-- DROP INDEX IF EXISTS idx_companion_messages_session_time;
-- DROP INDEX IF EXISTS idx_journal_versions_entry_version;
-- DROP INDEX IF EXISTS idx_wisdom_effectiveness_user_verse;
-- DROP INDEX IF EXISTS idx_wisdom_effectiveness_verse_mood;
-- DROP INDEX IF EXISTS idx_ab_test_assignments_test_variant;
-- DROP INDEX IF EXISTS idx_ab_test_conversions_test_variant;
-- COMMIT;
