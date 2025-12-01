import { promises as fs } from 'fs'
import { NextResponse } from 'next/server'
import { join } from 'path'

type SyncPayload = {
  id: string
  createdAt: string
  cipher: { s: string; i: string; c: string }
  status?: 'pending' | 'synced' | 'failed'
}

const FILE_PATH = join(process.cwd(), 'data', 'journal-sync.json')

export async function POST(request: Request) {
  const body = await request.json()
  const items = Array.isArray(body.items) ? (body.items as SyncPayload[]) : []
  if (items.length === 0) {
    return NextResponse.json({ stored: 0 }, { status: 200 })
  }

  const entries = items.map(item => ({
    id: item.id,
    createdAt: item.createdAt,
    cipher: item.cipher,
  }))

  await fs.mkdir(join(process.cwd(), 'data'), { recursive: true })

  let existing: SyncPayload[] = []
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.entries)) existing = parsed.entries
  } catch (error) {
    existing = []
  }

  const merged = [...entries, ...existing].slice(0, 500)

  await fs.writeFile(
    FILE_PATH,
    JSON.stringify(
      {
        savedAt: new Date().toISOString(),
        entries: merged,
      },
      null,
      2,
    ),
    'utf-8',
  )

  return NextResponse.json({ stored: entries.length, total: merged.length })
}
