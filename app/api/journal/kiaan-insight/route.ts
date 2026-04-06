/**
 * KIAAN weekly journal insight — metadata-only reflection.
 *
 * This route returns a deterministic stub derived from recent entry
 * metadata (mood frequencies). It never reads decrypted journal content.
 * When the real KIAAN inference service is wired in, replace the stub body
 * with a call that passes only { moods[], tags[], timestamps[] }.
 */

import { NextRequest, NextResponse } from 'next/server'

const REFLECTIONS_BY_MOOD: Record<string, string> = {
  peaceful:
    'The stillness you have been resting in this week is not passivity — it is the ground from which right action arises. Krishna tells Arjuna that the steady mind is the one the world cannot shake. Stay here a little longer.',
  grateful:
    'Gratitude has been the colour of your week. In the Gita, this is the first sign of a heart turning toward the Self — noticing that what you have is already enough. Let the thankfulness deepen into worship.',
  seeking:
    'You are searching, and that is sacred. Arjuna stood in the same posture on the battlefield. What you are looking for is not outside. The Gita calls it viveka: the capacity to tell the real from the projected. Stay with the uncertainty a little longer.',
  heavy:
    'This week carried weight. You showed up even so. In chapter 6, Krishna says the yogi is one who has befriended their own mind. Be that friend to yourself this week — not a judge.',
  radiant:
    'Your light has been visible this week. Krishna reminds us that the sattvic mind shines without effort. Protect this clarity; do not rush to spend it.',
  wounded:
    'You have been writing from a tender place. In chapter 2, Krishna tells Arjuna that what feels unbearable is passing. Not because it is small — but because you are larger than it. Keep offering the truth.',
}

const VERSE_BY_MOOD: Record<
  string,
  { reference: string; sanskrit: string; translation: string; theme: string }
> = {
  peaceful: {
    reference: 'BG 2.70',
    sanskrit: 'आपूर्यमाणमचलप्रतिष्ठं समुद्रमापः प्रविशन्ति यद्वत्',
    translation:
      'As waters enter the ocean, which, though ever being filled, remains still — so the one whose mind is at rest receives all desires and remains at peace.',
    theme: 'sthita-prajña',
  },
  grateful: {
    reference: 'BG 9.26',
    sanskrit: 'पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति',
    translation:
      'Whoever offers me a leaf, a flower, a fruit, or water with devotion — I accept that loving offering.',
    theme: 'bhakti',
  },
  seeking: {
    reference: 'BG 4.34',
    sanskrit: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया',
    translation: 'Know this by humble approach, by inquiry, and by service.',
    theme: 'jñāna',
  },
  heavy: {
    reference: 'BG 2.14',
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः',
    translation:
      'The contacts of the senses give rise to heat and cold, pleasure and pain. They come and go, impermanent. Endure them, Arjuna.',
    theme: 'titikṣā',
  },
  radiant: {
    reference: 'BG 14.11',
    sanskrit: 'सर्वद्वारेषु देहेऽस्मिन्प्रकाश उपजायते',
    translation: 'When light arises in every gate of the body, know that sattva is increasing.',
    theme: 'sattva',
  },
  wounded: {
    reference: 'BG 18.66',
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज',
    translation: 'Abandon all concerns and take refuge in me alone. I will free you from every sorrow.',
    theme: 'śaraṇāgati',
  },
}

interface BlobEntry {
  mood?: string
  updated_at?: string
}

async function fetchRecentMoodCounts(request: NextRequest): Promise<{
  entryCount: number
  moodCounts: Record<string, number>
}> {
  try {
    const url = new URL('/api/journal/entries?limit=50&offset=0', request.url)
    const res = await fetch(url, { headers: { cookie: request.headers.get('cookie') ?? '' } })
    if (!res.ok) return { entryCount: 0, moodCounts: {} }
    const data = await res.json()
    const list: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.entries)
        ? data.entries
        : Array.isArray(data?.items)
          ? data.items
          : []
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const counts: Record<string, number> = {}
    let total = 0
    for (const raw of list as BlobEntry[]) {
      let mood = raw.mood
      const blob = (raw as { blob_json?: string }).blob_json
      if (blob) {
        try {
          const parsed = JSON.parse(blob)
          mood = parsed.mood ?? mood
          const updated = parsed.updated_at ?? raw.updated_at
          if (updated && new Date(updated).getTime() < weekAgo) continue
        } catch {
          /* ignore */
        }
      }
      if (!mood) continue
      counts[mood] = (counts[mood] ?? 0) + 1
      total += 1
    }
    return { entryCount: total, moodCounts: counts }
  } catch {
    return { entryCount: 0, moodCounts: {} }
  }
}

export async function GET(request: NextRequest) {
  const { entryCount, moodCounts } = await fetchRecentMoodCounts(request)
  const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const total = Object.values(moodCounts).reduce((sum, n) => sum + n, 0)
  const moodPattern = Object.entries(moodCounts)
    .map(([mood, count]) => ({
      mood,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)

  const fallback =
    'Your reflections this week are beginning to trace a shape. Keep showing up — patterns emerge slowly, like a path revealed by walking.'
  const reflection = dominant ? REFLECTIONS_BY_MOOD[dominant] ?? fallback : fallback
  const verse = dominant ? VERSE_BY_MOOD[dominant] : undefined

  return NextResponse.json({
    reflection,
    dominantMood: dominant,
    entryCount,
    moodPattern,
    verse,
  })
}
