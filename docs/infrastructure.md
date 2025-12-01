# Deployment & Infrastructure Guide

This repository now ships repeatable infrastructure as code for both local dockerized deployments and cloud object storage.

## Terraform layout
- `infra/terraform/main.tf`: Docker network, API container, and Postgres container for local deployments.
- `infra/terraform/s3.tf`: Optional AWS S3 buckets for encrypted journal archives and backup artifacts.
- `infra/terraform/variables.tf`: Common variables, including feature toggles for cloud resources.

### Applying the stack
```bash
cd infra/terraform
terraform init
terraform apply -var="enable_aws_resources=false"   # local containers only
terraform apply -var="enable_aws_resources=true" \
  -var="journal_bucket_name=mindvibe-journal-prod" \
  -var="backup_bucket_name=mindvibe-backups-prod"   # create S3 buckets too
```

Key variables:
- `enable_aws_resources`: gates creation of AWS resources to avoid accidental charges.
- `force_destroy_buckets`: enables bucket teardown in ephemeral environments.
- `journal_bucket_name`/`backup_bucket_name`: optional overrides to avoid name collisions.

## Object storage for encrypted journals
The API archives each journal entry to S3-compatible storage when `JOURNAL_STORAGE_BUCKET` is set. Data is encrypted with the in-app Fernet keys and stored under `JOURNAL_STORAGE_PREFIX` (default `journal-archives`). Server-side encryption is enforced by Terraform (`AES256`) to complement application-level encryption.

## Disaster recovery and backups
- Automated backups write to `reports/backups/` and, when `BACKUP_S3_BUCKET`/`BACKUP_S3_PREFIX` are set, mirror the artifact to the backup bucket with server-side encryption.
- `backend.services.backup.fetch_latest_remote_backup()` downloads the most recent backup for restore drills.
- Restores can be executed with `python - <<'PY'\nfrom pathlib import Path\nfrom backend.services.backup import restore_backup\nrestore_backup(Path('reports/backups/<artifact>.sql'))\nPY` after fetching the desired file.

## Secrets and credentials
Use environment variables instead of hardcoding:
- `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` for Terraform and runtime uploads.
- `JOURNAL_STORAGE_BUCKET`, `JOURNAL_STORAGE_ENDPOINT_URL` for journal archives (MinIO/Localstack supported via path-style addressing).
- `BACKUP_S3_BUCKET`, `BACKUP_S3_PREFIX` for database backups.
