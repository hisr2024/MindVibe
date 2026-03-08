/**
 * MoodEntry WatermelonDB Model
 *
 * Represents a mood check-in stored locally.
 * Syncs to POST /api/moods when online.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

const sanitizeTags = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === 'string');
  return [];
};

export class MoodEntry extends Model {
  static table = 'mood_entries';

  @field('score') score!: number;
  @json('tags', sanitizeTags) tags!: string[];
  @field('note') note!: string | null;
  @field('kiaan_response') kiaanResponse!: string | null;
  @field('server_id') serverId!: string | null;
  @field('sync_status') syncStatus!: 'synced' | 'pending' | 'error';
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
