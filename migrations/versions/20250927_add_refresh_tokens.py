"""Add refresh token table with indexes."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20250927_add_refresh_tokens"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "user_id", sa.String(length=64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "session_id",
            sa.String(length=64),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=256), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("rotated_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "parent_id",
            sa.String(length=64),
            sa.ForeignKey("refresh_tokens.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "reuse_detected",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("rotated_to_id", sa.String(length=64), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_refresh_tokens_token_hash"),
    )
    op.create_index(
        "ix_refresh_tokens_session_active",
        "refresh_tokens",
        ["session_id"],
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    op.create_index("ix_refresh_tokens_user", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_parent", "refresh_tokens", ["parent_id"])
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])
    op.create_index("ix_refresh_tokens_revoked_at", "refresh_tokens", ["revoked_at"])


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_revoked_at", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_expires_at", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_parent", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_session_active", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
