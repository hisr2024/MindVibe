/**
 * ToolVoicePrefillContract — TypeScript mirror of
 * backend/services/voice/tool_prefill_contracts.py.
 *
 * Used by Part 9's `useToolInvocation` to honor the spec's
 * INPUT_TO_TOOL contract:
 *   • allowed_fields filtering
 *   • required_fields gate
 *   • PII scrubbing
 *   • voice_guide_min_confidence floor (per-tool)
 *
 * MUST stay in sync with the Python registry. The validator at
 * apps/sakha-mobile/scripts/validate-tool-contracts.mjs cross-checks
 * tool names + allowed_fields + required_fields + min_confidence.
 *
 * Confidentiality: Kiaanverse IP. Do not share, summarize, or reproduce.
 */

// ─── Contract type ────────────────────────────────────────────────────────

export interface ToolVoicePrefillContract {
  readonly tool: string;
  readonly route: string;
  readonly allowedFields: readonly string[];
  readonly requiredFields: readonly string[];
  readonly piiScrubFields: readonly string[];
  readonly displayTemplate: string;
  readonly voiceGuideMinConfidence: number;
  readonly notes?: string;
}

// ─── PII scrubbing (mirrors safe regex set) ───────────────────────────────

const NAME_RE = /\b(?:[A-Z][a-z]+\s+){1,3}[A-Z][a-z]+\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b\+?\d[\d\s().-]{6,}\d\b/g;
const ADDRESS_RE = /\b\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|Road|Lane|Boulevard|Blvd|Ave|St|Rd)\b/gi;
const MEDICAL_RE = /\b(?:diagnos(?:ed|is)|prescription|prescribed|psychiatrist|therapist|medication|antidepressant|antianxiety|adhd|bipolar|ptsd|ssri|snri)\b/gi;
const FINANCIAL_RE = /\b(?:bank|account|card|credit|debit|loan|mortgage|salary|₹|\$|€|£)\s*\d+/gi;

export function scrubString(s: string): string {
  if (!s) return s;
  return s
    .replace(EMAIL_RE, '<email>')
    .replace(PHONE_RE, '<phone>')
    .replace(ADDRESS_RE, '<address>')
    .replace(MEDICAL_RE, '<medical>')
    .replace(FINANCIAL_RE, '<financial>')
    .replace(NAME_RE, '<name>')
    .trim();
}

