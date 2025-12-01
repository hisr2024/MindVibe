# MindVibe Encryption Architecture & Key Rotation Policy

## Overview
MindVibe secures data in motion and at rest using a layered cryptographic approach rooted in modern standards (AES-256-GCM for bulk encryption, EdDSA for signatures, TLS 1.3 for transport). This document provides engineering guidance for configuring keys, performing rotations, and auditing the system.

## Components
- **Application secrets**: FastAPI secrets (JWT signing, webhook secrets) stored in environment variables or a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager).
- **Database encryption**: Sensitive columns encrypted using application-level encryption before storage. PostgreSQL encryption at rest (disk-level) is assumed.
- **File storage**: Any persisted files should be encrypted with per-object AES-256-GCM keys derived from a master key.
- **Webhook integrity**: Webhook signatures validated using HMAC-SHA256 with a dedicated signing secret.
- **Observability**: Telemetry exporters are configured without PII; redact secrets before exporting traces.

## Key Management Principles
- **Least privilege**: Keys are scoped to a single purpose (JWT signing, webhook verification, cache/queue auth tokens).
- **Non-reuse**: Never reuse signing keys for encryption. Distinct secrets are required per service.
- **Separation of duties**: Only trusted automation (CI/CD or platform KMS) can rotate keys; application code reads from environment or mounted secret files.
- **Auditability**: Every rotation is recorded with timestamp, initiating actor, and affected key IDs.

## Rotation Policy
1. **Inventory keys**: Track `SECRET_KEY`, `WEBHOOK_SIGNING_SECRET`, `REDIS_URL` auth token (if used), and any encryption master keys in a registry managed by Ops.
2. **Prepare new keys**:
   - Generate new AES-256-GCM master key via KMS or `openssl rand -hex 32` for non-production prototypes.
   - Issue a new webhook signing secret; version them as `webhook-vN` to support phased rollout.
   - Create new JWT signing secret and refresh token salt.
3. **Dual-publish**:
   - Store new keys in the secrets manager under a new version.
   - Update deployment manifests to surface both current (`vN`) and next (`vN+1`) secrets to the application as environment variables.
4. **Hot-reload application**:
   - Redeploy services so that configuration picks up the new secrets.
   - For webhook signatures, accept both `vN` and `vN+1` during the overlap window to avoid dropped events.
5. **Cutover & revoke**:
   - Switch verification to `vN+1` only after downstream systems have rotated their signers.
   - Invalidate `vN` in the secrets manager, revoke any dependent tokens (Redis, Celery), and restart pods/tasks.
6. **Data re-encryption cadence**:
   - For long-lived data, schedule quarterly re-encryption of encrypted columns and stored objects using the newest master key.
   - Rotate JWT signing keys monthly; webhook secrets quarterly or on compromise.
7. **Incident response**:
   - If compromise is suspected, immediately revoke affected keys, force logout sessions by rotating JWT secrets, clear caches, and regenerate signing secrets.

## Operational Checklist
- [ ] All secrets sourced from environment or mounted files; no secrets in git.
- [ ] `WEBHOOK_SIGNING_SECRET` configured and rotated using the above policy.
- [ ] Redis and Celery credentials stored in `REDIS_URL`/`CELERY_BROKER_URL` without hardcoding.
- [ ] Backups encrypted with a separate backup key; restore procedures verify integrity before use.
- [ ] Logs and traces scrub PII before export to Sentry/OTel.

## Key Storage Options
- **Managed KMS**: Prefer cloud KMS (AWS KMS, GCP KMS, Azure Key Vault). Bind access to service identities.
- **Hardware-backed**: For enterprise tiers, store master keys in HSM-backed KMS and enforce MFA for manual operations.
- **Local development**: `.env` file with throwaway keys; never reused in production.

## References
- NIST SP 800-57 for key management guidance.
- OWASP Cryptographic Storage Cheat Sheet.
- Cloud provider KMS best practices for rotation automation.
