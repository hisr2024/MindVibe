/**
 * WatermelonDB Schema Definition
 *
 * Defines the local SQLite schema for offline-first data persistence.
 * Tables mirror the server models but are optimized for mobile access patterns.
 *
 * Schema versioning enables safe migrations between app updates.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // ------------------------------------------------------------------
    // Mood check-ins (offline-first, syncs to /api/moods)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'mood_entries',
      columns: [
        { name: 'score', type: 'number' },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'note', type: 'string', isOptional: true },
        { name: 'kiaan_response', type: 'string', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' }, // 'synced' | 'pending' | 'error'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Journal entries (encrypted at rest)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'journal_entries',
      columns: [
        { name: 'content_encrypted', type: 'string' },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Cached Gita verses (for offline verse browsing)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'gita_verses',
      columns: [
        { name: 'chapter', type: 'number', isIndexed: true },
        { name: 'verse', type: 'number', isIndexed: true },
        { name: 'sanskrit', type: 'string' },
        { name: 'transliteration', type: 'string' },
        { name: 'translation', type: 'string' },
        { name: 'commentary', type: 'string', isOptional: true },
        { name: 'audio_url', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true },
        { name: 'cached_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Journey progress (local cache of active journeys)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'journey_progress',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'template_slug', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'status', type: 'string' }, // active | paused | completed
        { name: 'current_day', type: 'number' },
        { name: 'total_days', type: 'number' },
        { name: 'completed_steps', type: 'number' },
        { name: 'streak_days', type: 'number' },
        { name: 'started_at', type: 'number', isOptional: true },
        { name: 'last_activity', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Chat messages (conversation history cache)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'chat_messages',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'sender', type: 'string' }, // 'user' | 'assistant'
        { name: 'text', type: 'string' },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'verses_used', type: 'string', isOptional: true }, // JSON array
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Offline sync queue (pending operations)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'entity_type', type: 'string', isIndexed: true },
        { name: 'operation_type', type: 'string' }, // create | update | delete
        { name: 'entity_id', type: 'string' },
        { name: 'payload', type: 'string' }, // JSON
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // pending | syncing | failed
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Cached API responses (TTL-based cache)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'api_cache',
      columns: [
        { name: 'cache_key', type: 'string', isIndexed: true },
        { name: 'response_data', type: 'string' }, // JSON
        { name: 'expires_at', type: 'number', isIndexed: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ------------------------------------------------------------------
    // Audio track downloads (offline vibe player)
    // ------------------------------------------------------------------
    tableSchema({
      name: 'downloaded_tracks',
      columns: [
        { name: 'track_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'artist', type: 'string', isOptional: true },
        { name: 'local_path', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'duration', type: 'number' },
        { name: 'verse_ref', type: 'string', isOptional: true },
        { name: 'downloaded_at', type: 'number' },
      ],
    }),
  ],
});
