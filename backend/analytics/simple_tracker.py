"""Simple analytics tracker for MindVibe API."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)


class SimpleAnalytics:
    """Lightweight analytics tracker."""
    
    @staticmethod
    async def track_event(
        db: AsyncSession,
        event_type: str,
        user_id: str = None,
        metadata: dict = None
    ):
        """Track simple events without heavy overhead."""
        try:
            # Convert metadata to JSON string
            metadata_json = json.dumps(metadata) if metadata else None
            
            await db.execute(text("""
                INSERT INTO analytics_events (event_type, user_id, metadata, created_at)
                VALUES (:event_type, :user_id, CAST(:metadata AS JSONB), :created_at)
            """), {
                "event_type": event_type,
                "user_id": user_id,
                "metadata": metadata_json,
                "created_at": datetime.utcnow()
            })
            await db.commit()
        except Exception as e:
            logger.error(f"Analytics tracking failed: {e}")
            # Don't fail the request if analytics fails
            await db.rollback()
    
    @staticmethod
    async def get_daily_stats(db: AsyncSession, days: int = 7):
        """Get daily statistics."""
        # Calculate the cutoff date in Python to avoid SQL parameter issues
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(text("""
            SELECT 
                DATE(created_at) as date,
                event_type,
                COUNT(*) as count
            FROM analytics_events
            WHERE created_at >= :cutoff_date
            GROUP BY DATE(created_at), event_type
            ORDER BY date DESC
        """), {"cutoff_date": cutoff_date})
        
        return result.fetchall()