export function scrubPayload(
  payload: Record<string, unknown> | null | undefined,
  scrubKeys: readonly string[],
): Record<string, unknown> {
  if (!payload) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (scrubKeys.includes(k) && typeof v === 'string') {
      out[k] = scrubString(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ─── 15 contracts (mirrors Python CONTRACTS) ──────────────────────────────

export const CONTRACTS: Record<string, ToolVoicePrefillContract> = {
  KIAAN_CHAT: {
    tool: 'KIAAN_CHAT',
    route: '/kiaan/chat',
    allowedFields: ['opening_topic', 'mood_label', 'lang_hint'],
    requiredFields: [],
    piiScrubFields: ['opening_topic'],
    displayTemplate: 'Sakha brought you here to keep the conversation going.',
    voiceGuideMinConfidence: 0.75,
  },
  COMPANION: {
    tool: 'COMPANION',
    route: '/companion',
    allowedFields: ['topic_summary', 'mood_label', 'lang_hint'],
    requiredFields: [],
    piiScrubFields: ['topic_summary'],
    displayTemplate: 'Sakha shared what we talked about with your Companion.',
    voiceGuideMinConfidence: 0.75,
  },
  VIYOGA: {
    tool: 'VIYOGA',
    route: '/tools/viyoga',
    allowedFields: ['absence_topic', 'person_role', 'duration_label'],
    requiredFields: ['absence_topic'],
    piiScrubFields: ['absence_topic'],
    displayTemplate:
      "Sakha shared that you are sitting with an absence — {absence_topic}. Begin when you're ready.",
    voiceGuideMinConfidence: 0.75,
    notes: "person_role is a coarse role like 'parent' or 'spouse' — never a name.",
  },
  ARDHA: {
    tool: 'ARDHA',
    route: '/tools/ardha',
    allowedFields: ['split_theme', 'mood_label'],
    requiredFields: ['split_theme'],
    piiScrubFields: ['split_theme'],
    displayTemplate: 'Sakha brought your split to Ardha — {split_theme}.',
    voiceGuideMinConfidence: 0.75,
  },
  RELATIONSHIP_COMPASS: {
    tool: 'RELATIONSHIP_COMPASS',
    route: '/tools/relationship-compass',
    allowedFields: ['relationship_role', 'tension_summary', 'mood_label'],
    requiredFields: ['relationship_role'],
    piiScrubFields: ['tension_summary'],
    displayTemplate: 'Sakha shared the {relationship_role} tension you spoke of.',
    voiceGuideMinConfidence: 0.75,
    notes:
      "relationship_role: 'spouse' | 'parent' | 'child' | 'sibling' | 'friend' | 'colleague'",
  },
  EMOTIONAL_RESET: {
    tool: 'EMOTIONAL_RESET',
    route: '/tools/emotional-reset',
    allowedFields: ['mood_label', 'trigger_summary', 'intensity'],
    requiredFields: ['mood_label'],
    piiScrubFields: ['trigger_summary'],
    displayTemplate:
      "Sakha shared that you're feeling {mood_label}. Begin reflection →",
    voiceGuideMinConfidence: 0.7,
    notes:
      'Lower confidence threshold because Emotional Reset is the most-tested + lowest-risk path; the user can edit.',
  },
  KARMA_RESET: {
    tool: 'KARMA_RESET',
    route: '/tools/karma-reset',
    allowedFields: ['pattern_summary', 'duration_label', 'mood_label'],
    requiredFields: ['pattern_summary'],
    piiScrubFields: ['pattern_summary'],
    displayTemplate:
      "Sakha brought the pattern you described — {pattern_summary} — into Karma Reset. Edit ▾ if it's not right.",
    voiceGuideMinConfidence: 0.75,
  },
  KARMA_FOOTPRINT: {
    tool: 'KARMA_FOOTPRINT',
    route: '/tools/karma-footprint',
    allowedFields: ['focus_area', 'mood_label'],
    requiredFields: [],
    piiScrubFields: ['focus_area'],
    displayTemplate: 'Sakha brought you to Karma Footprint — focusing on {focus_area}.',
    voiceGuideMinConfidence: 0.75,
  },
  KARMIC_TREE: {
    tool: 'KARMIC_TREE',
    route: '/tools/karmic-tree',
    allowedFields: ['focus_area'],
    requiredFields: [],
    piiScrubFields: [],
    displayTemplate: 'Your Karmic Tree, opened from your conversation with Sakha.',
    voiceGuideMinConfidence: 0.6,
    notes: 'Karmic Tree is largely view-only — low risk for prefill drift.',
  },
  SACRED_REFLECTIONS: {
    tool: 'SACRED_REFLECTIONS',
    route: '/tools/sacred-reflections',
    allowedFields: ['prefill_text', 'verse_ref', 'mood_label', 'source'],
    requiredFields: ['prefill_text'],
    piiScrubFields: ['prefill_text'],
    displayTemplate:
      'Sakha drafted a journal entry from your conversation. Edit ▾ before saving.',
    voiceGuideMinConfidence: 0.75,
    notes: 'Largest payload — the full Sakha response. Always scrub.',
  },
  KIAAN_VIBE: {
    tool: 'KIAAN_VIBE',
    route: '/tools/kiaan-vibe',
    allowedFields: ['mood_label', 'intensity'],
    requiredFields: ['mood_label'],
    piiScrubFields: [],
    displayTemplate: 'Vibe set from Sakha — {mood_label}.',
    voiceGuideMinConfidence: 0.65,
  },
  WISDOM_ROOMS: {
    tool: 'WISDOM_ROOMS',
    route: '/tools/wisdom-rooms',
    allowedFields: ['room_topic', 'mood_label'],
    requiredFields: [],
    piiScrubFields: ['room_topic'],
    displayTemplate:
      'Sakha brought you to Wisdom Rooms — looking for rooms about {room_topic}.',
    voiceGuideMinConfidence: 0.75,
  },
  SADHANA: {
    tool: 'SADHANA',
    route: '/tools/sadhana',
    allowedFields: ['practice_intent', 'mood_label'],
    requiredFields: [],
    piiScrubFields: ['practice_intent'],
    displayTemplate: 'Sakha brought you to your Sadhana — intent: {practice_intent}.',
    voiceGuideMinConfidence: 0.75,
  },
  GITA_LIBRARY: {
    tool: 'GITA_LIBRARY',
    route: '/tools/gita-library',
    allowedFields: ['verse_ref', 'chapter', 'search_term'],
    requiredFields: [],
    piiScrubFields: [],
    displayTemplate: 'Opening {verse_ref} in the Gita Library.',
    voiceGuideMinConfidence: 0.6,
    notes: 'Verse refs are canonical — no PII risk.',
  },
  MOOD_INSIGHTS: {
    tool: 'MOOD_INSIGHTS',
    route: '/tools/mood-insights',
    allowedFields: ['time_window', 'mood_focus'],
    requiredFields: [],
    piiScrubFields: [],
    displayTemplate: 'Mood Insights for {time_window}, opened from Sakha.',
    voiceGuideMinConfidence: 0.6,
    notes: 'View-only — low confidence threshold.',
  },
};

// ─── Public helpers ───────────────────────────────────────────────────────

export function getContract(tool: string): ToolVoicePrefillContract | null {
  return CONTRACTS[tool.toUpperCase()] ?? null;
}

export function hasContract(tool: string): boolean {
  return CONTRACTS[tool.toUpperCase()] !== undefined;
}

export type ContractAction = 'INPUT_TO_TOOL' | 'NAVIGATE' | 'DROP';

export interface ContractApplication {
  action: ContractAction;
  payload: Record<string, unknown> | null;
  display: string | null;
}

/** Apply a contract to a (tool, payload, confidence) tuple — mirrors
 *  Python apply_contract. Used by the screen layer in addition to the
 *  Part 9 useToolInvocation hook to give the destination tool one more
 *  scrub line of defense. */
export function applyContract(
  tool: string,
  payload: Record<string, unknown> | null,
  confidence: number,
): ContractApplication {
  const contract = getContract(tool);
  if (!contract) return { action: 'DROP', payload: null, display: null };
  if (confidence < contract.voiceGuideMinConfidence) {
    return { action: 'NAVIGATE', payload: null, display: null };
  }
  const filtered: Record<string, unknown> = {};
  for (const k of contract.allowedFields) {
    if (payload && Object.prototype.hasOwnProperty.call(payload, k)) {
      filtered[k] = payload[k];
    }
  }
  for (const k of contract.requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(filtered, k)) {
      return { action: 'NAVIGATE', payload: null, display: null };
    }
  }
  const sanitized = scrubPayload(filtered, contract.piiScrubFields);
  let display = contract.displayTemplate;
  for (const [k, v] of Object.entries(sanitized)) {
    display = display.replace('{' + k + '}', String(v));
  }
  return { action: 'INPUT_TO_TOOL', payload: sanitized, display };
}
