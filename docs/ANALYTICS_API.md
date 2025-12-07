# Analytics API Documentation

## Overview

The Analytics API provides read-only access to aggregated user data for mood trends, usage statistics, and AI-powered insights. All endpoints use READ-ONLY queries to existing tables with no data modifications.

## Endpoints

### GET /analytics/health

Health check endpoint for the analytics service.

**Response:**
```json
{
  "status": "healthy",
  "service": "analytics",
  "timestamp": "2025-12-07T13:36:25.143Z"
}
```

### GET /analytics/v1/mood-trends

Get mood trends over time (read-only query to moods table).

**Query Parameters:**
- `user_id` (required, string) - The user ID to get mood trends for
- `days` (optional, integer, default: 30) - Number of days to look back

**Response:**
```json
{
  "trends": [
    {
      "date": "2025-12-07",
      "avg_mood": 7.5,
      "entries": 3,
      "volatility": 1.2
    }
  ],
  "period_days": 30
}
```

**Fields:**
- `date` - The date for the aggregated data
- `avg_mood` - Average mood score for that day
- `entries` - Number of mood entries recorded
- `volatility` - Standard deviation of mood scores (measure of mood stability)

### GET /analytics/v1/usage-stats

Aggregate usage statistics (read-only).

**Query Parameters:**
- `user_id` (required, string) - The user ID to get statistics for

**Response:**
```json
{
  "user_id": "user123",
  "statistics": {
    "total_moods": 45,
    "total_journals": 12,
    "total_chats": 89,
    "streak_days": 15
  },
  "generated_at": "2025-12-07T13:36:25.143Z"
}
```

**Statistics Fields:**
- `total_moods` - Total number of mood entries
- `total_journals` - Total number of journal entries
- `total_chats` - Total number of chat messages
- `streak_days` - Number of unique days with mood entries in the last 30 days

### GET /analytics/v1/insights

AI-generated insights from user patterns.

**Query Parameters:**
- `user_id` (required, string) - The user ID to get insights for

**Response:**
```json
{
  "insights": [
    {
      "type": "mood_low",
      "message": "Your mood has been lower than usual this week. Consider talking to KIAAN.",
      "severity": "medium"
    },
    {
      "type": "journaling",
      "message": "Try journaling more regularly. It helps process emotions.",
      "severity": "low"
    }
  ],
  "generated_at": "2025-12-07T13:36:25.143Z"
}
```

**Insight Types:**
- `mood_low` - Indicates lower than average mood in the past week
- `mood_high` - Indicates consistently positive mood
- `journaling` - Suggestion to journal more regularly

**Severity Levels:**
- `positive` - Positive feedback
- `low` - Mild suggestion
- `medium` - Moderate recommendation

## Data Sources

All endpoints use READ-ONLY queries to existing tables:
- `moods` (no modifications)
- `journal_entries` (no modifications)
- `chat_messages` (no modifications)
- `users` (no modifications)

## Materialized Views

For improved performance, the following materialized views are available:

### mood_analytics
Aggregates mood data by user and date with statistics.

### usage_analytics
Aggregates user activity across all features.

### Refresh Function
To refresh materialized views:
```sql
SELECT refresh_analytics_views();
```

## Security

- All queries are read-only
- No data modifications allowed
- User ID must be provided for all user-specific endpoints
- Soft-deleted records are excluded from all queries

## Performance Considerations

- Materialized views should be refreshed periodically (recommended: daily via cron)
- Complex queries use proper indexing
- Results are cached where appropriate
- Date ranges are limited to prevent excessive data retrieval
