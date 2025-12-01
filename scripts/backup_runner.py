"""CLI helper to trigger MindVibe backups on demand."""
from __future__ import annotations

import argparse
from pathlib import Path

from backend.services.backup import run_backup


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a MindVibe backup")
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Override backup directory",
    )
    args = parser.parse_args()

    if args.output_dir:
        from backend.services import backup as backup_module

        backup_module.BACKUP_DIR = args.output_dir
        backup_module.BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    path = run_backup()
    print(f"Backup written to {path}")


if __name__ == "__main__":
    main()
