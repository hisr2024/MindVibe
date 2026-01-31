import fs from 'fs/promises'
import path from 'path'

const EMBEDDING_MODEL = process.env.VIYOGA_EMBEDDING_MODEL || 'text-embedding-3-small'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DEFAULT_GITA_PATHS = ['gita_core', 'data/gita/gita_verses_starter.json']
const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.json'])
const MAX_CHUNK_SIZE = 900

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY. Cannot build Viyoga embeddings index.')
  process.exit(1)
}

function resolveCorpusRoots() {
  const envPaths = process.env.VIYOGA_GITA_PATHS
  if (envPaths) {
    return envPaths.split(',').map(item => item.trim()).filter(Boolean)
  }
  return DEFAULT_GITA_PATHS
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function collectFiles(targetPath, files = []) {
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

function chunkText(content, sourceFile) {
  const paragraphs = content.split(/\n\s*\n/)
  const chunks = []
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

function buildVerseChunk(entry, sourceFile, index) {
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

function parseJsonContent(raw, sourceFile) {
  const chunks = []
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return chunks
  }

  if (Array.isArray(parsed)) {
    parsed.forEach((entry, index) => {
      if (entry && typeof entry === 'object' && ('verse' in entry || 'english' in entry)) {
        chunks.push(buildVerseChunk(entry, sourceFile, index))
      } else {
        chunks.push({
          id: `${sourceFile}::entry-${index + 1}`,
          sourceFile,
          text: JSON.stringify(entry),
        })
      }
    })
    return chunks
  }

  if (parsed && typeof parsed === 'object') {
    return [
      {
        id: `${sourceFile}::entry-1`,
        sourceFile,
        text: JSON.stringify(parsed),
      },
    ]
  }

  return chunks
}

async function loadGitaCorpus() {
  const roots = resolveCorpusRoots()
  const files = []

  for (const root of roots) {
    const fullPath = path.join(process.cwd(), root)
    if (!(await pathExists(fullPath))) continue
    await collectFiles(fullPath, files)
  }

  const chunks = []
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf-8')
    const ext = path.extname(filePath)
    const relativePath = path.relative(process.cwd(), filePath)

    if (ext === '.json') {
      chunks.push(...parseJsonContent(raw, relativePath))
      continue
    }

    chunks.push(...chunkText(raw, relativePath))
  }

  return chunks
}

async function embedTexts(texts) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI embeddings failed: ${errorText}`)
  }

  const payload = await response.json()
  return payload.data.map(item => item.embedding)
}

async function main() {
  const chunks = await loadGitaCorpus()
  if (!chunks.length) {
    console.warn('No Gita corpus files found to index.')
    return
  }

  const embeddings = []
  const batchSize = 40
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const batchEmbeddings = await embedTexts(batch.map(chunk => chunk.text))
    embeddings.push(...batchEmbeddings)
    console.log(`Embedded ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`)
  }

  const dataDir = path.join(process.cwd(), 'data', 'viyoga')
  await fs.mkdir(dataDir, { recursive: true })
  const indexPath = path.join(dataDir, 'gita_index.json')
  await fs.writeFile(
    indexPath,
    JSON.stringify(
      {
        model: EMBEDDING_MODEL,
        createdAt: new Date().toISOString(),
        chunks,
        embeddings,
      },
      null,
      2
    )
  )

  console.log(`Saved Viyoga index to ${indexPath}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
