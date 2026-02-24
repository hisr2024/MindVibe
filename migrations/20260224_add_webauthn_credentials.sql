-- WebAuthn (FIDO2) biometric authentication credentials table
-- Stores public keys for fingerprint / Face ID / device PIN authentication
-- Soft-deletable for audit trail compliance

CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id              VARCHAR(64) PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id   TEXT NOT NULL UNIQUE,
    public_key      BYTEA NOT NULL,
    sign_count      INTEGER NOT NULL DEFAULT 0,
    attestation_format VARCHAR(32) NOT NULL DEFAULT 'none',
    transports      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id
    ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id
    ON webauthn_credentials(credential_id);
