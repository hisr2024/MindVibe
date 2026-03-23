-- Backfill: ensure all users created before the email verification feature
-- (introduced 2026-03-10) are marked as verified. These users proved email
-- ownership through earlier signup flows that did not require verification.
--
-- This migration is idempotent and safe to re-run.
-- It does NOT affect users who signed up after the feature was introduced
-- (they must verify via the normal email verification flow).

UPDATE users
SET email_verified = TRUE,
    email_verified_at = COALESCE(email_verified_at, NOW())
WHERE email_verified = FALSE
  AND deleted_at IS NULL
  AND created_at < '2026-03-10T00:00:00Z';
