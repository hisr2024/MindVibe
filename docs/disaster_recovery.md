# MindVibe Disaster Recovery Playbook

## Objectives
- Restore API availability within 30 minutes for regional incidents.
- Prevent data loss beyond 15 minutes of writes (RPO 15m) when backups are available.
- Document a single source of truth for runbooks and verification steps.

## Recovery Runbook
1. **Assess incident scope**
   - Check `/health` and `/metrics/performance` on the active environment.
   - Inspect background worker logs for `summary_generation_failed` or `backup_failed` events.
2. **Fail over the database**
   - Promote the most recent backup artifact from `reports/backups/` or the remote backup bucket to the target Postgres instance.
   - Use `python - <<'PY'
from pathlib import Path
from backend.services.backup import fetch_latest_remote_backup
print(fetch_latest_remote_backup(Path('reports/backups')))
PY` to pull the newest object from S3-compatible storage when configured.
   - Verify connectivity with `psql $DATABASE_URL -c "SELECT NOW();"`.
3. **Redeploy services**
   - Use Terraform to recreate containers: `cd infra/terraform && terraform init && terraform apply`.
   - Confirm application startup by watching for migration and router load messages in the API logs.
4. **Warm caches and indexes**
   - Hit `/api/insights/semantic-wisdom?q=calm` to rebuild semantic indexes in memory.
   - Trigger a health check loop by running a short load test (`make loadtest` or `locust` file).
5. **Validate user flows**
   - Create a test mood entry and fetch `/api/insights/mood-summary` to ensure analytics works.
   - Confirm chat endpoints respond and auth routes return 200s.

## Backup Automation
- Nightly backups run inside the FastAPI process via the `BackgroundOrchestrator` (configurable with `BACKUP_INTERVAL_SECONDS`).
- `ENABLE_AUTOMATED_BACKUPS=false` disables automated runs for sensitive environments.
- Backup artifacts default to `reports/backups/` and store a SQL dump when `pg_dump` and `DATABASE_URL` are available. Otherwise a manifest documents missing prerequisites.
- When `BACKUP_S3_BUCKET`/`BACKUP_S3_PREFIX` are configured the generated artifact is mirrored to S3 with server-side encryption; `fetch_latest_remote_backup()` retrieves the newest object for restores.

## Verification Checklist
- [ ] Latest backup artifact timestamped within RPO window.
- [ ] `terraform plan` shows no drift after recovery.
- [ ] `/metrics/performance` shows stable latencies under load test.
- [ ] Daily mood summary file `reports/daily_mood_summary.jsonl` updated within 24 hours.

## Communication
- Post incident summary and timeline to the engineering channel within 1 hour of resolution.
- File follow-up issues for any manual step that can be automated.
