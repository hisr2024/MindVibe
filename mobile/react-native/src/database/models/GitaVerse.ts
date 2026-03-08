/**
 * GitaVerse WatermelonDB Model
 *
 * Cached Bhagavad Gita verses for offline access.
 * Populated on first fetch; refreshed periodically.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export class GitaVerse extends Model {
  static table = 'gita_verses';

  @field('chapter') chapter!: number;
  @field('verse') verse!: number;
  @field('sanskrit') sanskrit!: string;
  @field('transliteration') transliteration!: string;
  @field('translation') translation!: string;
  @field('commentary') commentary!: string | null;
  @field('audio_url') audioUrl!: string | null;
  @field('tags') tags!: string | null;
  @date('cached_at') cachedAt!: Date;
}
