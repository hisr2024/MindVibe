'use client'

import { useEffect, useRef, useState } from 'react'

type Entry = {
  title?: string
  body: string
  at: string
}

type CipherBlob = { s: string; i: string; c: string }

function useLocalState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }, [key, val])

  return [val, setVal] as const
}

function toArrayBuffer(source: BufferSource): ArrayBuffer {
  if (source instanceof ArrayBuffer) return source

  if (ArrayBuffer.isView(source)) {
    const { buffer, byteOffset, byteLength } = source

    if (buffer instanceof ArrayBuffer) {
      return buffer.slice(byteOffset, byteOffset + byteLength)
    }

    return new Uint8Array(buffer, byteOffset, byteLength).slice().buffer
  }

  throw new Error('Unsupported buffer source')
}

async function deriveKey(passphrase: string, saltSource: BufferSource) {
  const salt = toArrayBuffer(saltSource)
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

const b64 = (a: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(a)))
const ub64 = (s: string) => new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)))

async function encryptText(plain: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  return { s: b64(salt), i: b64(iv), c: b64(ct) }
}

async function decryptText(blob: CipherBlob, passphrase: string) {
  const salt = ub64(blob.s)
  const iv = ub64(blob.i)
  const ct = ub64(blob.c)
  const key = await deriveKey(passphrase, salt)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

export default function JournalEncrypted() {
  const [pass, setPass] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cipherList, setCipherList] = useLocalState<CipherBlob[]>('aadi_journal_cipher', [])
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function addEntry() {
    if (!pass || !body.trim()) return
    const payload: Entry = { title: title.trim() || undefined, body: body.trim(), at: new Date().toISOString() }
    const blob = await encryptText(JSON.stringify(payload), pass)
    setCipherList([blob, ...cipherList])
    setTitle('')
    setBody('')
  }

  async function tryDecryptAll() {
    if (!pass) return setEntries(null)
    try {
      const out: Entry[] = []
      for (const b of cipherList) out.push(JSON.parse(await decryptText(b, pass)))
      setEntries(out)
    } catch {
      setEntries(null)
      alert('Wrong passphrase or corrupted data')
    }
  }

  function exportFile() {
    const data = JSON.stringify({ version: 1, entries: cipherList })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `mindvibe-journal-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const obj = JSON.parse(String(r.result || '{}'))
        if (Array.isArray(obj.entries)) setCipherList(obj.entries.concat(cipherList))
        else alert('Invalid file')
      } catch {
        alert('Invalid file')
      }
    }
    r.readAsText(f)
    if (fileRef.current) fileRef.current.value = ''
  }

  useEffect(() => {
    tryDecryptAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pass, cipherList])

  return (
    <main className="space-y-4 text-orange-50">
      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-5">
        <h2 className="text-lg font-semibold">Encrypted Sacred Reflections</h2>
        <p className="text-sm text-orange-100/80">Protected with AES-GCM; your passphrase never leaves this device.</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Passphrase</span>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="mt-1 block w-64 rounded-2xl border border-orange-500/25 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/70"
              aria-label="Sacred Reflections passphrase"
            />
          </label>
          <div className="text-xs text-orange-100/70">Your passphrase is never stored.</div>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-5 space-y-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/70"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write privately. Data is encrypted on your device."
          className="h-40 w-full rounded-2xl border border-orange-500/25 bg-slate-950/70 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-400/70"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={!pass || !body.trim()}
            onClick={addEntry}
            className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add entry
          </button>
          <button
            onClick={exportFile}
            className="rounded-2xl border border-orange-500/25 px-4 py-2 text-sm font-semibold text-orange-50 transition hover:bg-orange-500/10"
          >
            Export
          </button>
          <label className="cursor-pointer rounded-2xl border border-orange-500/25 px-4 py-2 text-sm font-semibold text-orange-50 transition hover:bg-orange-500/10">
            Import
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importFile} />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-5">
        <h3 className="text-lg font-semibold">Entries</h3>
        {!pass && <p className="text-sm text-orange-100/70">Enter your passphrase to view entries.</p>}
        {pass && (
          <ul className="mt-3 space-y-3">
            {(entries || []).map((entry, idx) => (
              <li key={idx} className="rounded-2xl border border-orange-500/25 bg-black/60 p-3">
                <div className="text-xs text-orange-100/70">{new Date(entry.at).toLocaleString()}</div>
                {entry.title && <div className="font-semibold">{entry.title}</div>}
                <div className="whitespace-pre-wrap text-orange-50">{entry.body}</div>
              </li>
            ))}
            {pass && (entries?.length || 0) === 0 && <li className="text-sm text-orange-100/70">No entries yet.</li>}
          </ul>
        )}
      </section>
    </main>
  )
}
