/**
 * Gita Chapter Verses - Next.js API Route
 *
 * Returns verses for a given chapter number.
 * Tries the Python backend first, falls back to a curated static corpus.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

interface StaticVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  preview: string
  theme: string
}

// Curated key verses per chapter (fallback when backend unavailable)
const CHAPTER_VERSES: Record<number, StaticVerse[]> = {
  2: [
    { chapter: 2, verse: 14, sanskrit: '\u092E\u093E\u0924\u094D\u0930\u093E\u0938\u094D\u092A\u0930\u094D\u0936\u093E\u0938\u094D\u0924\u0941 \u0915\u094C\u0928\u094D\u0924\u0947\u092F', transliteration: 'matra-sparsas tu kaunteya', preview: 'Happiness and distress appear and disappear like seasons. They are impermanent — endure them bravely.', theme: 'Impermanence' },
    { chapter: 2, verse: 47, sanskrit: '\u0915\u0930\u094D\u092E\u0923\u094D\u092F\u0947\u0935\u093E\u0927\u093F\u0915\u093E\u0930\u0938\u094D\u0924\u0947', transliteration: 'karmanye vadhikaraste', preview: 'You have the right to action alone, never to its fruits.', theme: 'Detachment from results' },
    { chapter: 2, verse: 48, sanskrit: '\u092F\u094B\u0917\u0938\u094D\u0925\u0903 \u0915\u0941\u0930\u0941 \u0915\u0930\u094D\u092E\u093E\u0923\u093F', transliteration: 'yogasthah kuru karmani', preview: 'Perform your duty with equanimity, abandoning attachment to success or failure.', theme: 'Equanimity' },
    { chapter: 2, verse: 56, sanskrit: '\u0926\u0941\u0903\u0916\u0947\u0937\u094D\u0935\u0928\u0941\u0926\u094D\u0935\u093F\u0917\u094D\u0928\u092E\u0928\u093E\u0903', transliteration: 'duhkhesv anudvigna-manah', preview: 'One undisturbed by misery, unattached to happiness, free from fear and anger — that is a sage.', theme: 'Equanimity' },
    { chapter: 2, verse: 62, sanskrit: '\u0927\u094D\u092F\u093E\u092F\u0924\u094B \u0935\u093F\u0937\u092F\u093E\u0928\u094D\u092A\u0941\u0902\u0938\u0903', transliteration: 'dhyayato visayan pumsah', preview: 'Dwelling on sense objects creates attachment, then desire, then anger, then delusion.', theme: 'Chain of destruction' },
    { chapter: 2, verse: 70, sanskrit: '\u0906\u092A\u0942\u0930\u094D\u092F\u092E\u093E\u0923\u092E\u091A\u0932\u092A\u094D\u0930\u0924\u093F\u0937\u094D\u0920\u092E\u094D', transliteration: 'apuryamanam acala-pratistham', preview: 'Peace comes to one who lets desires flow like rivers into the ocean — always filling, never disturbed.', theme: 'Inner peace' },
  ],
  3: [
    { chapter: 3, verse: 19, sanskrit: '\u0924\u0938\u094D\u092E\u093E\u0926\u0938\u0915\u094D\u0924\u0903 \u0938\u0924\u0924\u092E\u094D', transliteration: 'tasmad asaktah satatam', preview: 'Act without attachment — by working without selfish motive, one attains the Supreme.', theme: 'Selfless action' },
    { chapter: 3, verse: 27, sanskrit: '\u092A\u094D\u0930\u0915\u0943\u0924\u0947\u0903 \u0915\u094D\u0930\u093F\u092F\u092E\u093E\u0923\u093E\u0928\u093F', transliteration: 'prakriteh kriyamanani', preview: 'All actions are performed by the forces of nature. Only the ego-deluded think "I am the doer."', theme: 'Ego vs reality' },
    { chapter: 3, verse: 37, sanskrit: '\u0915\u093E\u092E \u090F\u0937 \u0915\u094D\u0930\u094B\u0927 \u090F\u0937', transliteration: 'kama esha krodha esha', preview: 'Desire and anger — born of passion — are the all-devouring enemies of this world.', theme: 'Desire management' },
  ],
  6: [
    { chapter: 6, verse: 5, sanskrit: '\u0909\u0926\u094D\u0927\u0930\u0947\u0926\u093E\u0924\u094D\u092E\u0928\u093E\u0924\u094D\u092E\u093E\u0928\u092E\u094D', transliteration: 'uddhared atmanatmanam', preview: 'Elevate yourself by your own effort. You are your own friend and your own enemy.', theme: 'Self as friend' },
    { chapter: 6, verse: 6, sanskrit: '\u092C\u0928\u094D\u0927\u0941\u0930\u093E\u0924\u094D\u092E\u093E\u0924\u094D\u092E\u0928\u0938\u094D\u0924\u0938\u094D\u092F', transliteration: 'bandhur atmatmanas tasya', preview: 'For those who have conquered the mind, it is the best of friends. For those who haven\'t, the greatest enemy.', theme: 'Mind mastery' },
    { chapter: 6, verse: 17, sanskrit: '\u092F\u0941\u0915\u094D\u0924\u093E\u0939\u093E\u0930\u0935\u093F\u0939\u093E\u0930\u0938\u094D\u092F', transliteration: 'yuktahara-viharasya', preview: 'For one moderate in eating, recreation, work, and sleep — yoga destroys all sorrow.', theme: 'Balance' },
    { chapter: 6, verse: 35, sanskrit: '\u0905\u0938\u0902\u0936\u092F\u0902 \u092E\u0939\u093E\u092C\u093E\u0939\u094B', transliteration: 'asamsayam mahabaho', preview: 'The mind is restless and hard to control — but it can be trained through practice and detachment.', theme: 'Mind training' },
  ],
  9: [
    { chapter: 9, verse: 26, sanskrit: '\u092A\u0924\u094D\u0930\u0902 \u092A\u0941\u0937\u094D\u092A\u0902 \u092B\u0932\u0902 \u0924\u094B\u092F\u092E\u094D', transliteration: 'patram pushpam phalam toyam', preview: 'Whoever offers me a leaf, flower, fruit, or water with devotion — I accept that offering of love.', theme: 'Love & Worth' },
    { chapter: 9, verse: 30, sanskrit: '\u0905\u092A\u093F \u091A\u0947\u0924\u094D\u0938\u0941\u0926\u0941\u0930\u093E\u091A\u093E\u0930\u094B', transliteration: 'api cet suduracaro', preview: 'Even if the most sinful person worships with devotion, they shall be regarded as righteous.', theme: 'Redemption' },
  ],
  18: [
    { chapter: 18, verse: 47, sanskrit: '\u0936\u094D\u0930\u0947\u092F\u093E\u0928\u094D\u0938\u094D\u0935\u0927\u0930\u094D\u092E\u094B \u0935\u093F\u0917\u0941\u0923\u0903', transliteration: 'sreyan sva-dharmo vigunah', preview: 'Better to follow your own dharma imperfectly than another\'s dharma perfectly.', theme: 'Your unique path' },
    { chapter: 18, verse: 66, sanskrit: '\u0938\u0930\u094D\u0935\u0927\u0930\u094D\u092E\u093E\u0928\u094D\u092A\u0930\u093F\u0924\u094D\u092F\u091C\u094D\u092F', transliteration: 'sarva-dharman parityajya', preview: 'Abandon all varieties of dharmas and surrender unto Me. I shall deliver you. Do not fear.', theme: 'Surrender & freedom' },
    { chapter: 18, verse: 78, sanskrit: '\u092F\u0924\u094D\u0930 \u092F\u094B\u0917\u0947\u0936\u094D\u0935\u0930\u0903 \u0915\u0943\u0937\u094D\u0923\u094B', transliteration: 'yatra yogeshvarah krishno', preview: 'Where there is wisdom and action together, there will be prosperity, victory, and firm justice.', theme: 'Wisdom + Action' },
  ],
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterNum: string }> },
) {
  const { chapterNum: raw } = await params
  const chapterNum = parseInt(raw, 10)

  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 18) {
    return NextResponse.json({ error: 'Chapter must be 1-18' }, { status: 400 })
  }

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/gita/chapters/${chapterNum}/verses`, {
      headers: proxyHeaders(request),
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.verses?.length > 0) return forwardCookies(res, NextResponse.json(data))
    }
  } catch {
    // Backend unavailable
  }

  // Static fallback
  const verses = CHAPTER_VERSES[chapterNum] || []
  return NextResponse.json({ verses })
}
