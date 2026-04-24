/**
 * Journal adapter — wire-format contract tests.
 *
 * Locks the mobile-side pack/unpack behaviour to the Pydantic schema
 * in `backend/schemas/journal.py`. The critical invariants are:
 *
 *   • `moods[]` and `tags[]` ride separate JSON fields so KarmaLytix's
 *     `JournalEntry.mood_labels` column actually gets populated.
 *   • The encrypted body is marshalled as an `EncryptedPayload` object
 *     with `algorithm: 'AES-GCM-v1-iv-prefixed'` — the server never sees
 *     plaintext, but the Pydantic validator still passes.
 *   • `client_updated_at` is always set (required by the backend).
 *   • The response unpacker surfaces `moods[]` and `tags[]` separately to
 *     mobile consumers, and sets `mood_tag` to the first mood for the
 *     legacy JournalEntryCard.
 */

import { api } from '../endpoints';
import { apiClient } from '../client';

const mockedPost = apiClient.post as jest.Mock;
const mockedGet = apiClient.get as jest.Mock;

beforeEach(() => {
  mockedPost.mockReset();
  mockedGet.mockReset();
});

describe('api.journal.create pack/unpack', () => {
  it('splits moods and tags onto separate wire fields', async () => {
    mockedPost.mockResolvedValue({
      data: {
        id: 'entry-1',
        encrypted_content: { ciphertext: 'cipher-xyz' },
        moods: ['peaceful'],
        tags: ['peaceful', 'time:pratah', 'gratitude'],
        created_at: '2026-04-24T04:55:00.000Z',
      },
    });

    const res = await api.journal.create({
      content_encrypted: 'cipher-xyz',
      moods: ['peaceful'],
      tags: ['peaceful', 'time:pratah', 'gratitude'],
    });

    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [url, payload] = mockedPost.mock.calls[0];
    expect(url).toBe('/api/journal/entries');

    const body = payload as {
      content: { ciphertext: string; algorithm: string };
      moods: string[];
      tags: string[];
      client_updated_at: string;
    };
    expect(body.content.ciphertext).toBe('cipher-xyz');
    expect(body.content.algorithm).toBe('AES-GCM-v1-iv-prefixed');
    expect(body.moods).toEqual(['peaceful']);
    expect(body.tags).toEqual(['peaceful', 'time:pratah', 'gratitude']);
    expect(typeof body.client_updated_at).toBe('string');

    expect(res.data.moods).toEqual(['peaceful']);
    expect(res.data.tags).toEqual(['peaceful', 'time:pratah', 'gratitude']);
    expect(res.data.mood_tag).toBe('peaceful');
  });

  it('defaults moods[] to empty when no mood was chosen', async () => {
    mockedPost.mockResolvedValue({
      data: {
        id: 'entry-2',
        encrypted_content: { ciphertext: 'cipher-2' },
        moods: [],
        tags: ['time:ratri'],
        created_at: '2026-04-24T22:10:00.000Z',
      },
    });

    await api.journal.create({
      content_encrypted: 'cipher-2',
      tags: ['time:ratri'],
    });

    const [, payload] = mockedPost.mock.calls[0];
    const body = payload as { moods: string[]; tags: string[] };
    expect(body.moods).toEqual([]);
    expect(body.tags).toEqual(['time:ratri']);
  });
});

describe('api.journal list/get unpack', () => {
  it('exposes moods[] to callers', async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          id: 'entry-3',
          encrypted_content: { ciphertext: 'cipher-3' },
          moods: ['grateful'],
          tags: ['grateful', 'time:pratah'],
          created_at: '2026-04-23T06:00:00.000Z',
          updated_at: '2026-04-23T06:00:00.000Z',
        },
      ],
    });

    const res = await api.journal.list();
    expect(res.data.total).toBe(1);
    const entry = res.data.entries[0];
    if (!entry) throw new Error('expected one entry');
    expect(entry.moods).toEqual(['grateful']);
    expect(entry.mood_tag).toBe('grateful');
    expect(entry.content_encrypted).toBe('cipher-3');
  });

  it('treats missing moods array as empty rather than crashing', async () => {
    mockedGet.mockResolvedValue({
      data: {
        id: 'entry-4',
        encrypted_content: { ciphertext: 'cipher-4' },
        tags: ['time:ratri'],
        created_at: '2026-04-22T21:00:00.000Z',
      },
    });

    const res = await api.journal.get('entry-4');
    expect(res.data.moods).toEqual([]);
    expect(res.data.mood_tag).toBeUndefined();
  });
});
