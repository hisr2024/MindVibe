-- Migration: Add compliance and GDPR tables
-- Created: 2025-12-02
-- Purpose: HIPAA/GDPR compliance with user consent, data export, and deletion tracking

-- User consent tracking for GDPR compliance
CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(64) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    version VARCHAR(32) NOT NULL DEFAULT '1.0',
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    granted_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Ensure the consent_type column exists for legacy deployments where the table may
-- have been created without it. This prevents index creation from failing when the
-- column is missing (see Render migration error f405/UndefinedColumnError).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_consents'
          AND column_name = 'consent_type'
    ) THEN
        ALTER TABLE user_consents ADD COLUMN consent_type VARCHAR(64);
        -- Default existing rows to privacy_policy to satisfy NOT NULL
        UPDATE user_consents SET consent_type = 'privacy_policy'
        WHERE consent_type IS NULL;
        ALTER TABLE user_consents ALTER COLUMN consent_type SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consents_unique ON user_consents(user_id, consent_type);

-- Cookie preferences for GDPR/ePrivacy compliance
CREATE TABLE IF NOT EXISTS cookie_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    anonymous_id VARCHAR(64),
    necessary BOOLEAN NOT NULL DEFAULT TRUE,
    analytics BOOLEAN NOT NULL DEFAULT FALSE,
    marketing BOOLEAN NOT NULL DEFAULT FALSE,
    functional BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cookie_preferences_user_id ON cookie_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_preferences_anonymous_id ON cookie_preferences(anonymous_id);

-- Data export requests for GDPR Right to Access/Portability
CREATE TABLE IF NOT EXISTS data_export_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    format VARCHAR(16) NOT NULL DEFAULT 'json',
    download_token VARCHAR(128) UNIQUE,
    download_url VARCHAR(512),
    file_path VARCHAR(512),
    file_size_bytes INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_token ON data_export_requests(download_token);

-- Deletion requests for GDPR Right to Erasure
CREATE TABLE IF NOT EXISTS deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    reason TEXT,
    grace_period_days INTEGER NOT NULL DEFAULT 30,
    grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);

-- Compliance audit log for tracking compliance-related actions
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    severity VARCHAR(16) NOT NULL DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_user_id ON compliance_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_action ON compliance_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_created_at ON compliance_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_severity ON compliance_audit_logs(severity);

-- Comments for documentation
COMMENT ON TABLE user_consents IS 'GDPR Article 7 - Tracks user consent preferences';
COMMENT ON TABLE cookie_preferences IS 'GDPR/ePrivacy - Tracks cookie consent preferences';
COMMENT ON TABLE data_export_requests IS 'GDPR Articles 15 & 20 - Data export requests';
COMMENT ON TABLE deletion_requests IS 'GDPR Article 17 - Right to Erasure requests';
COMMENT ON TABLE compliance_audit_logs IS 'Audit trail for all compliance-related actions';
