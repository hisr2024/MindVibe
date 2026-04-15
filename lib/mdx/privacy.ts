/**
 * lib/mdx/privacy.ts
 *
 * Zero-dependency MDX loader for the privacy policy.
 *
 * Why a custom parser instead of @mdx-js/react?
 *   - The project does not ship MDX runtime dependencies.
 *   - The privacy policy is well-structured (headings, paragraphs, tables).
 *   - A scoped parser keeps the bundle small and compilation at build time.
 *
 * How it works:
 *   - Reads content/legal/privacy-policy.mdx once at module load.
 *   - Because this file is imported from a Server Component rendered with
 *     `export const dynamic = 'force-static'`, the read happens at build time
 *     and the parsed AST is baked into the static page.
 *   - Extracts YAML-like frontmatter between --- fences.
 *   - Splits the body into sections (## = level 2) and subsections (### = 3).
 *   - Converts paragraphs, tables, inline emphasis, and links into a typed
 *     AST that <PrivacyContent /> renders with styled component overrides.
 */

import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PrivacyFrontmatter {
  title: string
  description: string
  lastUpdated: string
  effectiveDate: string
  version: string
  canonicalPath: string
  compliance: ReadonlyArray<ComplianceTag>
  contact: {
    email: string
    dpo: string
    address: string
  }
}

export type ComplianceTag = 'GDPR' | 'CCPA' | 'Apple' | 'Google Play'

export interface InlineText {
  type: 'text'
  value: string
}

export interface InlineEmphasis {
  type: 'emphasis' | 'strong' | 'code'
  value: string
}

export interface InlineLink {
  type: 'link'
  value: string
  href: string
}

export type InlineNode = InlineText | InlineEmphasis | InlineLink

export interface ParagraphBlock {
  type: 'paragraph'
  children: InlineNode[]
}

export interface TableBlock {
  type: 'table'
  headers: string[]
  rows: string[][]
}

export interface Heading3Block {
  type: 'h3'
  id: string
  text: string
}

export type ContentBlock = ParagraphBlock | TableBlock | Heading3Block

export interface PrivacySection {
  /** Slugified anchor id (matches MDX {#id}). */
  id: string
  /** Ordinal label e.g. "1", "2.1" (derived from heading numbering). */
  ordinal: string
  /** Heading text without the ordinal number. */
  heading: string
  /** Full heading including ordinal (used for TOC labels). */
  fullHeading: string
  /** Blocks that belong to this section (paragraphs, tables, h3s). */
  blocks: ContentBlock[]
  /** Flattened list of h3 subsections for TOC expansion. */
  subsections: Array<{ id: string; heading: string }>
}

export interface PrivacyDocument {
  frontmatter: PrivacyFrontmatter
  sections: PrivacySection[]
}

// ---------------------------------------------------------------------------
// File read (once per process at build/load time)
// ---------------------------------------------------------------------------

const MDX_PATH = path.join(process.cwd(), 'content', 'legal', 'privacy-policy.mdx')

// ---------------------------------------------------------------------------
// Frontmatter parser — accepts the narrow YAML subset used in our MDX files.
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string): { data: PrivacyFrontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error('privacy-policy.mdx: missing frontmatter block')
  }
  const [, yaml, body] = match
  const data = parseYamlSubset(yaml)

  const required: ReadonlyArray<keyof PrivacyFrontmatter> = [
    'title',
    'description',
    'lastUpdated',
    'effectiveDate',
    'version',
    'canonicalPath',
    'compliance',
    'contact',
  ]
  for (const key of required) {
    if (!(key in data)) {
      throw new Error(`privacy-policy.mdx: missing frontmatter key "${String(key)}"`)
    }
  }

  return { data: data as unknown as PrivacyFrontmatter, body }
}

type YamlValue = string | string[] | { [k: string]: string }
type YamlObject = Record<string, YamlValue>

function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/**
 * Minimal YAML subset:
 *   key: value
 *   key:
 *     - item
 *     - item
 *   key:
 *     nested: value
 */
function parseYamlSubset(yaml: string): YamlObject {
  const lines = yaml.split(/\r?\n/)
  const root: YamlObject = {}
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i += 1
      continue
    }

    const topLevel = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!topLevel) {
      i += 1
      continue
    }

    const [, key, rest] = topLevel

    if (rest.trim() !== '') {
      root[key] = stripQuotes(rest)
      i += 1
      continue
    }

    // Block value: look ahead for list items or nested object.
    const block: string[] = []
    let j = i + 1
    while (j < lines.length && /^\s{2,}/.test(lines[j])) {
      block.push(lines[j])
      j += 1
    }

    if (block.length === 0) {
      root[key] = ''
      i = j
      continue
    }

    if (block.every((b) => /^\s*-\s+/.test(b))) {
      root[key] = block.map((b) => stripQuotes(b.replace(/^\s*-\s+/, '')))
    } else {
      const nested: Record<string, string> = {}
      for (const b of block) {
        const m = b.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/)
        if (m) {
          nested[m[1]] = stripQuotes(m[2])
        }
      }
      root[key] = nested
    }

    i = j
  }

  return root
}

