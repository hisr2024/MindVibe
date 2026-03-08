/**
 * Voice Controller Service Tests
 *
 * Tests intent classification from natural language queries,
 * route resolution, and intent execution.
 */

import { describe, it, expect, vi } from 'vitest'
import { classifyIntent, resolveRoute, executeIntent } from '@/lib/voice-controller'

// Mock ecosystemNavigator since it uses localStorage
vi.mock('@/utils/voice/ecosystemNavigator', () => ({
  detectToolSuggestion: vi.fn(() => null),
  ECOSYSTEM_TOOLS: [
    { id: 'ardha', name: 'Ardha (Thought Reframing)', route: '/tools/ardha', friendDescription: 'Transform negative thought patterns.', triggerKeywords: ['reframe', 'negative thoughts'], emotions: ['anxiety'], situations: [], suggestions: ['Try Ardha'], category: 'healing', icon: '' },
    { id: 'viyoga', name: 'Viyoga (Detachment Coach)', route: '/tools/viyog', friendDescription: 'Release outcome anxiety.', triggerKeywords: ['let go', 'detach'], emotions: ['anxiety'], situations: [], suggestions: ['Try Viyoga'], category: 'healing', icon: '' },
    { id: 'karma-reset', name: 'Karma Reset', route: '/tools/karma-reset', friendDescription: 'A compassionate 4-step ritual.', triggerKeywords: ['guilt', 'regret'], emotions: ['guilt'], situations: [], suggestions: ['Try Karma Reset'], category: 'healing', icon: '' },
    { id: 'relationship-compass', name: 'Relationship Compass', route: '/tools/relationship-compass', friendDescription: 'Navigate relationship challenges.', triggerKeywords: ['relationship'], emotions: ['anger'], situations: [], suggestions: ['Try Compass'], category: 'healing', icon: '' },
    { id: 'kiaan-chat', name: 'KIAAN Chat', route: '/kiaan/chat', friendDescription: 'Dedicated text conversation.', triggerKeywords: ['text chat'], emotions: [], situations: [], suggestions: ['Try Chat'], category: 'wisdom', icon: '' },
    { id: 'gita-library', name: 'Bhagavad Gita Library', route: '/kiaan-vibe/gita', friendDescription: 'All 18 chapters.', triggerKeywords: ['gita', 'verse'], emotions: [], situations: [], suggestions: ['Try Gita'], category: 'wisdom', icon: '' },
    { id: 'kiaan-companion', name: 'KIAAN Companion (Best Friend)', route: '/companion', friendDescription: 'Your personal best friend.', triggerKeywords: ['talk', 'best friend'], emotions: [], situations: [], suggestions: ['Talk to KIAAN'], category: 'wellness', icon: '' },
    { id: 'kiaan-vibe', name: 'KIAAN Vibe (Meditation Music)', route: '/kiaan-vibe', friendDescription: 'Meditation music.', triggerKeywords: ['music', 'meditation music'], emotions: [], situations: [], suggestions: ['Listen'], category: 'wellness', icon: '' },
  ],
  getToolsForEmotion: vi.fn(() => []),
  getToolDiscoveryPrompt: vi.fn(() => ({ tool: { id: 'ardha' }, prompt: '' })),
  getToolsByCategory: vi.fn(() => ({})),
}))

