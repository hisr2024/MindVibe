/**
 * Multilingual Goodbye Detection Tests
 *
 * Validates that detectVoiceCommand correctly identifies goodbye phrases
 * in 20+ languages and does not false-positive on normal conversation.
 */

import { describe, it, expect } from 'vitest'
import { detectVoiceCommand, isBlockingCommand } from '@/utils/speech/voiceCommands'

function isGoodbye(input: string): boolean {
  const result = detectVoiceCommand(input)
  return result !== null && result.type === 'goodbye' && isBlockingCommand(result.type)
}

describe('detectVoiceCommand - multilingual goodbye', () => {
  // ─── English ───────────────────────────────────────────────────────
  it.each([
    'goodbye', 'bye', 'bye bye', 'see you later', 'farewell',
    'good night', 'take care', 'gotta go', 'i have to go',
  ])('detects English goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Hindi ─────────────────────────────────────────────────────────
  it.each([
    'alvida', 'अलविदा', 'phir milenge', 'फिर मिलेंगे',
    'namaste', 'नमस्ते', 'chalta hoon', 'चलता हूँ',
  ])('detects Hindi goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Tamil ─────────────────────────────────────────────────────────
  it.each([
    'poi varugiren', 'போய் வருகிறேன்', 'vanakkam', 'வணக்கம்',
  ])('detects Tamil goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Telugu ────────────────────────────────────────────────────────
  it.each([
    'vellostanu', 'selavu', 'నమస్కారం', 'namaskaram',
  ])('detects Telugu goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Bengali ───────────────────────────────────────────────────────
  it.each([
    'biday', 'বিদায়', 'namaskar', 'নমস্কার',
  ])('detects Bengali goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Marathi ───────────────────────────────────────────────────────
  it.each(['nirop', 'yeto', 'punha bhetu'])('detects Marathi goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Gujarati ──────────────────────────────────────────────────────
  it.each(['aavjo', 'આવજો'])('detects Gujarati goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Kannada ───────────────────────────────────────────────────────
  it.each(['hogi baruttene', 'vidaaya', 'ನಮಸ್ಕಾರ'])('detects Kannada goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Malayalam ─────────────────────────────────────────────────────
  it.each(['poyi varaam', 'vida', 'yaathra'])('detects Malayalam goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Punjabi ───────────────────────────────────────────────────────
  it.each(['sat sri akal', 'fir milange', 'rabb rakha'])('detects Punjabi goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Sanskrit ──────────────────────────────────────────────────────
  it.each(['shubhratri', 'punarmilaamah'])('detects Sanskrit goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Spanish ───────────────────────────────────────────────────────
  it.each(['adios', 'adiós', 'hasta luego', 'chao', 'nos vemos'])('detects Spanish goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── French ────────────────────────────────────────────────────────
  it.each(['au revoir', 'adieu', 'a bientot', 'bonne nuit'])('detects French goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── German ────────────────────────────────────────────────────────
  it.each(['tschuss', 'auf wiedersehen', 'bis bald', 'gute nacht'])('detects German goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Portuguese ────────────────────────────────────────────────────
  it.each(['tchau', 'adeus', 'ate logo', 'boa noite'])('detects Portuguese goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Japanese ──────────────────────────────────────────────────────
  it.each(['sayonara', 'さようなら', 'jaa ne', 'mata ne', 'バイバイ'])('detects Japanese goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Chinese ───────────────────────────────────────────────────────
  it.each(['zaijian', '再见', '拜拜', 'bai bai', 'wan an'])('detects Chinese goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Korean ────────────────────────────────────────────────────────
  it.each(['annyeong', '안녕', 'jal ga', '잘 가'])('detects Korean goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Arabic ────────────────────────────────────────────────────────
  it.each(['maa salama', 'ma salama', 'wadaan', 'وداعا'])('detects Arabic goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Russian ───────────────────────────────────────────────────────
  it.each(['poka', 'пока', 'do svidaniya', 'до свидания'])('detects Russian goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Urdu ──────────────────────────────────────────────────────────
  it.each(['khuda hafiz', 'خدا حافظ'])('detects Urdu goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Italian ───────────────────────────────────────────────────────
  it.each(['ciao', 'arrivederci', 'addio'])('detects Italian goodbye: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Case insensitivity ────────────────────────────────────────────
  it.each(['GOODBYE', 'Bye Bye', 'Au Revoir', 'ADIOS'])('handles case-insensitive: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(true)
  })

  // ─── Goodbye is a blocking command ────────────────────────────────
  it('goodbye is in the blocking commands set', () => {
    expect(isBlockingCommand('goodbye')).toBe(true)
  })
})

describe('detectVoiceCommand - no false positives', () => {
  it.each([
    'how are you',
    'tell me about anxiety',
    'I feel sad today',
    'bypass this step',
    'what is the meaning of life',
    'I need a friend',
    'goodness gracious',
    'I bought something nice',
    'the video was great',
    'can you help me with my relationship',
    'what does the Gita say about anger',
  ])('does NOT trigger goodbye for: "%s"', (phrase) => {
    expect(isGoodbye(phrase)).toBe(false)
  })
})