// ---------------------------------------------------------------------------
// Body parser — splits into sections and blocks.
// ---------------------------------------------------------------------------

const HEADING_RE = /^(#{2,3})\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?\s*$/
// Matches numeric prefixes like "1", "1.1", optionally followed by a trailing dot.
const ORDINAL_RE = /^(\d+(?:\.\d+)*)\.?\s+(.*)$/

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function parseInline(raw: string): InlineNode[] {
  // Split on markdown links and code spans and emphasis markers.
  const nodes: InlineNode[] = []
  let cursor = 0
  const text = raw

  const pattern =
    /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push({ type: 'text', value: text.slice(cursor, match.index) })
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      nodes.push({ type: 'link', value: match[1], href: match[2] })
    } else if (match[3] !== undefined) {
      nodes.push({ type: 'code', value: match[3] })
    } else if (match[4] !== undefined) {
      nodes.push({ type: 'strong', value: match[4] })
    } else if (match[5] !== undefined) {
      nodes.push({ type: 'emphasis', value: match[5] })
    }
    cursor = pattern.lastIndex
  }

  if (cursor < text.length) {
    nodes.push({ type: 'text', value: text.slice(cursor) })
  }

  if (nodes.length === 0) {
    nodes.push({ type: 'text', value: raw })
  }

  return nodes
}

function parseTable(lines: string[]): TableBlock | null {
  if (lines.length < 2) return null
  const splitRow = (row: string): string[] =>
    row
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((cell) => cell.trim())

  const headers = splitRow(lines[0])
  const separator = lines[1]
  if (!/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(separator)) {
    return null
  }
  const rows = lines.slice(2).map(splitRow)
  return { type: 'table', headers, rows }
}

interface ParseHeadingResult {
  level: 2 | 3
  ordinal: string
  heading: string
  fullHeading: string
  id: string
}

function parseHeading(line: string): ParseHeadingResult | null {
  const m = HEADING_RE.exec(line)
  if (!m) return null
  const level = m[1].length === 2 ? 2 : 3
  const fullHeading = m[2].trim()
  const explicitId = m[3]
  const ordMatch = ORDINAL_RE.exec(fullHeading)
  const ordinal = ordMatch ? ordMatch[1] : ''
  const heading = ordMatch ? ordMatch[2] : fullHeading
  const id = explicitId ?? slugify(fullHeading)
  return { level, ordinal, heading, fullHeading, id }
}

function parseBody(body: string): PrivacySection[] {
  const lines = body.split(/\r?\n/)
  const sections: PrivacySection[] = []
  let current: PrivacySection | null = null

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines at top level; they just separate blocks.
    if (line.trim() === '') {
      i += 1
      continue
    }

    const heading = parseHeading(line)
    if (heading) {
      if (heading.level === 2) {
        current = {
          id: heading.id,
          ordinal: heading.ordinal,
          heading: heading.heading,
          fullHeading: heading.fullHeading,
          blocks: [],
          subsections: [],
        }
        sections.push(current)
      } else if (current) {
        current.blocks.push({ type: 'h3', id: heading.id, text: heading.heading })
        current.subsections.push({ id: heading.id, heading: heading.heading })
      }
      i += 1
      continue
    }

    // Table block — starts with '|' and the next line is a separator.
    if (current && line.trim().startsWith('|') && /\|.*\|/.test(line)) {
      const tableLines: string[] = [line]
      let j = i + 1
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j])
        j += 1
      }
      const table = parseTable(tableLines)
      if (table) {
        current.blocks.push(table)
        i = j
        continue
      }
    }

    // Paragraph — consume consecutive non-blank, non-heading, non-table lines.
    if (current) {
      const paraLines: string[] = [line]
      let j = i + 1
      while (
        j < lines.length &&
        lines[j].trim() !== '' &&
        !HEADING_RE.test(lines[j]) &&
        !lines[j].trim().startsWith('|')
      ) {
        paraLines.push(lines[j])
        j += 1
      }
      current.blocks.push({
        type: 'paragraph',
        children: parseInline(paraLines.join(' ').replace(/\s+/g, ' ').trim()),
      })
      i = j
      continue
    }

    i += 1
  }

  return sections
}

// ---------------------------------------------------------------------------
// Memoized public API
// ---------------------------------------------------------------------------

let cached: PrivacyDocument | null = null

export function getPrivacyDocument(): PrivacyDocument {
  if (cached) return cached
  const raw = fs.readFileSync(MDX_PATH, 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const sections = parseBody(body)
  cached = { frontmatter: data, sections }
  return cached
}

export function getPrivacyMetadata(): PrivacyFrontmatter {
  return getPrivacyDocument().frontmatter
}

/**
 * Human-friendly "April 1, 2026" formatting for the Last Updated badge.
 * Uses a fixed locale so output is deterministic at build time.
 */
export function formatLastUpdated(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
