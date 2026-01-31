import fs from 'fs/promises'
import path from 'path'
import { loadGitaCorpus, GitaChunk } from './gitaCorpus'

type VectorIndex = {
  model: string
  createdAt: string
  chunks: GitaChunk[]
  embeddings: number[][]
}

type RetrievalResult = {
  chunks: GitaChunk[]
  confidence: number
  strategy: 'embeddings' | 'bm25'
}

type KeywordDoc = {
  chunk: GitaChunk
  termFreqs: Map<string, number>
  length: number
}

type KeywordIndex = {
  docs: KeywordDoc[]
  avgDocLength: number
  idf: Map<string, number>
}

const INDEX_PATH = path.join(process.cwd(), 'data', 'viyoga', 'gita_index.json')
const EMBEDDING_MODEL = process.env.VIYOGA_EMBEDDING_MODEL || 'text-embedding-3-small'
const BM25_K1 = 1.6
const BM25_B = 0.75

let cachedChunks: GitaChunk[] | null = null
let cachedVectorIndex: VectorIndex | null = null
let cachedKeywordIndex: KeywordIndex | null = null

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
}

async function loadVectorIndex(): Promise<VectorIndex | null> {
  if (cachedVectorIndex) return cachedVectorIndex
  try {
    const raw = await fs.readFile(INDEX_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as VectorIndex
    if (!Array.isArray(parsed.chunks) || !Array.isArray(parsed.embeddings)) return null
    if (parsed.chunks.length !== parsed.embeddings.length) return null
    cachedVectorIndex = parsed
    return parsed
  } catch {
    return null
  }
}

async function loadChunks(): Promise<GitaChunk[]> {
  if (cachedChunks) return cachedChunks
  cachedChunks = await loadGitaCorpus()
  return cachedChunks
}

async function loadKeywordIndex(): Promise<KeywordIndex> {
  if (cachedKeywordIndex) return cachedKeywordIndex
  const chunks = await loadChunks()
  const docs: KeywordDoc[] = []
  const docFrequencies = new Map<string, number>()
  let totalLength = 0

  for (const chunk of chunks) {
    const tokens = tokenize(chunk.text)
    const termFreqs = new Map<string, number>()
    tokens.forEach(token => {
      termFreqs.set(token, (termFreqs.get(token) || 0) + 1)
    })

    const uniqueTokens = new Set(tokens)
    uniqueTokens.forEach(token => {
      docFrequencies.set(token, (docFrequencies.get(token) || 0) + 1)
    })

    totalLength += tokens.length
    docs.push({ chunk, termFreqs, length: tokens.length })
  }

  const avgDocLength = docs.length ? totalLength / docs.length : 0
  const idf = new Map<string, number>()
  const docCount = docs.length || 1

  for (const [token, freq] of docFrequencies.entries()) {
    const value = Math.log((docCount - freq + 0.5) / (freq + 0.5) + 1)
    idf.set(token, value)
  }

  cachedKeywordIndex = { docs, avgDocLength, idf }
  return cachedKeywordIndex
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (!normA || !normB) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function embedQuery(query: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query,
    }),
  })

  if (!response.ok) return null
  const payload = await response.json()
  const embedding = payload?.data?.[0]?.embedding
  return Array.isArray(embedding) ? (embedding as number[]) : null
}

async function retrieveWithEmbeddings(query: string, k: number): Promise<RetrievalResult | null> {
  const vectorIndex = await loadVectorIndex()
  if (!vectorIndex) return null

  const embedding = await embedQuery(query)
  if (!embedding) return null

  const scored = vectorIndex.chunks.map((chunk, idx) => ({
    chunk,
    score: cosineSimilarity(embedding, vectorIndex.embeddings[idx]),
  }))

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, k)
  const confidence = top.length ? top[0].score : 0

  return {
    chunks: top.map(item => item.chunk),
    confidence,
    strategy: 'embeddings',
  }
}

async function retrieveWithBm25(query: string, k: number): Promise<RetrievalResult> {
  const index = await loadKeywordIndex()
  const tokens = tokenize(query)
  const scores = index.docs.map(doc => {
    let score = 0
    tokens.forEach(token => {
      const tf = doc.termFreqs.get(token) || 0
      if (!tf) return
      const idf = index.idf.get(token) || 0
      const numerator = tf * (BM25_K1 + 1)
      const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (doc.length / (index.avgDocLength || 1)))
      score += idf * (numerator / denominator)
    })
    return { chunk: doc.chunk, score }
  })

  scores.sort((a, b) => b.score - a.score)
  const top = scores.slice(0, k)
  const topScore = top.length ? top[0].score : 0
  const confidence = topScore ? topScore / (topScore + 1) : 0

  return {
    chunks: top.map(item => item.chunk),
    confidence,
    strategy: 'bm25',
  }
}

export async function retrieveGitaChunks(query: string, k = 6): Promise<RetrievalResult> {
  const embeddingsResult = await retrieveWithEmbeddings(query, k)
  if (embeddingsResult) return embeddingsResult

  return retrieveWithBm25(query, k)
}

export function getExpandedQuery(query: string) {
  return `${query} detachment karma yoga sakshi witness consciousness Bhagavad Gita`
}
