# Mobile BFF API Documentation

## Overview

The Mobile Backend for Frontend (BFF) service provides optimized API endpoints for mobile applications. It aggregates and proxies requests to the existing KIAAN APIs, reducing network overhead and improving mobile app performance.

## Architecture

The Mobile BFF service:
- Runs independently on port 8001 (configurable via `KIAAN_API_URL`)
- Proxies requests to the main KIAAN API (default: http://localhost:8000)
- Aggregates multiple API calls into single endpoints
- Provides mobile-optimized response formats
- Maintains zero breaking changes to the main KIAAN API

## Base URL

```
http://localhost:8001
```

## Authentication

All authenticated endpoints require an `Authorization` header:

```
Authorization: Bearer <token>
```

## Endpoints

### Health Check

**GET** `/mobile/health`

Returns the health status of the Mobile BFF service.

**Response:**
```json
{
  "status": "healthy",
  "service": "mobile-bff",
  "timestamp": "2024-12-07T12:00:00.000000"
}
```

### Chat History

**GET** `/mobile/v1/chat/history`

Retrieves chat history with pagination support.

**Headers:**
- `Authorization`: Bearer token (required)

**Query Parameters:**
- `limit` (optional): Maximum number of messages to return (default: 50)

**Response:**
```json
{
  "messages": [...],
  "total_count": 100,
  "has_more": true
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authorization
- `4xx/5xx`: Proxied error from KIAAN API

### Dashboard

**GET** `/mobile/v1/dashboard`

Aggregates mood and journal data in a single request for dashboard display.

**Headers:**
- `Authorization`: Bearer token (required)

**Response:**
```json
{
  "moods": [
    {
      "id": "uuid",
      "score": 8,
      "tags": ["happy", "energetic"],
      "note": "Feeling great today!",
      "at": "2024-12-07T12:00:00"
    }
  ],
  "journal": [
    {
      "id": "uuid",
      "content": "Journal entry...",
      "created_at": "2024-12-07T11:00:00"
    }
  ],
  "synced_at": "2024-12-07T12:00:00.000000"
}
```

**Notes:**
- Returns the last 7 mood entries
- Returns the last 5 journal entries
- Gracefully handles failures from individual APIs (returns empty arrays)

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authorization

### Send Chat Message

**POST** `/mobile/v1/chat`

Sends a chat message to KIAAN.

**Headers:**
- `Authorization`: Bearer token (required)

**Request Body:**
```json
{
  "message": "Hello KIAAN",
  "context": {...}
}
```

**Response:**
Proxied response from KIAAN API (varies based on chat endpoint implementation)

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authorization
- `4xx/5xx`: Proxied error from KIAAN API

## Configuration

### Environment Variables

- `KIAAN_API_URL`: Base URL of the main KIAAN API (default: `http://localhost:8000`)

Example:
```bash
KIAAN_API_URL=http://api.mindvibe.com
```

## Running the Service

### Development

```bash
cd backend/mobile_bff
uvicorn main:app --reload --port 8001
```

### Production

```bash
uvicorn backend.mobile_bff.main:app --host 0.0.0.0 --port 8001
```

## Error Handling

The Mobile BFF service provides consistent error handling:

1. **Authorization Errors**: Returns `401 Unauthorized` when authorization is missing or invalid
2. **Proxied Errors**: Forwards HTTP status codes and messages from the KIAAN API
3. **Timeout Errors**: Uses a 30-second timeout for all proxied requests
4. **Partial Failures**: In aggregated endpoints (like `/mobile/v1/dashboard`), individual API failures return empty arrays instead of failing the entire request

## Rate Limiting

Rate limiting is inherited from the main KIAAN API. The Mobile BFF does not implement additional rate limiting.

## CORS

The Mobile BFF is configured with permissive CORS settings for development:
- `allow_origins`: `["*"]`
- `allow_credentials`: `true`
- `allow_methods`: `["*"]`
- `allow_headers`: `["*"]`

**Production Note**: Configure specific allowed origins via environment variables.

## API Versioning

The Mobile BFF uses URL-based versioning:
- Current version: `v1`
- Base path: `/mobile/v1/`

Future versions will be accessible via `/mobile/v2/`, etc.

## Testing

Run the Mobile BFF tests:

```bash
pytest tests/test_mobile_bff.py -v
```

## Constraints

The Mobile BFF service adheres to strict implementation constraints:
- ✅ Does NOT modify any files in `backend/routes/`
- ✅ Does NOT change existing database schemas
- ✅ Does NOT alter KIAAN core logic
- ✅ Only creates NEW files

## Future Enhancements

Potential improvements for future versions:
1. Response caching for frequently accessed data
2. Request batching for multiple chat messages
3. WebSocket support for real-time updates
4. Offline queue management
5. Mobile-specific analytics
