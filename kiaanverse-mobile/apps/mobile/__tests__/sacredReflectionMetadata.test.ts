/**
 * Sacred Reflections — metadata split contract tests.
 *
 * Guards the single bug that shipped as "Sacred Mirror is broken": the
 * mobile editor stuffed the mood id into tags[] only, which left the
 * backend's JournalEntry.mood_labels column permanently empty and
 * starved KarmaLytix of any mood signal. `buildMetadataPayload` is the
 * pure helper that now keeps moods[] and tags[] in sync — these tests
 * pin the invariants we rely on:
 *
 *   1. Mood lands in moods[] (not just tags[]).
 *   2. Mood id is still mirrored into tags[] for the BrowseTab filter.
 *   3. The time-of-day tag is always emitted.
 *   4. User-selected tags are appended without duplication.
 *   5. No mood → moods[] empty, tags[] still has time band + user tags.
 */

import { buildMetadataPayload } from '../components/sacred-reflections/EditorTab';

describe('buildMetadataPayload', () => {
  it('puts the mood in moods[] and mirrors it into tags[] for legacy filters', () => {
    const { moods, tags } = buildMetadataPayload({
      mood: 'peaceful',
      userTags: ['gratitude', 'healing'],
      timeOfDay: 'pratah',
    });
    expect(moods).toEqual(['peaceful']);
    expect(tags).toContain('peaceful');
    expect(tags).toContain('time:pratah');
    expect(tags).toContain('gratitude');
    expect(tags).toContain('healing');
  });

  it('emits an empty moods[] when no mood was chosen', () => {
    const { moods, tags } = buildMetadataPayload({
      mood: null,
      userTags: ['reflection'],
      timeOfDay: 'ratri',
    });
    expect(moods).toEqual([]);
    expect(tags).toEqual(['time:ratri', 'reflection']);
  });

  it('does not double-insert tags that the user already selected', () => {
    const { tags } = buildMetadataPayload({
      mood: 'grateful',
      userTags: ['grateful', 'joy'],
      timeOfDay: 'sandhya',
    });
    const gratefulCount = tags.filter((t) => t === 'grateful').length;
    expect(gratefulCount).toBe(1);
    expect(tags).toContain('joy');
  });

  it('places mood id at index 0 so legacy card filters still find it', () => {
    const { tags } = buildMetadataPayload({
      mood: 'radiant',
      userTags: [],
      timeOfDay: 'madhyanha',
    });
    expect(tags[0]).toBe('radiant');
  });
});
