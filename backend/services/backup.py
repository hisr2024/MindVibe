"""Backup and restore helpers for database dumps and config snapshots."""
from __future__ import annotations

import logging
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional

from backend.services.object_storage import ObjectStorageClient, StorageConfig

logger = logging.getLogger("mindvibe.backup")

BACKUP_DIR = Path(os.getenv("BACKUP_OUTPUT_DIR", "reports/backups"))
BACKUP_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL", "")

BACKUP_STORAGE_CONFIG = StorageConfig.from_env(
    bucket_env="BACKUP_S3_BUCKET",
    prefix_env="BACKUP_S3_PREFIX",
    default_prefix="db-backups",
)
STORAGE_CLIENT = ObjectStorageClient(BACKUP_STORAGE_CONFIG)


def run_backup() -> Path:
    """Run a pg_dump backup and mirror it to object storage when configured."""

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    backup_path = BACKUP_DIR / f"mindvibe_backup_{timestamp}.sql"
    manifest_path = BACKUP_DIR / f"mindvibe_backup_{timestamp}.json"

    if DATABASE_URL and _pg_dump_exists():
        with backup_path.open("wb") as handle:
            subprocess.run(["pg_dump", DATABASE_URL], check=True, stdout=handle)
        _upload_backup(backup_path)
        return backup_path

    manifest_path.write_text(
        (
            "{\n"
            f'  "note": "pg_dump not available or DATABASE_URL missing",\n'
            f'  "created_at": "{timestamp}",\n'
            f'  "database_url_present": {bool(DATABASE_URL)}\n'
            "}\n"
        ),
        encoding="utf-8",
    )
    _upload_backup(manifest_path)
    return manifest_path


def restore_backup(artifact_path: Path) -> None:
    """Restore a backup file into the configured database."""

    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is required for restore operations")
    if not artifact_path.exists():
        raise FileNotFoundError(artifact_path)
    subprocess.run(["psql", DATABASE_URL, "-f", str(artifact_path)], check=True)


def fetch_latest_remote_backup(destination_dir: Path | None = None) -> Optional[Path]:
    """Download the most recent backup object from remote storage if available."""

    if not STORAGE_CLIENT.enabled:
        logger.info("remote_backup_disabled")
        return None
    objects = STORAGE_CLIENT.list_objects()
    if not objects:
        return None
    # Entries are returned with LastModified datetime; safeguard against missing keys.
    ordered = sorted(
        [obj for obj in objects if obj.get("Key")],
        key=lambda obj: obj.get("LastModified") or datetime.min,
    )
    if not ordered:
        return None
    latest = ordered[-1]
    return STORAGE_CLIENT.download_object(latest["Key"], destination_dir or BACKUP_DIR)


def _upload_backup(path: Path) -> None:
    if not STORAGE_CLIENT.enabled:
        return
    content_type = "application/sql" if path.suffix == ".sql" else "application/json"
    key = f"{BACKUP_STORAGE_CONFIG.prefix}/{path.name}"
    result = STORAGE_CLIENT.upload_file(
        path,
        key,
        content_type=content_type,
        metadata={"artifact": "database_backup"},
    )
    if result:
        logger.info("backup_uploaded", extra={"uri": result.uri})


def _pg_dump_exists() -> bool:
    return bool(shutil.which("pg_dump"))
