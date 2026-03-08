/**
 * i18n Translation Completeness Checker
 *
 * Compares all locale JSON bundles against the English (source) locale.
 * Reports missing keys, extra keys, and completion percentage per locale.
 *
 * Usage:
 *   npx ts-node scripts/i18n-check.ts                 # Check all locales
 *   npx ts-node scripts/i18n-check.ts --validate-icu  # Also validate ICU syntax
 *   npx ts-node scripts/i18n-check.ts --fail-on-missing  # Exit 1 if any key missing
 *
 * Exit codes:
 *   0 = All translations complete (or warnings only)
 *   1 = Missing translations found (with --fail-on-missing)
 */

import * as fs from 'fs'
import * as path from 'path'

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const LOCALES_DIR = path.resolve(__dirname, '..', 'locales')
const SOURCE_LOCALE = 'en'

// Namespaces that must exist for each locale
const REQUIRED_NAMESPACES = [
  'common',
  'home',
  'kiaan',
  'dashboard',
  'features',
  'navigation',
  'errors',
  'divine',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Recursively flatten a nested JSON object into dot-notation keys. */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

/** Load a JSON file and return its contents, or null if file missing. */
function loadJson(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Basic ICU MessageFormat validation (checks balanced braces). */
function validateIcu(value: string): string | null {
  let depth = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '{') depth++
    if (value[i] === '}') depth--
    if (depth < 0) return `Unbalanced closing brace at position ${i}`
  }
  if (depth !== 0) return `${depth} unclosed brace(s)`
  return null
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

interface LocaleReport {
  locale: string
  totalSourceKeys: number
  presentKeys: number
  missingKeys: string[]
  extraKeys: string[]
  icuErrors: Array<{ key: string; error: string }>
  completionPct: number
}

function checkLocale(
  locale: string,
  sourceKeysByNs: Map<string, string[]>,
  validateIcuFlag: boolean,
): LocaleReport {
  let totalSourceKeys = 0
  let presentKeys = 0
  const missingKeys: string[] = []
  const extraKeys: string[] = []
  const icuErrors: Array<{ key: string; error: string }> = []

  for (const ns of REQUIRED_NAMESPACES) {
    const sourceKeys = sourceKeysByNs.get(ns) ?? []
    totalSourceKeys += sourceKeys.length

    const localeFile = path.join(LOCALES_DIR, locale, `${ns}.json`)
    const localeData = loadJson(localeFile)

    if (!localeData) {
      // Entire namespace file missing
      missingKeys.push(...sourceKeys.map((k) => `${ns}:${k}`))
      continue
    }

    const localeKeys = new Set(flattenKeys(localeData))
    const sourceKeySet = new Set(sourceKeys)

    // Check for missing keys
    for (const key of sourceKeys) {
      if (localeKeys.has(key)) {
        presentKeys++
      } else {
        missingKeys.push(`${ns}:${key}`)
      }
    }

    // Check for extra keys (in locale but not in source)
    for (const key of localeKeys) {
      if (!sourceKeySet.has(key)) {
        extraKeys.push(`${ns}:${key}`)
      }
    }

    // Validate ICU syntax if requested
    if (validateIcuFlag) {
      const flatValues = flattenValues(localeData)
      for (const [key, value] of Object.entries(flatValues)) {
        if (typeof value === 'string' && value.includes('{')) {
          const error = validateIcu(value)
          if (error) {
            icuErrors.push({ key: `${ns}:${key}`, error })
          }
        }
      }
    }
  }

  const completionPct = totalSourceKeys > 0
    ? Math.round((presentKeys / totalSourceKeys) * 1000) / 10
    : 100

  return { locale, totalSourceKeys, presentKeys, missingKeys, extraKeys, icuErrors, completionPct }
}

/** Flatten object to key-value pairs (leaf values only). */
function flattenValues(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenValues(value as Record<string, unknown>, fullKey))
    } else {
      result[fullKey] = value
    }
  }
  return result
}

function main() {
  const args = process.argv.slice(2)
  const validateIcuFlag = args.includes('--validate-icu')
  const failOnMissing = args.includes('--fail-on-missing')

  // Load source (English) keys
  const sourceKeysByNs = new Map<string, string[]>()
  let totalSourceKeys = 0

  for (const ns of REQUIRED_NAMESPACES) {
    const sourceFile = path.join(LOCALES_DIR, SOURCE_LOCALE, `${ns}.json`)
    const sourceData = loadJson(sourceFile)
    if (!sourceData) {
      console.error(`ERROR: Source file missing: ${sourceFile}`)
      process.exit(1)
    }
    const keys = flattenKeys(sourceData)
    sourceKeysByNs.set(ns, keys)
    totalSourceKeys += keys.length
  }

  console.log(`\n  i18n Translation Check`)
  console.log(`  Source locale: ${SOURCE_LOCALE} (${totalSourceKeys} keys across ${REQUIRED_NAMESPACES.length} namespaces)\n`)

  // Discover all locale directories
  const localeDirs = fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== SOURCE_LOCALE)
    .map((d) => d.name)
    .sort()

  if (localeDirs.length === 0) {
    console.log('  No translation locales found (only source locale exists).\n')
    process.exit(0)
  }

  // Check each locale
  const reports: LocaleReport[] = []
  let hasMissing = false

  for (const locale of localeDirs) {
    const report = checkLocale(locale, sourceKeysByNs, validateIcuFlag)
    reports.push(report)
    if (report.missingKeys.length > 0) hasMissing = true
  }

  // Print results
  console.log('  %-8s  %6s  %8s  %7s  %5s', 'Locale', 'Keys', 'Missing', 'Extra', '%')
  console.log('  ' + '-'.repeat(50))

  for (const r of reports) {
    const status = r.completionPct === 100 ? 'PASS' : r.completionPct >= 80 ? 'WARN' : 'FAIL'
    const icon = status === 'PASS' ? '[ok]' : status === 'WARN' ? '[!!]' : '[XX]'

    console.log(
      `  ${icon} %-6s  %6d  %8d  %7d  %5s`,
      r.locale,
      r.presentKeys,
      r.missingKeys.length,
      r.extraKeys.length,
      `${r.completionPct}%`,
    )
  }

  // Print details for incomplete locales
  const incomplete = reports.filter((r) => r.missingKeys.length > 0)
  if (incomplete.length > 0) {
    console.log('\n  Missing keys by locale:')
    for (const r of incomplete) {
      console.log(`\n  ${r.locale} (${r.missingKeys.length} missing):`)
      // Show first 10 missing keys
      const shown = r.missingKeys.slice(0, 10)
      for (const key of shown) {
        console.log(`    - ${key}`)
      }
      if (r.missingKeys.length > 10) {
        console.log(`    ... and ${r.missingKeys.length - 10} more`)
      }
    }
  }

  // Print ICU errors
  const withIcuErrors = reports.filter((r) => r.icuErrors.length > 0)
  if (withIcuErrors.length > 0) {
    console.log('\n  ICU MessageFormat errors:')
    for (const r of withIcuErrors) {
      for (const { key, error } of r.icuErrors) {
        console.log(`    ${r.locale} → ${key}: ${error}`)
      }
    }
  }

  // Summary
  const avgCompletion = reports.reduce((sum, r) => sum + r.completionPct, 0) / reports.length
  console.log(`\n  Summary: ${reports.length} locales, average completion ${Math.round(avgCompletion * 10) / 10}%\n`)

  if (failOnMissing && hasMissing) {
    console.error('  FAILED: Missing translations detected. Use --fail-on-missing to enforce.\n')
    process.exit(1)
  }
}

main()
