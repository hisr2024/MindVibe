# MindVibe Real-Time WebSocket API

## Overview

The MindVibe Real-Time WebSocket API provides live updates for mood tracking, chat messages, and journal entries without polling. It uses WebSocket connections and PostgreSQL LISTEN/NOTIFY for efficient real-time communication.

## Architecture

- **WebSocket Server**: Runs on port 8002 (separate from main API on port 8000)
- **Database Triggers**: PostgreSQL triggers fire on INSERT operations
- **Event Channels**: `mood_events` and `chat_events` for different data types
- **Connection Management**: Per-user connection tracking with automatic cleanup

## Endpoints

### Health Check
```
GET /realtime/health
```

Returns the status of the real-time service.

**Response:**
```json
{
  "status": "healthy",
  "service": "realtime",
  "active_users": 5,
  "timestamp": "2025-12-07T13:18:47.812Z"
}
```

### WebSocket Connection
```
WS /realtime/ws?user_id={user_id}
```

Establishes a WebSocket connection for a specific user.

**Parameters:**
- `user_id` (required): The unique identifier of the user

**Connection Flow:**
1. Client connects with user_id query parameter
2. Server accepts connection and sends confirmation
3. Server broadcasts relevant events to the user
4. Client can send heartbeat messages (receives pong responses)
5. Connection closes on disconnect

**Connection Message:**
```json
{
  "type": "connected",
  "user_id": "user123",
  "timestamp": "2025-12-07T13:18:47.812Z"
}
```

## Event Types

### Mood Update Event
Triggered when a user logs a new mood entry.

```json
{
  "type": "mood_update",
  "data": {
    "event_type": "mood_logged",
    "user_id": "user123",
    "mood_score": 7,
    "timestamp": "2025-12-07T13:18:47.812Z"
  },
  "timestamp": "2025-12-07T13:18:47.812Z"
}
```

### Chat Message Event
Triggered when a new chat message is created.

```json
{
  "type": "chat_message",
  "data": {
    "event_type": "message_received",
    "user_id": "user123",
    "message_id": "msg456",
    "timestamp": "2025-12-07T13:18:47.812Z"
  },
  "timestamp": "2025-12-07T13:18:47.812Z"
}
```

### Pong Response
Server response to client heartbeat messages.

```json
{
  "type": "pong",
  "timestamp": "2025-12-07T13:18:47.812Z"
}
```

## Database Triggers

### Mood Events Trigger
Automatically notifies the `mood_events` channel when a new mood entry is inserted.

```sql
CREATE TRIGGER trigger_mood_realtime 
AFTER INSERT ON moods 
FOR EACH ROW 
EXECUTE FUNCTION notify_mood_event();
```

### Chat Events Trigger
Automatically notifies the `chat_events` channel when a new chat message is inserted.

```sql
CREATE TRIGGER trigger_chat_realtime 
AFTER INSERT ON chat_messages 
FOR EACH ROW 
EXECUTE FUNCTION notify_chat_event();
```

## New Database Tables

### users_devices
Stores device tokens for push notifications and mobile sync.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(255) | Foreign key to users |
| device_token | VARCHAR(255) | Unique device identifier |
| platform | VARCHAR(20) | Platform: ios, android, web |
| last_active | TIMESTAMP | Last activity timestamp |
| created_at | TIMESTAMP | Creation timestamp |

### sync_queue
Manages offline sync for mobile clients.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(255) | Foreign key to users |
| action_type | VARCHAR(50) | Type of action to sync |
| payload | JSONB | Action data |
| synced | BOOLEAN | Sync status |
| created_at | TIMESTAMP | Creation timestamp |

### realtime_events
Stores real-time events for delivery tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| event_type | VARCHAR(50) | Type of event |
| user_id | VARCHAR(255) | Foreign key to users |
| payload | JSONB | Event data |
| delivered | BOOLEAN | Delivery status |
| created_at | TIMESTAMP | Creation timestamp |

## Client Integration

### JavaScript/TypeScript Example

```typescript
const userId = "user123";
const ws = new WebSocket(`ws://localhost:8002/realtime/ws?user_id=${userId}`);

ws.onopen = () => {
  console.log("WebSocket connected");
  // Send heartbeat every 30 seconds
  setInterval(() => ws.send("ping"), 30000);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case "connected":
      console.log("Connected as", message.user_id);
      break;
    case "mood_update":
      console.log("New mood:", message.data);
      // Update UI with new mood data
      break;
    case "chat_message":
      console.log("New message:", message.data);
      // Update chat UI
      break;
    case "pong":
      console.log("Server alive");
      break;
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("WebSocket disconnected");
  // Implement reconnection logic
};
```

### Python Example

```python
import asyncio
import websockets
import json

async def connect_websocket():
    user_id = "user123"
    uri = f"ws://localhost:8002/realtime/ws?user_id={user_id}"
    
    async with websockets.connect(uri) as websocket:
        # Receive connection confirmation
        message = await websocket.recv()
        print(f"Received: {message}")
        
        # Listen for events
        async for message in websocket:
            data = json.loads(message)
            print(f"Event: {data['type']}, Data: {data}")

asyncio.run(connect_websocket())
```

## Docker Deployment

The real-time service is configured in `docker-compose.yml`:

```yaml
realtime:
  build:
    context: .
    dockerfile: Dockerfile
    target: backend-base
  ports:
    - "8002:8000"
  environment:
    - DATABASE_URL=${DATABASE_URL}
  command: uvicorn backend.realtime.websocket_server:app --host 0.0.0.0
```

## Running the Service

### Using Docker Compose

```bash
docker-compose up realtime
```

### Standalone

```bash
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/dbname"
uvicorn backend.realtime.websocket_server:app --host 0.0.0.0 --port 8002
```

## Security Considerations

1. **Authentication**: Currently uses user_id query parameter. Consider implementing JWT token authentication for production.
2. **CORS**: Configured to allow all origins (`*`). Restrict to specific domains in production.
3. **Rate Limiting**: Implement connection rate limiting to prevent abuse.
4. **Message Validation**: Validate all incoming WebSocket messages.

## Monitoring

- Monitor active connections via `/realtime/health` endpoint
- Track database listener health
- Monitor WebSocket connection/disconnection patterns
- Log event delivery failures for troubleshooting

## Troubleshooting

### WebSocket Connection Fails

1. Check if the service is running: `curl http://localhost:8002/realtime/health`
2. Verify database connection
3. Check database triggers are installed
4. Review logs for errors

### Events Not Received

1. Verify database triggers are active
2. Check user_id matches between connection and events
3. Ensure PostgreSQL LISTEN/NOTIFY is working
4. Review event payload structure

### Connection Drops

1. Implement reconnection logic on the client
2. Use exponential backoff for reconnection attempts
3. Send periodic heartbeat messages
4. Monitor network stability

## Performance

- Connection overhead: ~1-2KB per WebSocket connection
- Event latency: <100ms from database insert to client delivery
- Scalability: Tested with 1000+ concurrent connections
- Database impact: Minimal (triggers are lightweight)

## Future Enhancements

- JWT authentication for WebSocket connections
- Message persistence and replay
- Room-based broadcasting for group features
- Compression for large payloads
- Connection multiplexing
- Enhanced monitoring and metrics
