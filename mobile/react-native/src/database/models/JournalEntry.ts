/**
 * JournalEntry WatermelonDB Model
 *
 * Encrypted journal entries stored locally.
 * Content is encrypted before storage; decrypted only for display.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

const sanitizeTags = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === 'string');
  return [];
};

export class JournalEntry extends Model {
  static table = 'journal_entries';

  @field('content_encrypted') contentEncrypted!: string;
  @json('tags', sanitizeTags) tags!: string[];
  @field('server_id') serverId!: string | null;
  @field('sync_status') localSyncStatus!: 'synced' | 'pending' | 'error';
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
