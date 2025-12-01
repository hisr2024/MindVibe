"""Simple backup helper for database dumps and config snapshots."""
from __future__ import annotations

import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

BACKUP_DIR = Path(os.getenv("BACKUP_OUTPUT_DIR", "reports/backups"))
BACKUP_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL", "")


def run_backup() -> Path:
    """Run a pg_dump backup if available, otherwise write a placeholder manifest."""

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    backup_path = BACKUP_DIR / f"mindvibe_backup_{timestamp}.sql"
    manifest_path = BACKUP_DIR / f"mindvibe_backup_{timestamp}.json"

    if DATABASE_URL and _pg_dump_exists():
        with backup_path.open("wb") as handle:
            subprocess.run(["pg_dump", DATABASE_URL], check=True, stdout=handle)
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
    return manifest_path


def _pg_dump_exists() -> bool:
    return bool(shutil.which("pg_dump"))
