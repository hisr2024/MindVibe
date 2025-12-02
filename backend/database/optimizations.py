"""Database Optimization Utilities for MindVibe.

This module provides comprehensive database optimization including:
- Connection pooling with proper sizing
- Query optimization utilities
- Indexing strategy helpers
- N+1 query prevention utilities
- Pagination helpers
"""

import logging
import time
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class ConnectionPoolConfig:
    """Configuration for database connection pool."""

    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 1800
    pool_pre_ping: bool = True
    echo: bool = False

    def to_engine_args(self) -> dict[str, Any]:
        """Convert to SQLAlchemy engine arguments."""
        return {
            "pool_size": self.pool_size,
            "max_overflow": self.max_overflow,
            "pool_timeout": self.pool_timeout,
            "pool_recycle": self.pool_recycle,
            "pool_pre_ping": self.pool_pre_ping,
            "echo": self.echo,
        }


@dataclass
class QueryStats:
    """Statistics for a database query."""

    query: str
    execution_time_ms: float
    rows_affected: int
    plan: str | None = None
    warnings: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)


@dataclass
class IndexRecommendation:
    """Recommendation for database index."""

    table: str
    columns: list[str]
    reason: str
    estimated_improvement: str
    create_statement: str


@dataclass
class PaginatedResult(Generic[T]):
    """Paginated query result."""

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class QueryAnalyzer:
    """Analyzes queries for performance issues."""

    # Patterns that may indicate performance issues
    PROBLEMATIC_PATTERNS = {
        "SELECT *": "Avoid SELECT *, specify only needed columns",
        "LIKE '%": "Leading wildcard prevents index usage",
        "OR ": "OR conditions may prevent index usage, consider UNION",
        "NOT IN": "NOT IN may be slow, consider NOT EXISTS or LEFT JOIN",
        "DISTINCT": "DISTINCT can be expensive, ensure it's necessary",
    }

    def analyze_query(self, query: str) -> list[str]:
        """Analyze a query for potential performance issues.

        Args:
            query: SQL query to analyze

        Returns:
            List of warnings/suggestions
        """
        warnings = []
        query_upper = query.upper()

        for pattern, suggestion in self.PROBLEMATIC_PATTERNS.items():
            if pattern in query_upper:
                warnings.append(f"{pattern}: {suggestion}")

        # Check for missing LIMIT
        if "SELECT" in query_upper and "LIMIT" not in query_upper:
            if "COUNT" not in query_upper and "INSERT" not in query_upper:
                warnings.append("Consider adding LIMIT to prevent large result sets")

        return warnings


class QueryOptimizer:
    """Provides query optimization utilities."""

    def __init__(self, session: AsyncSession | None = None):
        """Initialize query optimizer.

        Args:
            session: Optional database session
        """
        self.session = session
        self.analyzer = QueryAnalyzer()

    async def explain_query(self, query: str) -> str | None:
        """Get EXPLAIN ANALYZE output for a query.

        Args:
            query: SQL query to analyze

        Returns:
            Query plan or None if unavailable
        """
        if not self.session:
            return None

        try:
            result = await self.session.execute(text(f"EXPLAIN ANALYZE {query}"))
            rows = result.fetchall()
            return "\n".join(str(row[0]) for row in rows)
        except Exception as e:
            logger.error(f"Error explaining query: {e}")
            return None

    async def analyze_table(self, table_name: str) -> dict[str, Any]:
        """Analyze a table for optimization opportunities.

        Args:
            table_name: Name of the table to analyze

        Returns:
            Analysis results including row count, size, and recommendations
        """
        if not self.session:
            return {"error": "No session available"}

        results: dict[str, Any] = {"table": table_name}

        try:
            # Get row count
            count_result = await self.session.execute(
                text(f"SELECT COUNT(*) FROM {table_name}")
            )
            results["row_count"] = count_result.scalar()

            # Get table size (PostgreSQL specific)
            size_query = """
                SELECT pg_size_pretty(pg_total_relation_size(:table_name))
            """
            size_result = await self.session.execute(
                text(size_query), {"table_name": table_name}
            )
            results["size"] = size_result.scalar()

            # Get index information
            index_query = """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = :table_name
            """
            index_result = await self.session.execute(
                text(index_query), {"table_name": table_name}
            )
            results["indexes"] = [
                {"name": row[0], "definition": row[1]} for row in index_result.fetchall()
            ]

        except Exception as e:
            logger.error(f"Error analyzing table {table_name}: {e}")
            results["error"] = str(e)

        return results

    def recommend_indexes(
        self, table: str, query_patterns: list[str]
    ) -> list[IndexRecommendation]:
        """Recommend indexes based on query patterns.

        Args:
            table: Table name
            query_patterns: Common query patterns for the table

        Returns:
            List of index recommendations
        """
        recommendations = []

        for pattern in query_patterns:
            # Extract WHERE clause columns
            pattern_upper = pattern.upper()
            if "WHERE" in pattern_upper:
                # Simple extraction - in production use SQL parser
                where_part = pattern_upper.split("WHERE")[1]
                columns = []

                # Look for column = value patterns
                import re

                matches = re.findall(r"(\w+)\s*=", where_part)
                columns.extend(matches)

                # Look for column IN patterns
                matches = re.findall(r"(\w+)\s+IN", where_part)
                columns.extend(matches)

                if columns:
                    columns = [c.lower() for c in columns if c not in ("AND", "OR")]
                    if columns:
                        recommendations.append(
                            IndexRecommendation(
                                table=table,
                                columns=columns,
                                reason=f"Supports WHERE clause in: {pattern[:50]}...",
                                estimated_improvement="Medium",
                                create_statement=f"CREATE INDEX idx_{table}_{'_'.join(columns)} ON {table} ({', '.join(columns)})",
                            )
                        )

        return recommendations


