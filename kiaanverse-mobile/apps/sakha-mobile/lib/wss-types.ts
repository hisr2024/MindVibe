/**
 * Sakha WSS frame protocol — TypeScript mirror of
 * backend/services/voice/wss_frames.py.
 *
 * Subprotocol: kiaan-voice-v1
 *
 * Every frame between the Sakha mobile client and the backend is a JSON
 * object with a `type` discriminator. Audio chunks travel as base64
 * strings inside ServerAudioChunkFrame / ClientAudioChunkFrame — never
 * raw binary frames — because the WSS is text-only by spec.
 *
 * IMPORTANT: this file is the source of truth for the mobile-side types,
 * and it MUST stay in sync with the Python pydantic models. The validator
 * in scripts/validate-wss-types.mjs cross-checks the two files at CI
 * time and fails the build if any frame name or required field drifts.
 *
 * If you add a frame type to the Python side, update:
 *   1. ServerFrame / ClientFrame discriminated union (this file)
 *   2. The frame's interface
 *   3. SCHEMA_VERSION on both sides if it's a breaking change
 *   4. scripts/validate-wss-types.mjs allowlist if adding/removing types
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const SUBPROTOCOL = 'kiaan-voice-v1';
export const SCHEMA_VERSION = '1.0.0';

// ─── Shared sub-models ────────────────────────────────────────────────────

export interface HelplineEntry {
  name: string;
  number: string;
  region: string;
  language?: string;
  is_24x7?: boolean;
}

export interface MoodSnapshot {
  label: string;
  intensity: number; // 0..1
  trend: string; // "rising" | "falling" | "steady"
}

export interface VerseSnapshot {
  chapter: number; // 1..18
  verse: number; // 1..78
  text_sa: string;
  text_en: string;
  text_hi?: string;
  citation: string; // "BG 2.47"
}

export interface SuggestedNextItem {
  label: string;
  action: string; // "open_tool:emotional_reset" | "open_journey:transform-anger" | …
}

// ─── Client → Server frames ───────────────────────────────────────────────

export interface ClientStartFrame {
  type: 'start';
  session_id: string;
  lang_hint?: string;
  persona_version: string;
  render_mode?: 'voice' | 'text';
  delivery_channel?: 'voice_android' | 'voice_web' | 'voice_ios';
  user_region?: string | null;
  schema_version?: string;
}

export interface ClientAudioChunkFrame {
  type: 'audio.chunk';
  seq: number;
  data: string; // base64 Opus
}

export interface ClientEndOfSpeechFrame {
  type: 'end_of_speech';
}

export interface ClientInterruptFrame {
  type: 'interrupt';
}

export interface ClientHeartbeatFrame {
  type: 'heartbeat';
}

export type ClientFrame =
  | ClientStartFrame
  | ClientAudioChunkFrame
  | ClientEndOfSpeechFrame
  | ClientInterruptFrame
  | ClientHeartbeatFrame;

// ─── Server → Client frames ───────────────────────────────────────────────

export interface ServerTranscriptPartialFrame {
  type: 'transcript.partial';
  text: string;
  is_final?: boolean;
  seq?: number;
}

export interface ServerCrisisFrame {
  type: 'crisis';
  incident_id: string;
  helpline: HelplineEntry[];
  audio_url: string;
  region: string;
  language: string;
}

export interface ServerEngineFrame {
  type: 'engine';
  selected: 'GUIDANCE' | 'FRIEND' | 'ASSISTANT' | 'VOICE_GUIDE';
}

export interface ServerMoodFrame {
  type: 'mood';
  label: string;
  intensity: number;
  trend: string;
}

export interface ServerVerseFrame {
  type: 'verse';
  chapter: number;
  verse: number;
  text_sa: string;
  text_en: string;
  text_hi?: string;
  citation: string;
}

export interface ServerTextDeltaFrame {
  type: 'text.delta';
  content: string;
}

export interface ServerAudioChunkFrame {
  type: 'audio.chunk';
  seq: number;
  mime?: 'audio/opus' | 'audio/mpeg' | 'audio/wav';
  data: string; // base64
}

export interface ServerFilterFailedFrame {
  type: 'filter_failed';
  reason: string;
  falling_back_to: 'template' | 'verse_only';
}

export interface ServerToolInvocationFrame {
  type: 'tool_invocation';
  tool: string;
  action: 'NAVIGATE' | 'INPUT_TO_TOOL';
  input_payload?: Record<string, unknown> | null;
  carry_id?: string | null;
  confidence: number;
}

export interface ServerSuggestedNextFrame {
  type: 'suggested_next';
  items: SuggestedNextItem[];
}

export interface ServerDoneFrame {
  type: 'done';
  conversation_id: string;
  total_ms: number;
  cache_hit?: boolean;
  persona_version: string;
  tier_used?: 'openai' | 'local_llm' | 'template' | 'verse_only';
  first_audio_byte_ms?: number | null;
}

export interface ServerErrorFrame {
  type: 'error';
  code: string;
  message: string;
  recoverable?: boolean;
}

export interface ServerHeartbeatAckFrame {
  type: 'heartbeat.ack';
}

export type ServerFrame =
  | ServerTranscriptPartialFrame
  | ServerCrisisFrame
  | ServerEngineFrame
  | ServerMoodFrame
  | ServerVerseFrame
  | ServerTextDeltaFrame
  | ServerAudioChunkFrame
  | ServerFilterFailedFrame
  | ServerToolInvocationFrame
  | ServerSuggestedNextFrame
  | ServerDoneFrame
  | ServerErrorFrame
  | ServerHeartbeatAckFrame;

// ─── Wire helpers ─────────────────────────────────────────────────────────

/** Serialize a client/server frame to its JSON wire form. */
export function serializeFrame(frame: ClientFrame | ServerFrame): string {
  return JSON.stringify(frame);
}

/** Parse a frame string. Throws if `type` is missing. */
export function parseFrame<T extends ClientFrame | ServerFrame>(raw: string): T {
  const parsed = JSON.parse(raw) as { type?: string };
  if (!parsed || typeof parsed.type !== 'string') {
    throw new Error(
      `Invalid Sakha WSS frame: missing 'type' (raw=${raw.slice(0, 80)}…)`,
    );
  }
  return parsed as T;
}

/** Type guard for ServerFrame (vs ClientFrame). Useful when echo-testing. */
export function isServerFrame(f: ClientFrame | ServerFrame): f is ServerFrame {
  return (
    f.type === 'transcript.partial' ||
    f.type === 'crisis' ||
    f.type === 'engine' ||
    f.type === 'mood' ||
    f.type === 'verse' ||
    f.type === 'text.delta' ||
    f.type === 'audio.chunk' ||
    f.type === 'filter_failed' ||
    f.type === 'tool_invocation' ||
    f.type === 'suggested_next' ||
    f.type === 'done' ||
    f.type === 'error' ||
    f.type === 'heartbeat.ack'
  );
}

/** Canonical close codes (mirror voice_companion_wss.py). */
export const WssCloseCodes = {
  BAD_SUBPROTOCOL: 1002,
  PERSONA_MISMATCH: 4001,
  BAD_FIRST_FRAME: 4002,
  PROTOCOL_VIOLATION: 4003,
  INTERNAL: 4500,
} as const;
