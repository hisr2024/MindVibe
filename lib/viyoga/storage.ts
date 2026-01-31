import fs from 'fs/promises'
import path from 'path'

export type ViyogaSession = {
  sessionId: string
  createdAt: string
}

export type ViyogaMessage = {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
}

type ViyogaStore = {
  sessions: ViyogaSession[]
  messages: ViyogaMessage[]
}

const DATA_DIR = path.join(process.cwd(), 'data', 'viyoga')
const STORE_PATH = path.join(DATA_DIR, 'store.json')

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(STORE_PATH)
  } catch {
    const initial: ViyogaStore = { sessions: [], messages: [] }
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2))
  }
}

async function readStore(): Promise<ViyogaStore> {
  await ensureStore()
  const raw = await fs.readFile(STORE_PATH, 'utf-8')
  const parsed = JSON.parse(raw) as ViyogaStore
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
  }
}

async function writeStore(store: ViyogaStore) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2))
}

export async function ensureSession(sessionId: string) {
  const store = await readStore()
  const exists = store.sessions.some(session => session.sessionId === sessionId)
  if (!exists) {
    store.sessions.push({ sessionId, createdAt: new Date().toISOString() })
    await writeStore(store)
  }
}

export async function appendMessage(message: ViyogaMessage) {
  const store = await readStore()
  store.messages.push(message)
  await writeStore(store)
}

export async function getRecentMessages(sessionId: string, limit = 20): Promise<ViyogaMessage[]> {
  const store = await readStore()
  const messages = store.messages.filter(message => message.sessionId === sessionId)
  return messages.slice(-limit)
}
