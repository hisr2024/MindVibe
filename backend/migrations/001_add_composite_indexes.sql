-- Migration: Add composite indexes for common query patterns
-- Date: 2026-02-06
-- Description: Adds composite and partial indexes to improve query performance
--   for the most common access patterns identified in the codebase.
--
-- To apply: psql -d mindvibe -f backend/migrations/001_add_composite_indexes.sql
-- To rollback: Run the DROP statements at the bottom of this file
--
-- Expected impact: 10-100x faster for paginated list endpoints,
--   reduced full table scans, better concurrent user support.

BEGIN;

-- ============================================================
-- HIGH PRIORITY: Authentication & Session Management
-- ============================================================

-- Soft-delete aware user lookups (used in every authenticated request)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_deleted_at
  ON users(id) WHERE deleted_at IS NULL;

-- Session lookup by user with recency ordering (auth.py, session_service.py)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id_created_at
  ON sessions(user_id, created_at DESC);

-- Refresh token lookup by session (token refresh flow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_session_id
  ON refresh_tokens(session_id) WHERE revoked_at IS NULL;

-- ============================================================
-- HIGH PRIORITY: Subscription Access Control
-- ============================================================

-- Subscription check on every feature-gated request
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_user_id_active
  ON user_subscriptions(user_id) WHERE deleted_at IS NULL;

-- Plan tier lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_tier_active
  ON subscription_plans(tier) WHERE is_active = true;

-- ============================================================
-- HIGH PRIORITY: Personal Journeys (user-facing pagination)
-- ============================================================

-- List journeys with status filter + pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personal_journeys_owner_status
  ON personal_journeys(owner_id, status, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Single journey lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personal_journeys_id_active
  ON personal_journeys(id) WHERE deleted_at IS NULL;

-- ============================================================
-- HIGH PRIORITY: Journal Entries (frequent user reads)
-- ============================================================

-- List entries with pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_user_updated
  ON journal_entries(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Journal blob lookup (latest per user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_blobs_user_created
  ON journal_blobs(user_id, created_at DESC);

-- ============================================================
-- MEDIUM PRIORITY: KIAAN Chat Messages
-- ============================================================

-- Chat history with pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kiaan_chat_messages_user_created
  ON kiaan_chat_messages(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Chat sessions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kiaan_chat_sessions_user_created
  ON kiaan_chat_sessions(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- MEDIUM PRIORITY: Gita Verse Lookups
-- ============================================================

-- Specific verse lookup by chapter + verse number
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gita_verses_chapter_verse
  ON gita_verses(chapter, verse);

-- ============================================================
-- MEDIUM PRIORITY: Journey Engine
-- ============================================================

-- User journey listing with template
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_journeys_user_active
  ON user_journeys(user_id, journey_template_id)
  WHERE deleted_at IS NULL;

-- Journey ownership validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_journeys_id_user
  ON user_journeys(id, user_id) WHERE deleted_at IS NULL;

-- Template lookup by slug
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journey_templates_slug_active
  ON journey_templates(slug) WHERE deleted_at IS NULL;

-- Step state by journey
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_journey_step_state_journey
  ON user_journey_step_state(user_journey_id, day_index)
  WHERE deleted_at IS NULL;

-- ============================================================
-- MEDIUM PRIORITY: Moods & Emotional Tracking
-- ============================================================

-- Mood history with pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moods_user_created
  ON moods(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Emotional logs by date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_emotional_logs_user_date
  ON user_emotional_logs(user_id, log_date DESC);

-- Daily analysis lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_daily_analysis_user_date
  ON user_daily_analysis(user_id, analysis_date DESC);

-- ============================================================
-- MEDIUM PRIORITY: Assessment & Bookmarks
-- ============================================================

-- Assessment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_assessments_user_created
  ON user_assessments(user_id, created_at DESC);

-- User verse bookmarks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_verse_bookmarks_user
  ON user_verses_bookmarked(user_id, created_at DESC);

-- ============================================================
-- LOWER PRIORITY: Admin & Audit
-- ============================================================

-- Audit log browsing (time-based)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_created
  ON admin_audit_logs(created_at DESC);

-- Audit log filtering by action + admin
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_action_admin
  ON admin_audit_logs(action, admin_id, created_at DESC);

-- Resource-specific audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_resource
  ON admin_audit_logs(resource_type, resource_id);

-- ============================================================
-- LOWER PRIORITY: Compliance
-- ============================================================

-- Cookie preferences per user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cookie_preferences_user
  ON cookie_preferences(user_id);

-- Compliance audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_audit_logs_user_created
  ON compliance_audit_logs(user_id, created_at DESC);

-- ============================================================
-- LOWER PRIORITY: Chat Rooms
-- ============================================================

-- Room participants lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_participants_user
  ON room_participants(user_id, chat_room_id);

-- Messages in a room
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room_created
  ON chat_messages(chat_room_id, created_at DESC);

COMMIT;

-- ============================================================
-- ROLLBACK (run manually if needed)
-- ============================================================
-- DROP INDEX CONCURRENTLY IF EXISTS idx_users_id_deleted_at;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_user_id_created_at;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_refresh_tokens_session_id;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_subscriptions_user_id_active;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_subscription_plans_tier_active;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_personal_journeys_owner_status;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_personal_journeys_id_active;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_journal_entries_user_updated;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_journal_blobs_user_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_kiaan_chat_messages_user_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_kiaan_chat_sessions_user_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_gita_verses_chapter_verse;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_journeys_user_active;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_journeys_id_user;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_journey_templates_slug_active;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_journey_step_state_journey;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_moods_user_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_emotional_logs_user_date;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_daily_analysis_user_date;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_assessments_user_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_user_verse_bookmarks_user;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_admin_audit_logs_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_admin_audit_logs_action_admin;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_admin_audit_logs_resource;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_cookie_preferences_user;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_compliance_audit_logs_user_created;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_room_participants_user;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_chat_messages_room_created;
