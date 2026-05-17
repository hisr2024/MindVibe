/**
 * Ardha response parser.
 *
 * The `/api/ardha/reframe` endpoint returns a long `response` string that
 * the ARDHA system prompt instructs the model to structure as fixed
 * headings: Atma Distinction, Raga-Dvesha Scan, Dharma Alignment,
 * Hrdaya Samatvam, Arpana, Gita Verse, Compliance Check.
 *
 * The mobile result screen renders those as an accordion. This parser
 * walks the raw text once and extracts each section's content without
 * touching the server, so the existing v4.0 Gita pipeline keeps working.
 */

/** Canonical pillar keys in the order they should render. */
export const ARDHA_SECTION_KEYS = [
  'atma_distinction',
  'raga_dvesha',
  'dharma_alignment',
  'hrdaya_samatvam',
  'arpana',
  'gita_verse',
  'compliance_check',
] as const;

export type ArdhaSectionKey = (typeof ARDHA_SECTION_KEYS)[number];

export interface ArdhaSectionMeta {
  readonly key: ArdhaSectionKey;
  readonly icon: string;
  readonly label: string;
  readonly sanskrit: string;
  /** Single-letter badge shown in ARDHA Analysis ("A", "R", "D", "H", "A"). */
  readonly badge: string;
}

export const ARDHA_SECTIONS: readonly ArdhaSectionMeta[] = [
  {
    key: 'atma_distinction',
    icon: '🧘',
    label: 'Atma Distinction',
    sanskrit: 'Atma Viveka',
    badge: 'A',
  },
  {
    key: 'raga_dvesha',
    icon: '🔍',
    label: 'Raga-Dvesha Diagnosis',
    sanskrit: 'Raga-Dvesha Pariksha',
    badge: 'R',
  },
  {
    key: 'dharma_alignment',
    icon: '⚖️',
    label: 'Dharma Alignment',
    sanskrit: 'Dharma Nishtha',
    badge: 'D',
  },
  {
    key: 'hrdaya_samatvam',
    icon: '🕊️',
    label: 'Hrdaya Samatvam',
    sanskrit: 'Hrdaya Samatvam',
    badge: 'H',
  },
  {
    key: 'arpana',
    icon: '🙏',
    label: 'Arpana',
    sanskrit: 'Ishvara Arpana',
    badge: 'A',
  },
  {
    key: 'gita_verse',
    icon: '📜',
    label: 'Gita Verse',
    sanskrit: '',
    badge: 'G',
  },
  {
    key: 'compliance_check',
    icon: '✅',
    label: 'Compliance Check',
    sanskrit: '',
    badge: 'C',
  },
] as const;

export interface ParsedArdhaSection {
  key: ArdhaSectionKey;
  icon: string;
  label: string;
  sanskrit: string;
  content: string;
}

/** Heading aliases the model uses in practice — all lowercase for matching. */
const HEADING_ALIASES: Record<string, ArdhaSectionKey> = {
  'atma distinction': 'atma_distinction',
  'atma viveka': 'atma_distinction',
  'raga-dvesha scan': 'raga_dvesha',
  'raga-dvesha diagnosis': 'raga_dvesha',
  'raga-dvesha pariksha': 'raga_dvesha',
  'dharma alignment': 'dharma_alignment',
  'dharma nishtha': 'dharma_alignment',
  'hrdaya samatvam': 'hrdaya_samatvam',
  'hṛdaya samatvam': 'hrdaya_samatvam',
  arpana: 'arpana',
  'ishvara arpana': 'arpana',
  'gita verse': 'gita_verse',
  'bhagavad gita verse': 'gita_verse',
  'compliance check': 'compliance_check',
  'compliance tests': 'compliance_check',
};

/**
 * Strip markdown decorations from a heading line so `### **Dharma Alignment**:`
 * collapses to `dharma alignment` for alias matching.
 */
function normalizeHeading(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, '')
    .replace(/\*{1,2}/g, '')
    .replace(/^-\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/[:：]\s*$/, '')
    .trim()
    .toLowerCase();
}

/** Find the canonical section key for a line if it's a heading, else null. */
function matchHeading(line: string): ArdhaSectionKey | null {
  const stripped = normalizeHeading(line);
  if (!stripped || stripped.length > 60) return null;
  return HEADING_ALIASES[stripped] ?? null;
}

/**
 * Split a full ARDHA response string into its pillar sections.
 *
 * Resilient to:
 *  - Markdown headings (`### Dharma Alignment`)
 *  - Bold headings (`**Dharma Alignment**`)
 *  - Plain headings on their own line
 *  - Sanskrit alias headings (`Dharma Nishtha`)
 *
 * Sections that are missing from the text simply don't appear in the
 * output — callers should render whatever comes back, in ARDHA_SECTIONS
 * order.
 */
export function parseArdhaResponse(response: string): ParsedArdhaSection[] {
  const lines = (response ?? '').split(/\r?\n/);

  const buckets = new Map<ArdhaSectionKey, string[]>();
  let current: ArdhaSectionKey | null = null;
  const preamble: string[] = [];

  for (const line of lines) {
    const match = matchHeading(line);
    if (match !== null) {
      current = match;
      if (!buckets.has(current)) buckets.set(current, []);
      continue;
    }
    if (current === null) {
      preamble.push(line);
    } else {
      buckets.get(current)!.push(line);
    }
  }

  // If the model never used a heading, fall back to putting the whole
  // response under Dharma Alignment so the user still sees *something*
  // rather than an empty accordion.
  if (buckets.size === 0) {
    const body = preamble.join('\n').trim();
    if (!body) return [];
    return [
      {
        key: 'dharma_alignment',
        icon: '⚖️',
        label: 'Dharma Alignment',
        sanskrit: 'Dharma Nishtha',
        content: body,
      },
    ];
  }

  const out: ParsedArdhaSection[] = [];
  for (const meta of ARDHA_SECTIONS) {
    const chunk = buckets.get(meta.key);
    if (!chunk) continue;
    const content = chunk.join('\n').trim();
    if (!content) continue;
    out.push({
      key: meta.key,
      icon: meta.icon,
      label: meta.label,
      sanskrit: meta.sanskrit,
      content,
    });
  }
  return out;
}

/**
 * Humanise a snake_case emotion label returned by the backend's
 * `primary_emotion` field. "fear_of_failure" -> "fear of failure".
 */
export function humaniseEmotion(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.replace(/_/g, ' ').trim();
}
