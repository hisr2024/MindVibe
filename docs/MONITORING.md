# MindVibe Monitoring Guide

## Overview

This guide explains how to use MindVibe's monitoring and observability features to track application health, performance, and user activity.

## Health Endpoints

### Detailed Health Check

**Endpoint:** `GET /api/monitoring/health/detailed`

Returns comprehensive health information including:
- Database status & latency
- OpenAI API configuration status
- System resources (CPU, memory, disk)

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T00:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "latency_ms": 12.5
    },
    "openai": {
      "status": "configured"
    },
    "system": {
      "cpu_percent": 25.3,
      "memory_percent": 45.2,
      "disk_percent": 67.8
    }
  }
}
```

**Status Values:**
- `healthy`: All systems operational
- `degraded`: Some systems experiencing issues

### Application Metrics

**Endpoint:** `GET /api/monitoring/metrics`

Returns application usage metrics including:
- Total users
- Active users (last 24 hours)
- Messages sent (last 24 hours)
- Moods tracked (last 24 hours)

**Example Response:**
```json
{
  "timestamp": "2024-12-08T00:30:00.000Z",
  "users": {
    "total": 1250,
    "active_24h": 342
  },
  "messages": {
    "total_24h": 2150,
    "avg_per_user": 6.29
  },
  "moods": {
    "total_24h": 567
  }
}
```

## Request Logging

All API requests are automatically logged with:
- Request method and path
- Response status code
- Processing time
- Custom header `X-Process-Time` added to all responses

**Example Log Output:**
```
INFO: Request started: POST /api/chat/message
INFO: Request completed: POST /api/chat/message Status: 200 Duration: 0.523s
```

## Error Tracking

### Basic Error Logging

All errors are automatically logged to the application logs with:
- Error message and type
- Stack trace
- Function/endpoint where error occurred

### Sentry Integration (Optional)

To enable Sentry error tracking, set the `SENTRY_DSN` environment variable:

```bash
export SENTRY_DSN=your-sentry-dsn-here
export ENVIRONMENT=production  # or staging, development
```

When configured, errors are automatically sent to Sentry with:
- 10% sampling rate for performance traces
- Environment tagging
- Full exception context

## Analytics Events

### Tracked Events

The following events are available for tracking:
- `chat_message_sent` - User sends a chat message
- `mood_logged` - User logs their mood
- `journal_entry_created` - User creates a journal entry
- `karma_reset_completed` - User completes a karma reset session

### Using Analytics Tracker

```python
from backend.analytics.simple_tracker import SimpleAnalytics
from backend.deps import get_db

# Track an event
await SimpleAnalytics.track_event(
    db=db,
    event_type="chat_message_sent",
    user_id=user_id,
    metadata={"session_id": "abc123", "message_length": 50}
)

# Get daily statistics
stats = await SimpleAnalytics.get_daily_stats(db, days=7)
```

### Event Metadata

Include relevant metadata as a dictionary:
- Session information
- Feature flags
- User properties
- Context-specific data

**Note:** Analytics events are tracked asynchronously and will not fail the main request if tracking fails.

## Monitoring Checklist

### Daily Tasks
- [ ] Check `/api/monitoring/health/detailed` endpoint
- [ ] Review error logs in application logs
- [ ] Monitor active user count via `/api/monitoring/metrics`
- [ ] Verify system resource usage is within normal ranges

### Weekly Tasks
- [ ] Review `/api/monitoring/metrics` trends
- [ ] Check database performance metrics
- [ ] Review Sentry errors (if enabled)
- [ ] Analyze analytics events for unusual patterns

### Performance Thresholds

**Database Latency:**
- Normal: < 50ms
- Warning: 50-100ms
- Critical: > 100ms

**System Resources:**
- CPU: Normal < 70%, Warning 70-90%, Critical > 90%
- Memory: Normal < 80%, Warning 80-95%, Critical > 95%
- Disk: Normal < 85%, Warning 85-95%, Critical > 95%

## Troubleshooting

### Database Connection Issues

If health check shows database status as "down":
1. Check database connection string in environment variables
2. Verify database service is running
3. Check network connectivity
4. Review database logs for errors

### High System Resource Usage

If CPU/Memory/Disk usage is high:
1. Check for long-running queries in database
2. Review recent traffic patterns
3. Check for memory leaks in application logs
4. Consider scaling resources if usage is sustained

### OpenAI API Issues

If OpenAI status shows "missing":
1. Verify `OPENAI_API_KEY` environment variable is set
2. Check API key is valid
3. Verify API quota is not exceeded

## Security Considerations

- Health endpoints do NOT require authentication (for monitoring systems)
- Metrics endpoint does NOT expose sensitive user data
- Analytics events should NOT contain PII
- Error tracking may contain request context - review before enabling Sentry

## Integration with Monitoring Tools

### Prometheus (Future)

The metrics endpoint can be adapted for Prometheus scraping by:
1. Converting to Prometheus exposition format
2. Adding additional system metrics
3. Setting up appropriate labels

### Grafana (Future)

Create dashboards using:
- Time-series data from analytics_events table
- Metrics endpoint data
- System resource metrics

### Alerting (Future)

Set up alerts for:
- Health check failures
- High error rates
- System resource thresholds exceeded
- Unusual traffic patterns

## Best Practices

1. **Monitor regularly**: Check health endpoints at least daily
2. **Set up alerts**: Configure external monitoring to alert on failures
3. **Track trends**: Use metrics to identify patterns over time
4. **Keep it lightweight**: Analytics should not impact user experience
5. **Review errors**: Investigate and fix recurring errors
6. **Document incidents**: Keep a log of issues and resolutions

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- Sentry Documentation: https://docs.sentry.io/
- Psutil Documentation: https://psutil.readthedocs.io/

## Support

For issues or questions about monitoring:
1. Check application logs for detailed error information
2. Review this documentation for common issues
3. Contact the development team with specific error details
