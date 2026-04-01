/**
 * splitGraphemes — Properly split Devanagari/Sanskrit text into visual characters.
 *
 * Using String.split('') on Hindi/Sanskrit text breaks combining characters
 * (matras like ि, ो, ् etc.) away from their base consonants.
 * Intl.Segmenter correctly identifies grapheme cluster boundaries.
 */

// Intl.Segmenter is available in all modern browsers and Node 16+
// but not in the ES2021 lib types — use a runtime check with type assertion.
const SegmenterCtor = (Intl as Record<string, unknown>).Segmenter as
  | (new (locale: string, opts: { granularity: string }) => {
      segment(input: string): Iterable<{ segment: string }>
    })
  | undefined

export function splitGraphemes(text: string): string[] {
  if (SegmenterCtor) {
    const segmenter = new SegmenterCtor('hi', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), (s) => s.segment)
  }
  // Fallback for environments without Intl.Segmenter
  return Array.from(text)
}