describe('classifyIntent', () => {
  // ─── Control Commands ──────────────────────────────────────────────────

  it('classifies "stop" as a control command', () => {
    const intent = classifyIntent('stop')
    expect(intent.action).toBe('control')
    expect(intent.targetTool).toBe('stop')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('classifies "pause" as a control command', () => {
    const intent = classifyIntent('pause')
    expect(intent.action).toBe('control')
    expect(intent.targetTool).toBe('pause')
  })

  it('classifies "resume" as a control command', () => {
    const intent = classifyIntent('resume')
    expect(intent.action).toBe('control')
    expect(intent.targetTool).toBe('resume')
  })

  // ─── Direct Navigation ──────────────────────────────────────────────────

  it('classifies "take me to Ardha" as navigation', () => {
    const intent = classifyIntent('take me to Ardha')
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('ardha')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('classifies "open relationship compass" as navigation', () => {
    const intent = classifyIntent('open relationship compass')
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('relationship-compass')
  })

  it('classifies "go to viyoga" as navigation', () => {
    const intent = classifyIntent('go to viyoga')
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('viyoga')
  })

  it('classifies "show me the companion" as navigation', () => {
    const intent = classifyIntent('show me the companion')
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('kiaan-companion')
  })

  it('classifies "start meditation" as navigation to KIAAN Vibe', () => {
    const intent = classifyIntent('start meditation')
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('kiaan-vibe')
  })

  it('classifies "open chat" as navigation to KIAAN Chat', () => {
    const intent = classifyIntent('open chat')
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('kiaan-chat')
  })

  it('classifies "let\'s try reframe" as navigation to Ardha', () => {
    const intent = classifyIntent("let's try reframe")
    expect(intent.action).toBe('navigate')
    expect(intent.targetTool).toBe('ardha')
  })

  // ─── Karma Reset Triggers ─────────────────────────────────────────────

  it('classifies "karma reset" as karma_reset action', () => {
    const intent = classifyIntent('karma reset')
    expect(intent.action).toBe('karma_reset')
    expect(intent.targetTool).toBe('karma-reset')
  })

  it('classifies "I need a deep reset" as karma_reset', () => {
    const intent = classifyIntent('I need a deep reset')
    expect(intent.action).toBe('karma_reset')
  })

  // ─── Verse Lookup ─────────────────────────────────────────────────────

  it('classifies "read verse BG 2.47" as fetch_data', () => {
    const intent = classifyIntent('read verse BG 2.47')
    expect(intent.action).toBe('fetch_data')
    expect(intent.targetTool).toBe('gita-library')
    expect(intent.extractedContext.entities).toContain('2.47')
  })

  it('classifies "what is gita 18:66" as fetch_data', () => {
    const intent = classifyIntent('what is gita 18:66')
    expect(intent.action).toBe('fetch_data')
    expect(intent.extractedContext.entities).toContain('18.66')
  })

  // ─── Emotion Detection ────────────────────────────────────────────────

  it('detects anxiety emotion from "I feel so anxious"', () => {
    const intent = classifyIntent('I feel so anxious and worried')
    expect(intent.extractedContext.emotion).toBe('anxiety')
  })

  it('detects guilt emotion from "I feel guilty"', () => {
    const intent = classifyIntent('I feel guilty about what I did')
    expect(intent.extractedContext.emotion).toBe('guilt')
  })

  it('detects sadness from "I am so sad"', () => {
    const intent = classifyIntent('I am so sad and depressed')
    expect(intent.extractedContext.emotion).toBe('sadness')
  })

  // ─── Fallback to Query ────────────────────────────────────────────────

  it('falls back to query for unrecognized input', () => {
    const intent = classifyIntent('tell me about the meaning of life')
    expect(intent.action).toBe('query')
    expect(intent.targetTool).toBeNull()
  })

  it('returns low confidence for empty input', () => {
    const intent = classifyIntent('')
    expect(intent.action).toBe('query')
    expect(intent.confidence).toBe(0)
  })

  // ─── With Emotion Parameter ───────────────────────────────────────────

  it('uses provided emotion parameter', () => {
    const intent = classifyIntent('I need help', 'grief')
    expect(intent.extractedContext.emotion).toBe('grief')
  })
})

describe('resolveRoute', () => {
  it('resolves navigate intent to tool route', () => {
    const intent = classifyIntent('take me to Ardha')
    const { route } = resolveRoute(intent)
    expect(route).toBe('/tools/ardha')
  })

  it('resolves verse lookup to gita library', () => {
    const intent = classifyIntent('show verse BG 2.47')
    const { route, params } = resolveRoute(intent)
    expect(route).toBe('/kiaan-vibe/gita/2')
    expect(params.chapter).toBe('2')
    expect(params.verse).toBe('47')
  })

  it('resolves control command with empty route', () => {
    const intent = classifyIntent('stop')
    const { route, params } = resolveRoute(intent)
    expect(route).toBe('')
    expect(params.command).toBe('stop')
  })

  it('resolves unknown query to KIAAN chat', () => {
    const intent = classifyIntent('what is the purpose of life')
    const { route } = resolveRoute(intent)
    expect(route).toBe('/kiaan/chat')
  })
})

describe('executeIntent', () => {
  it('returns response for navigation intent', async () => {
    const intent = classifyIntent('take me to Ardha')
    const result = await executeIntent(intent)
    expect(result.route).toBe('/tools/ardha')
    expect(result.response).toContain('Ardha')
  })

  it('returns null response for query intent', async () => {
    const intent = classifyIntent('what is dharma')
    const result = await executeIntent(intent)
    expect(result.response).toBeNull()
    expect(result.suggestedFollowUp).toBeTruthy()
  })

  it('returns acknowledgment for control intent', async () => {
    const intent = classifyIntent('stop')
    const result = await executeIntent(intent)
    expect(result.response).toContain('acknowledged')
  })
})
