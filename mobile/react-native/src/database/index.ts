/**
 * WatermelonDB Database Initialization
 *
 * Creates and exports the database instance used throughout the app.
 * Uses SQLite adapter for persistent local storage.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { MoodEntry } from './models/MoodEntry';
import { JournalEntry } from './models/JournalEntry';
import { GitaVerse } from './models/GitaVerse';

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'mindvibe',
  jsi: true, // Use JSI for faster bridge-less database access
  onSetUpError: (error) => {
    // Database setup failed — log and handle gracefully
    console.error('[Database] Setup error:', error);
  },
});

// ---------------------------------------------------------------------------
// Database Instance
// ---------------------------------------------------------------------------

export const database = new Database({
  adapter,
  modelClasses: [MoodEntry, JournalEntry, GitaVerse],
});

// Re-export models for convenient access
export { MoodEntry, JournalEntry, GitaVerse };
