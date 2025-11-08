# Add at the top with other imports
from sqlalchemy import Column, DateTime
import datetime

# Add this field to your base model class
deleted_at = Column(DateTime, nullable=True)


# Add these methods to your base model class
def soft_delete(self):
    self.deleted_at = datetime.datetime.utcnow()


def restore(self):
    self.deleted_at = None
