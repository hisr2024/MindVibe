"""Merge refresh token and Gita heads"""

from __future__ import annotations

from alembic import op  # noqa: F401
import sqlalchemy as sa  # noqa: F401


revision = "20251110_merge_refresh_and_gita"
down_revision = ("20250927_add_refresh_tokens", "20251109_add_gita_wisdom_database")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
