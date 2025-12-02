-- Migration: Add Enterprise Admin System Tables
-- Date: 2025-12-03
-- Description: Creates tables for admin users, RBAC, audit logging, feature flags,
--              announcements, A/B testing, and content moderation.

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(256) UNIQUE NOT NULL,
    hashed_password VARCHAR(256) NOT NULL,
    full_name VARCHAR(256) NOT NULL,
    role VARCHAR(32) DEFAULT 'support' NOT NULL,
    mfa_secret VARCHAR(64),
    mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    mfa_backup_codes JSONB,
    ip_whitelist JSONB,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Admin Permission Assignments Table
CREATE TABLE IF NOT EXISTS admin_permission_assignments (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(255) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    permission VARCHAR(64) NOT NULL,
    granted BOOLEAN DEFAULT TRUE NOT NULL,
    granted_by VARCHAR(255) REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_permission_assignments_admin_id ON admin_permission_assignments(admin_id);

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(255) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- Admin Audit Logs Table (Immutable)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(255) REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON admin_audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    key VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    rollout_percentage INTEGER DEFAULT 100 NOT NULL,
    target_tiers JSONB,
    target_user_ids JSONB,
    created_by VARCHAR(255) REFERENCES admin_users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(32) DEFAULT 'banner' NOT NULL,
    target_tiers JSONB,
    target_user_ids JSONB,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by VARCHAR(255) REFERENCES admin_users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    variants JSONB NOT NULL,
    traffic_percentage INTEGER DEFAULT 100 NOT NULL,
    status VARCHAR(32) DEFAULT 'draft' NOT NULL,
    target_tiers JSONB,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255) REFERENCES admin_users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

-- A/B Test Assignments Table
CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    variant VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_id ON ab_test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);

-- A/B Test Conversions Table
CREATE TABLE IF NOT EXISTS ab_test_conversions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    variant VARCHAR(64) NOT NULL,
    event_name VARCHAR(128) NOT NULL,
    event_value NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_test_conversions_test_id ON ab_test_conversions(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_conversions_user_id ON ab_test_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_conversions_event_name ON ab_test_conversions(event_name);

-- Flagged Content Table
CREATE TABLE IF NOT EXISTS flagged_content (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(64) NOT NULL,
    content_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(256) NOT NULL,
    details TEXT,
    status VARCHAR(32) DEFAULT 'pending' NOT NULL,
    moderated_by VARCHAR(255) REFERENCES admin_users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_note TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flagged_content_content_type ON flagged_content(content_type);
CREATE INDEX IF NOT EXISTS idx_flagged_content_content_id ON flagged_content(content_id);
CREATE INDEX IF NOT EXISTS idx_flagged_content_user_id ON flagged_content(user_id);
CREATE INDEX IF NOT EXISTS idx_flagged_content_status ON flagged_content(status);

-- KIAAN Usage Analytics Table (Read-only aggregated data)
CREATE TABLE IF NOT EXISTS kiaan_usage_analytics (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_questions INTEGER DEFAULT 0 NOT NULL,
    unique_users INTEGER DEFAULT 0 NOT NULL,
    topic_distribution JSONB,
    questions_by_tier JSONB,
    avg_response_time_ms INTEGER,
    satisfaction_avg NUMERIC(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kiaan_usage_analytics_date ON kiaan_usage_analytics(date);
