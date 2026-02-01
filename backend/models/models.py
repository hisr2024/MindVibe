"""
Additional model utilities for MindVibe backend.

NOTE: Main models are defined in backend/models.py
This file contains utility documentation and examples.

SOFT DELETE PATTERN
-------------------
All user-facing models should use the SoftDeleteMixin from backend/models.py:

    from backend.models import Base, SoftDeleteMixin

    class MyModel(SoftDeleteMixin, Base):
        __tablename__ = "my_table"
        ...

The SoftDeleteMixin provides:
- deleted_at: Timestamp field that is None for active records
- soft_delete(): Method to mark record as deleted
- restore(): Method to restore a soft-deleted record
- not_deleted(): Class method to filter out deleted records from queries

Usage in queries:

    # Get only non-deleted records
    stmt = select(MyModel).where(MyModel.deleted_at.is_(None))

    # Or use the class method
    stmt = MyModel.not_deleted(select(MyModel))

See backend/models.py for the full SoftDeleteMixin implementation.
"""

# This file is intentionally mostly documentation.
# Main model definitions are in backend/models.py
