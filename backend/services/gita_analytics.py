"""
Gita Analytics Service.

Tracks and analyzes Gita verse usage patterns to ensure comprehensive coverage
of all 700 verses and provide insights for continuous improvement.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict, Counter

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import GitaVerse

logger = logging.getLogger(__name__)


class GitaAnalyticsService:
    """Service for tracking and analyzing Gita verse usage."""
    
    # In-memory cache for verse usage (in production, use Redis or database)
    _verse_usage: Dict[str, List[datetime]] = defaultdict(list)
    _theme_usage: Counter = Counter()
    _validation_stats: Dict[str, int] = defaultdict(int)
    
    @classmethod
    def track_verse_usage(cls, verse_id: str, theme: Optional[str] = None) -> None:
        """
        Track that a verse was used in a response.
        
        Args:
            verse_id: The verse ID (e.g., "2.47")
            theme: Optional theme of the verse
        """
        cls._verse_usage[verse_id].append(datetime.utcnow())
        
        if theme:
            cls._theme_usage[theme] += 1
        
        logger.debug(f"📊 Tracked verse usage: {verse_id} (theme: {theme})")
    
    @classmethod
    def track_validation_result(cls, is_valid: bool, reason: Optional[str] = None) -> None:
        """
        Track validation results for analytics.
        
        Args:
            is_valid: Whether validation passed
            reason: Optional reason for failure
        """
        if is_valid:
            cls._validation_stats["passed"] += 1
        else:
            cls._validation_stats["failed"] += 1
            if reason:
                cls._validation_stats[f"failed_reason:{reason}"] += 1
        
        cls._validation_stats["total"] += 1
    
    @classmethod
    def get_most_used_verses(cls, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get the most frequently used verses.
        
        Args:
            limit: Maximum number of verses to return
            
        Returns:
            List of dicts with verse_id and usage_count
        """
        verse_counts = {
            verse_id: len(timestamps) 
            for verse_id, timestamps in cls._verse_usage.items()
        }
        
        sorted_verses = sorted(
            verse_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return [
            {"verse_id": verse_id, "usage_count": count}
            for verse_id, count in sorted_verses[:limit]
        ]
    
    @classmethod
    def get_theme_usage_stats(cls) -> Dict[str, int]:
        """
        Get theme usage statistics.
        
        Returns:
            Dict mapping theme names to usage counts
        """
        return dict(cls._theme_usage)
    
    @classmethod
    def get_validation_stats(cls) -> Dict[str, Any]:
        """
        Get validation statistics.
        
        Returns:
            Dict with validation pass/fail rates and reasons
        """
        total = cls._validation_stats.get("total", 0)
        passed = cls._validation_stats.get("passed", 0)
        failed = cls._validation_stats.get("failed", 0)
        
        pass_rate = (passed / total * 100) if total > 0 else 0.0
        
        # Get failure reasons
        failure_reasons = {
            key.replace("failed_reason:", ""): count
            for key, count in cls._validation_stats.items()
            if key.startswith("failed_reason:")
        }
        
        return {
            "total_validations": total,
            "passed": passed,
            "failed": failed,
            "pass_rate_percent": round(pass_rate, 2),
            "failure_reasons": failure_reasons
        }
    
    @classmethod
    async def calculate_verse_coverage(cls, db: AsyncSession) -> Dict[str, Any]:
        """
        Calculate what percentage of the 700 verses have been used.
        
        Args:
            db: Database session
            
        Returns:
            Dict with coverage statistics
        """
        # Get total verses in database
        result = await db.execute(select(func.count(GitaVerse.id)))
        total_verses = result.scalar() or 0
        
        # Count unique verses used
        unique_verses_used = len(cls._verse_usage)
        
        coverage_percent = (
            (unique_verses_used / total_verses * 100) if total_verses > 0 else 0.0
        )
        
        return {
            "total_verses_in_db": total_verses,
            "unique_verses_used": unique_verses_used,
            "coverage_percent": round(coverage_percent, 2),
            "expected_total": 700,
            "is_complete_db": total_verses >= 700
        }
    
    @classmethod
    def get_verse_usage_frequency(
        cls, 
        verse_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get usage frequency for a specific verse.
        
        Args:
            verse_id: The verse ID
            days: Number of days to analyze
            
        Returns:
            Dict with usage frequency statistics
        """
        if verse_id not in cls._verse_usage:
            return {
                "verse_id": verse_id,
                "total_uses": 0,
                "recent_uses": 0,
                "last_used": None
            }
        
        timestamps = cls._verse_usage[verse_id]
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        recent_uses = sum(1 for ts in timestamps if ts >= cutoff_date)
        last_used = max(timestamps) if timestamps else None
        
        return {
            "verse_id": verse_id,
            "total_uses": len(timestamps),
            "recent_uses": recent_uses,
            "last_used": last_used.isoformat() if last_used else None,
            "days_analyzed": days
        }
    
    @classmethod
    async def get_underutilized_verses(
        cls, 
        db: AsyncSession,
        min_usage: int = 1
    ) -> List[str]:
        """
        Get verses that are underutilized.
        
        Args:
            db: Database session
            min_usage: Minimum usage count (verses below this are underutilized)
            
        Returns:
            List of verse IDs that are underutilized
        """
        # Get all verses from database
        result = await db.execute(
            select(GitaVerse.chapter, GitaVerse.verse)
        )
        all_verses = result.all()
        
        underutilized = []
        for chapter, verse_num in all_verses:
            verse_id = f"{chapter}.{verse_num}"
            usage_count = len(cls._verse_usage.get(verse_id, []))
            
            if usage_count < min_usage:
                underutilized.append(verse_id)
        
        return underutilized
    
    @classmethod
    async def generate_analytics_report(
        cls, 
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive analytics report.
        
        Args:
            db: Database session
            
        Returns:
            Dict with comprehensive analytics
        """
        coverage = await cls.calculate_verse_coverage(db)
        validation_stats = cls.get_validation_stats()
        most_used = cls.get_most_used_verses(limit=10)
        theme_stats = cls.get_theme_usage_stats()
        underutilized = await cls.get_underutilized_verses(db, min_usage=1)
        
        # Calculate theme diversity
        total_theme_uses = sum(theme_stats.values())
        theme_diversity = len(theme_stats)
        
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "verse_coverage": coverage,
            "validation_statistics": validation_stats,
            "most_used_verses": most_used,
            "theme_statistics": {
                "total_themes_used": theme_diversity,
                "total_theme_applications": total_theme_uses,
                "theme_breakdown": theme_stats
            },
            "underutilized_verses": {
                "count": len(underutilized),
                "verse_ids": underutilized[:20]  # First 20 only
            },
            "recommendations": cls._generate_recommendations(
                coverage, validation_stats, theme_diversity
            )
        }
    
    @classmethod
    def _generate_recommendations(
        cls,
        coverage: Dict[str, Any],
        validation_stats: Dict[str, Any],
        theme_diversity: int
    ) -> List[str]:
        """
        Generate recommendations based on analytics.
        
        Args:
            coverage: Coverage statistics
            validation_stats: Validation statistics
            theme_diversity: Number of unique themes used
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Coverage recommendations
        coverage_pct = coverage.get("coverage_percent", 0)
        if coverage_pct < 25:
            recommendations.append(
                "⚠️ Low verse coverage (<25%). Consider improving search diversity."
            )
        elif coverage_pct < 50:
            recommendations.append(
                "📊 Moderate coverage. Continue diversifying verse selection."
            )
        else:
            recommendations.append(
                "✅ Good verse coverage (>50%). Maintain diverse selection."
            )
        
        # Validation recommendations
        pass_rate = validation_stats.get("pass_rate_percent", 0)
        if pass_rate < 80:
            recommendations.append(
                f"⚠️ Validation pass rate is {pass_rate}%. Review system prompt and validation rules."
            )
        elif pass_rate < 95:
            recommendations.append(
                f"📊 Validation pass rate is {pass_rate}%. Consider minor improvements."
            )
        else:
            recommendations.append(
                f"✅ Excellent validation pass rate ({pass_rate}%)."
            )
        
        # Theme diversity recommendations
        if theme_diversity < 10:
            recommendations.append(
                "⚠️ Low theme diversity. Enhance emotion-to-theme mapping."
            )
        elif theme_diversity < 20:
            recommendations.append(
                "📊 Moderate theme diversity. Continue expanding coverage."
            )
        else:
            recommendations.append(
                "✅ Good theme diversity across multiple topics."
            )
        
        return recommendations
    
    @classmethod
    def reset_analytics(cls, confirm: bool = False) -> None:
        """
        Reset all analytics data.
        
        Args:
            confirm: Must be True to actually reset
        """
        if not confirm:
            logger.warning("Reset analytics called without confirmation")
            return
        
        cls._verse_usage.clear()
        cls._theme_usage.clear()
        cls._validation_stats.clear()
        
        logger.info("📊 Analytics data reset successfully")
