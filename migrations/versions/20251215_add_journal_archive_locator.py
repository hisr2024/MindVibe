"""Add archive locator to journal entries for object storage."""
from alembic import op
import sqlalchemy as sa

revision = "20251215_add_journal_archive_locator"
down_revision = "20251110_merge_refresh_and_gita"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "journal_entries",
        sa.Column("archive_locator", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("journal_entries", "archive_locator")
