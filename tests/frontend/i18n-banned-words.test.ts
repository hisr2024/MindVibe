/**
 * Guard test: prevents aggressive "elimination" framing from reappearing
 * in locale values.
 *
 * Scans every value in every locale JSON under locales/ and public/locales/
 * for words like "deactivate", "eliminate", "conquer", "destroy", "overcome"
 * when applied to inner states (anger, fear, desire, etc.).
 *
 * Allowed contexts:
 *  - Gita verse translations (data/gita/) — sacred text is never modified
 *  - Circumplex psychology terms ("deactivated_pleasant") — academic vocabulary
 *  - Admin account status ("account is deactivated") — standard IT terminology
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/** Words that should never appear in user-facing locale values */
const BANNED_PATTERNS = [
  /\bdeactivate\b/i,
  /\bdeactivating\b/i,
  /\beliminate\b/i,
  /\beliminating\b/i,
  /\belimination\b/i,
  /\beradicate\b/i,
  /\beradicating\b/i,
  // "conquer" + inner state / emotion / enemy context
  /\bconquer\b.*\b(inner|enem|anger|fear|desire|greed|envy|ego)\b/i,
  /\b(inner|enem|anger|fear|desire|greed|envy|ego)\b.*\bconquer\b/i,
  // "destroy" + inner state / emotion context
  /\bdestroy\b.*\b(anger|fear|desire|greed|envy|ego)\b/i,
  /\b(anger|fear|desire|greed|envy|ego)\b.*\bdestroy\b/i,
  // "overcome" + inner state / emotion context
  /\bovercom(e|ing)\b.*\b(inner|enem|anger|fear|desire|greed|envy|ego)\b/i,
  /\b(inner|enem|anger|fear|desire|greed|envy|ego)\b.*\bovercom(e|ing)\b/i,
]

/** Recursively collect all string values from a JSON object */
function collectValues(obj: unknown, keyPath = ''): Array<{ key: string; value: string }> {
  const results: Array<{ key: string; value: string }> = []

  if (typeof obj === 'string') {
    results.push({ key: keyPath, value: obj })
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => results.push(...collectValues(item, `${keyPath}[${i}]`)))
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      results.push(...collectValues(v, keyPath ? `${keyPath}.${k}` : k))
    }
  }

  return results
}

/** Recursively find all .json files in a directory */
function findJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findJsonFiles(fullPath))
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath)
    }
  }
  return files
}

describe('i18n banned words guard', () => {
  const root = path.resolve(__dirname, '../../')
  const localeDirs = [
    path.join(root, 'locales'),
    path.join(root, 'public', 'locales'),
  ]

  const localeFiles = localeDirs.flatMap(findJsonFiles)

  it('should find locale files to scan', () => {
    expect(localeFiles.length).toBeGreaterThan(0)
  })

  it('should not contain banned elimination framing in any locale value', () => {
    const violations: string[] = []

    for (const file of localeFiles) {
      const relPath = path.relative(root, file)
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'))
      const entries = collectValues(content)

      for (const { key, value } of entries) {
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.test(value)) {
            violations.push(
              `${relPath} -> "${key}": matched /${pattern.source}/ in "${value.slice(0, 80)}..."`,
            )
          }
        }
      }
    }

    if (violations.length > 0) {
      const message = [
        'Banned elimination framing found in locale files:',
        '',
        ...violations.map((v) => `  - ${v}`),
        '',
        'Use softer alternatives: "reduce the grip of", "loosen the influence of", "strengthen steadiness against"',
      ].join('\n')

      expect.fail(message)
    }
  })
})
