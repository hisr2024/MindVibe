"""Simple analytics tracker for MindVibe API."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)


class SimpleAnalytics:
    """Lightweight analytics tracker."""
    
    @staticmethod
    async def track_event(
        db: AsyncSession,
        event_type: str,
        user_id: int = None,
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
        result = await db.execute(text("""
            SELECT 
                DATE(created_at) as date,
                event_type,
                COUNT(*) as count
            FROM analytics_events
            WHERE created_at >= NOW() - INTERVAL ':days days'
            GROUP BY DATE(created_at), event_type
            ORDER BY date DESC
        """), {"days": days})
        
        return result.fetchall()
