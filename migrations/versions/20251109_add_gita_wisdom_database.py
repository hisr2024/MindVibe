"""Add Bhagavad Gita wisdom database tables"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20251109_add_gita_wisdom_database"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gita_chapters",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("chapter_number", sa.Integer(), nullable=False),
        sa.Column("sanskrit_name", sa.String(length=256), nullable=False),
        sa.Column("english_name", sa.String(length=256), nullable=False),
        sa.Column("verse_count", sa.Integer(), nullable=False),
        sa.Column("themes", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("mental_health_relevance", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint("chapter_number", name="uq_gita_chapters_number"),
    )
    op.create_index("idx_gita_chapters_number", "gita_chapters", ["chapter_number"])

    op.create_table(
        "gita_sources",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=512), nullable=True),
        sa.Column("credibility_rating", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("name", name="uq_gita_sources_name"),
    )
    op.create_index("idx_gita_sources_name", "gita_sources", ["name"])

    op.create_table(
        "gita_verses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "chapter",
            sa.Integer(),
            sa.ForeignKey("gita_chapters.chapter_number", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("verse", sa.Integer(), nullable=False),
        sa.Column("sanskrit", sa.Text(), nullable=False),
        sa.Column("transliteration", sa.Text(), nullable=True),
        sa.Column("hindi", sa.Text(), nullable=False),
        sa.Column("english", sa.Text(), nullable=False),
        sa.Column("word_meanings", sa.JSON(), nullable=True),
        sa.Column("principle", sa.String(length=256), nullable=False),
        sa.Column("theme", sa.String(length=256), nullable=False),
        sa.Column(
            "source_id",
            sa.Integer(),
            sa.ForeignKey("gita_sources.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("embedding", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("idx_gita_verses_chapter", "gita_verses", ["chapter"])
    op.create_index("idx_gita_verses_verse", "gita_verses", ["verse"])
    op.create_index("idx_gita_verses_theme", "gita_verses", ["theme"])
    op.create_index("idx_gita_verses_source", "gita_verses", ["source_id"])
    op.create_index("idx_gita_verses_chapter_verse", "gita_verses", ["chapter", "verse"])

    op.create_table(
        "gita_modern_contexts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "verse_id",
            sa.Integer(),
            sa.ForeignKey("gita_verses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("application_area", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("examples", sa.JSON(), nullable=True),
        sa.Column("mental_health_benefits", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("idx_gita_modern_contexts_verse", "gita_modern_contexts", ["verse_id"])
    op.create_index(
        "idx_gita_modern_contexts_application", "gita_modern_contexts", ["application_area"]
    )

    op.create_table(
        "gita_keywords",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("keyword", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("keyword", name="uq_gita_keywords_keyword"),
    )
    op.create_index("idx_gita_keywords_keyword", "gita_keywords", ["keyword"])
    op.create_index("idx_gita_keywords_category", "gita_keywords", ["category"])

    op.create_table(
        "gita_verse_keywords",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "verse_id",
            sa.Integer(),
            sa.ForeignKey("gita_verses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "keyword_id",
            sa.Integer(),
            sa.ForeignKey("gita_keywords.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("verse_id", "keyword_id", name="uq_gita_verse_keywords"),
    )
    op.create_index("idx_gita_verse_keywords_verse", "gita_verse_keywords", ["verse_id"])
    op.create_index("idx_gita_verse_keywords_keyword", "gita_verse_keywords", ["keyword_id"])



def downgrade() -> None:
    op.drop_index("idx_gita_verse_keywords_keyword", table_name="gita_verse_keywords")
    op.drop_index("idx_gita_verse_keywords_verse", table_name="gita_verse_keywords")
    op.drop_table("gita_verse_keywords")

    op.drop_index("idx_gita_keywords_category", table_name="gita_keywords")
    op.drop_index("idx_gita_keywords_keyword", table_name="gita_keywords")
    op.drop_table("gita_keywords")

    op.drop_index("idx_gita_modern_contexts_application", table_name="gita_modern_contexts")
    op.drop_index("idx_gita_modern_contexts_verse", table_name="gita_modern_contexts")
    op.drop_table("gita_modern_contexts")

    op.drop_index("idx_gita_verses_chapter_verse", table_name="gita_verses")
    op.drop_index("idx_gita_verses_source", table_name="gita_verses")
    op.drop_index("idx_gita_verses_theme", table_name="gita_verses")
    op.drop_index("idx_gita_verses_verse", table_name="gita_verses")
    op.drop_index("idx_gita_verses_chapter", table_name="gita_verses")
    op.drop_table("gita_verses")

    op.drop_index("idx_gita_sources_name", table_name="gita_sources")
    op.drop_table("gita_sources")

    op.drop_index("idx_gita_chapters_number", table_name="gita_chapters")
    op.drop_table("gita_chapters")
