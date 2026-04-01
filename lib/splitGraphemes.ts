/**
 * splitGraphemes — Properly split Devanagari/Sanskrit text into visual characters.
 *
 * Using String.split('') on Hindi/Sanskrit text breaks combining characters
 * (matras like ि, ो, ् etc.) away from their base consonants.
 * Intl.Segmenter correctly identifies grapheme cluster boundaries.
 */

export function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), (s) => s.segment)
  }
  // Fallback for environments without Intl.Segmenter
  return Array.from(text)
}
