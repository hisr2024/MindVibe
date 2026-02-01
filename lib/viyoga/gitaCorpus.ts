import fs from 'fs/promises'
import path from 'path'

export type GitaChunk = {
  id: string
  sourceFile: string
  reference?: string
  text: string
}

const DEFAULT_GITA_PATHS = ['data/gita/gita_verses_complete.json', 'data/gita/gita_verses_starter.json']
const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.json'])
const MAX_CHUNK_SIZE = 900

function resolveCorpusRoots() {
  const envPaths = process.env.VIYOGA_GITA_PATHS
  if (envPaths) {
    return envPaths.split(',').map(item => item.trim()).filter(Boolean)
  }
  return DEFAULT_GITA_PATHS
}

async function pathExists(target: string) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function collectFiles(targetPath: string, files: string[] = []) {
  const stats = await fs.stat(targetPath)
  if (stats.isFile()) {
    if (SUPPORTED_EXTENSIONS.has(path.extname(targetPath))) {
      files.push(targetPath)
    }
    return files
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const entryPath = path.join(targetPath, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(entryPath, files)
    } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }
  return files
}

function chunkText(content: string, sourceFile: string) {
  const paragraphs = content.split(/\n\s*\n/)
  const chunks: GitaChunk[] = []
  let buffer = ''
  let chunkIndex = 1

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    if (!trimmed) continue

    if (buffer.length + trimmed.length + 2 > MAX_CHUNK_SIZE) {
      chunks.push({
        id: `${sourceFile}::chunk-${chunkIndex}`,
        sourceFile,
        text: buffer.trim(),
      })
      chunkIndex += 1
      buffer = ''
    }

    buffer = buffer ? `${buffer}\n\n${trimmed}` : trimmed
  }

  if (buffer.trim()) {
    chunks.push({
      id: `${sourceFile}::chunk-${chunkIndex}`,
      sourceFile,
      text: buffer.trim(),
    })
  }

  return chunks
}

function buildVerseChunk(entry: Record<string, unknown>, sourceFile: string, index: number): GitaChunk {
  const chapter = typeof entry.chapter === 'number' ? entry.chapter : undefined
  const verse = typeof entry.verse === 'number' ? entry.verse : undefined
  const reference = chapter && verse ? `Bhagavad Gita ${chapter}.${verse}` : undefined
  const theme = typeof entry.theme === 'string' ? entry.theme : ''
  const english = typeof entry.english === 'string' ? entry.english : ''
  const transliteration = typeof entry.transliteration === 'string' ? entry.transliteration : ''
  const mentalHealth = Array.isArray(entry.mental_health_applications)
    ? entry.mental_health_applications.join(', ')
    : ''

  const textParts = [
    reference ? `${reference}.` : '',
    english,
    transliteration ? `Transliteration: ${transliteration}.` : '',
    theme ? `Theme: ${theme}.` : '',
    mentalHealth ? `Applications: ${mentalHealth}.` : '',
  ].filter(Boolean)

  return {
    id: `${sourceFile}::verse-${reference || index + 1}`,
    sourceFile,
    reference,
    text: textParts.join(' '),
  }
}

function parseJsonContent(raw: string, sourceFile: string) {
  const chunks: GitaChunk[] = []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return chunks
  }

  if (Array.isArray(parsed)) {
    parsed.forEach((entry, index) => {
      if (entry && typeof entry === 'object' && ('verse' in entry || 'english' in entry)) {
        chunks.push(buildVerseChunk(entry as Record<string, unknown>, sourceFile, index))
      } else {
        const text = JSON.stringify(entry)
        chunks.push({
          id: `${sourceFile}::entry-${index + 1}`,
          sourceFile,
          text,
        })
      }
    })
    return chunks
  }

  if (parsed && typeof parsed === 'object') {
    const text = JSON.stringify(parsed)
    return [
      {
        id: `${sourceFile}::entry-1`,
        sourceFile,
        text,
      },
    ]
  }

  return chunks
}

export async function loadGitaCorpus(): Promise<GitaChunk[]> {
  const roots = resolveCorpusRoots()
  const files: string[] = []

  for (const root of roots) {
    const fullPath = path.join(process.cwd(), root)
    if (!(await pathExists(fullPath))) continue
    await collectFiles(fullPath, files)
  }

  const chunks: GitaChunk[] = []
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf-8')
    const ext = path.extname(filePath)
    const relativePath = path.relative(process.cwd(), filePath)

    if (ext === '.json') {
      const jsonChunks = parseJsonContent(raw, relativePath)
      chunks.push(...jsonChunks)
      continue
    }

    chunks.push(...chunkText(raw, relativePath))
  }

  return chunks
}