class DatabaseOptimizer:
    """Main database optimizer coordinating all optimization utilities."""

    def __init__(self, database_url: str | None = None):
        """Initialize database optimizer.

        Args:
            database_url: Database connection URL
        """
        self.database_url = database_url
        self.query_analyzer = QueryAnalyzer()
        self._slow_query_log: list[QueryStats] = []
        self._slow_query_threshold_ms = 100

    def create_optimized_engine(
        self, url: str, config: ConnectionPoolConfig | None = None
    ) -> Any:
        """Create an optimized database engine.

        Args:
            url: Database URL
            config: Connection pool configuration

        Returns:
            Configured SQLAlchemy engine
        """
        config = config or ConnectionPoolConfig()
        return create_async_engine(url, **config.to_engine_args())

    def log_slow_query(self, stats: QueryStats) -> None:
        """Log a slow query for analysis.

        Args:
            stats: Query statistics
        """
        if stats.execution_time_ms > self._slow_query_threshold_ms:
            self._slow_query_log.append(stats)
            logger.warning(
                f"Slow query ({stats.execution_time_ms:.2f}ms): {stats.query[:100]}..."
            )

    def get_slow_queries(self, limit: int = 100) -> list[QueryStats]:
        """Get logged slow queries.

        Args:
            limit: Maximum number of queries to return

        Returns:
            List of slow query statistics
        """
        return sorted(
            self._slow_query_log, key=lambda x: x.execution_time_ms, reverse=True
        )[:limit]

    def clear_slow_query_log(self) -> None:
        """Clear the slow query log."""
        self._slow_query_log.clear()

    def set_slow_query_threshold(self, threshold_ms: float) -> None:
        """Set the slow query threshold.

        Args:
            threshold_ms: Threshold in milliseconds
        """
        self._slow_query_threshold_ms = threshold_ms


# Pagination utility
def paginate_query(
    items: Sequence[T],
    page: int = 1,
    page_size: int = 20,
    total: int | None = None,
) -> PaginatedResult[T]:
    """Paginate a query result.

    Args:
        items: Items to paginate (already sliced if from DB)
        page: Current page number (1-indexed)
        page_size: Items per page
        total: Total count (if known)

    Returns:
        Paginated result
    """
    page = max(1, page)
    page_size = min(max(1, page_size), 100)  # Cap at 100

    if total is None:
        total = len(items)

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedResult(
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


# N+1 prevention utilities
class QueryBatcher:
    """Utility to batch queries and prevent N+1 issues."""

    def __init__(self, session: AsyncSession, batch_size: int = 100):
        """Initialize query batcher.

        Args:
            session: Database session
            batch_size: Maximum batch size
        """
        self.session = session
        self.batch_size = batch_size

    async def batch_load(
        self, ids: list[Any], model: Any, id_column: str = "id"
    ) -> dict[Any, Any]:
        """Load multiple records in batches.

        Args:
            ids: List of IDs to load
            model: SQLAlchemy model class
            id_column: Name of the ID column

        Returns:
            Dictionary mapping ID to record
        """
        results = {}

        for i in range(0, len(ids), self.batch_size):
            batch_ids = ids[i : i + self.batch_size]
            id_col = getattr(model, id_column)

            query = await self.session.execute(
                model.__table__.select().where(id_col.in_(batch_ids))
            )
            for row in query.fetchall():
                results[getattr(row, id_column)] = row

        return results


# Singleton instance
_database_optimizer: DatabaseOptimizer | None = None


def get_database_optimizer() -> DatabaseOptimizer:
    """Get the singleton database optimizer instance."""
    global _database_optimizer
    if _database_optimizer is None:
        _database_optimizer = DatabaseOptimizer()
    return _database_optimizer


# Query timing decorator
def time_query(func):
    """Decorator to time and log slow queries."""

    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        elapsed_ms = (time.time() - start) * 1000

        optimizer = get_database_optimizer()
        stats = QueryStats(
            query=func.__name__,
            execution_time_ms=elapsed_ms,
            rows_affected=len(result) if hasattr(result, "__len__") else 0,
        )
        optimizer.log_slow_query(stats)

        return result

    return wrapper
