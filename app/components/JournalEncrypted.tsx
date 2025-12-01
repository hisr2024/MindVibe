'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { CipherBlob, KeyEnvelope } from '../lib/journalCrypto'
import {
  decryptJournalEntry,
  encryptJournalEntry,
  hasDistressSignal,
  loadEnvelopeFromStorage,
  materializeEnvelope,
  rotateEnvelope,
} from '../lib/journalCrypto'

type Entry = {
  title?: string
  body: string
  at: string
}

type SyncPayload = {
  id: string
  createdAt: string
  cipher: CipherBlob
  status: 'pending' | 'synced' | 'failed'
  crisisFlagged?: boolean
  keyId?: string
}

const PASS_MIN_LENGTH = 12
const PASS_FORGET_MS = 10 * 60 * 1000

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

export default function JournalEncrypted() {
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cipherList, setCipherList] = useLocalState<CipherBlob[]>('aadi_journal_cipher', [])
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [syncQueue, setSyncQueue] = useLocalState<SyncPayload[]>('mv_journal_sync_queue', [])
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [keyEnvelope, setKeyEnvelope] = useLocalState<KeyEnvelope | null>('mv_journal_key_envelope', loadEnvelopeFromStorage())
  const [distressDetected, setDistressDetected] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const passTimeout = useRef<number | null>(null)

  const resetPassExpiry = useCallback(() => {
    if (passTimeout.current) window.clearTimeout(passTimeout.current)
    passTimeout.current = window.setTimeout(() => setPass(''), PASS_FORGET_MS)
  }, [])

  const ensureKey = useCallback(async () => {
    if (!pass) {
      setPassError('Passphrase is required to encrypt your journal.')
      throw new Error('missing-passphrase')
    }
    if (pass.length < PASS_MIN_LENGTH) {
      setPassError(`Passphrase must be at least ${PASS_MIN_LENGTH} characters.`)
      throw new Error('weak-passphrase')
    }
    const { envelope } = await materializeEnvelope(pass, keyEnvelope)
    setKeyEnvelope(envelope)
    setPassError(null)
    resetPassExpiry()
    return { envelope }
  }, [keyEnvelope, pass, resetPassExpiry])

  async function addEntry() {
    if (!body.trim()) return
    try {
      const { envelope } = await ensureKey()
      const payload: Entry = { title: title.trim() || undefined, body: body.trim(), at: new Date().toISOString() }
      const { blob, envelope: persistedEnvelope } = await encryptJournalEntry(
        JSON.stringify(payload),
        pass,
        envelope,
      )
      const crisisFlagged = hasDistressSignal(payload.body)
      setKeyEnvelope(persistedEnvelope)
      setCipherList([blob, ...cipherList])
      setSyncQueue([
        {
          id: crypto.randomUUID(),
          createdAt: payload.at,
          cipher: blob,
          status: 'pending',
          crisisFlagged,
          keyId: persistedEnvelope.keyId,
        },
        ...syncQueue,
      ])
      setDistressDetected(crisisFlagged)
      setTitle('')
      setBody('')
    } catch (error) {
      setSyncMessage('Unable to encrypt entry. Confirm your passphrase meets the strength requirements.')
    }
  }

  async function tryDecryptAll() {
    if (!pass) return setEntries(null)
    try {
      const { envelope } = await ensureKey()
      const out: Entry[] = []
      for (const b of cipherList) out.push(JSON.parse(await decryptJournalEntry(b, pass, envelope)))
      setEntries(out)
    } catch (error) {
      setEntries(null)
      setPassError('Wrong passphrase or corrupted data')
    }
  }

  async function rotateKeyLocally() {
    if (!pass) {
      setPassError('Enter your passphrase to rotate the key securely.')
      return
    }
    const { envelope } = await rotateEnvelope(pass)
    setKeyEnvelope(envelope)
    setSyncMessage('Encryption key rotated. New entries will use the updated envelope.')
  }

  function exportFile() {
    const data = JSON.stringify({ version: 2, envelope: keyEnvelope, entries: cipherList })
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
        if (obj.envelope) setKeyEnvelope(obj.envelope)
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
    if (!pass) {
      setEntries(null)
      return
    }
    if (pass.length < PASS_MIN_LENGTH) {
      setEntries(null)
      setPassError(`Passphrase must be at least ${PASS_MIN_LENGTH} characters.`)
      return
    }
    void tryDecryptAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pass, cipherList])

  useEffect(() => {
    setDistressDetected(hasDistressSignal(body))
  }, [body])

  useEffect(() => {
    const setNetwork = () => setOnline(navigator.onLine)
    setNetwork()
    window.addEventListener('online', setNetwork)
    window.addEventListener('offline', setNetwork)
    return () => {
      window.removeEventListener('online', setNetwork)
      window.removeEventListener('offline', setNetwork)
    }
  }, [])

  useEffect(() => {
    if (online && syncQueue.some(item => item.status === 'pending')) {
      void syncQueued()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  useEffect(() => {
    return () => {
      if (passTimeout.current) window.clearTimeout(passTimeout.current)
    }
  }, [])

  async function syncQueued() {
    if (!online || syncQueue.length === 0) return
    setSyncing(true)
    setSyncMessage('')
    try {
      const pending = syncQueue.filter(item => item.status !== 'synced')
      if (pending.length === 0) {
        setSyncing(false)
        return
      }
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pending }),
      })
      if (!res.ok) throw new Error('Failed to sync')
      const updated: SyncPayload[] = syncQueue.map(item => ({ ...item, status: 'synced' }))
      setSyncQueue(updated)
      setSyncMessage('Entries synced securely. Your ciphertext stays encrypted end-to-end.')
    } catch (error) {
      const updated: SyncPayload[] = syncQueue.map(item => ({ ...item, status: item.status === 'synced' ? 'synced' : 'failed' }))
      setSyncQueue(updated)
      setSyncMessage('Offline or sync failed. We will retry when you are back online.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="space-y-4 text-orange-50">
      <div
        className={`flex items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-sm ${
          online
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-50'
            : 'border-orange-500/40 bg-orange-500/10 text-orange-50'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="space-y-1">
          <p className="font-semibold">{online ? 'Offline caching ready' : 'You are offline; journaling still works.'}</p>
          <p className="text-xs opacity-90">
            Entries are encrypted locally; queued ciphertext will sync to the server endpoint when you reconnect.
          </p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em]">
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      {distressDetected && (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-50" role="alert">
          <p className="font-semibold">Safety first</p>
          <p className="text-red-100/80">
            Distress language detected in your draft. If you need urgent help, contact 988 (US), text HOME to 741741, or visit
            findahelpline.com. Your text stays encrypted locally.
          </p>
        </div>
      )}

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-5">
        <h2 className="text-lg font-semibold">Encrypted Journal</h2>
        <p className="text-sm text-orange-100/80">Protected with AES-GCM; your passphrase never leaves this device.</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Passphrase</span>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="mt-1 block w-64 rounded-2xl border border-orange-500/25 bg-slate-950/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/70"
              aria-label="Journal passphrase"
              placeholder={`Minimum ${PASS_MIN_LENGTH} characters`}
            />
          </label>
          <div className="space-y-1 text-xs text-orange-100/70">
            <p>Your passphrase is never stored and clears after a few minutes of inactivity.</p>
            <p className="text-orange-200/80">Key fingerprint: {keyEnvelope?.fingerprint?.slice(0, 18) ?? 'unverified'}</p>
            {passError && <p className="text-red-300">{passError}</p>}
          </div>
          <button
            type="button"
            onClick={rotateKeyLocally}
            className="rounded-2xl border border-orange-500/30 px-4 py-2 text-xs font-semibold text-orange-50 transition hover:bg-orange-500/10"
          >
            Rotate encryption key
          </button>
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
            disabled={!pass || pass.length < PASS_MIN_LENGTH || !body.trim()}
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

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-5 space-y-3" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Offline queue</h3>
            <p className="text-sm text-orange-100/80">Ciphertext is queued locally until it syncs to the journal endpoint.</p>
          </div>
          <button
            onClick={syncQueued}
            disabled={syncQueue.length === 0 || syncing}
            className="rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync queued securely'}
          </button>
        </div>
        {syncQueue.length === 0 && <p className="text-sm text-orange-100/70">No queued items. Add an entry to populate the queue.</p>}
        {syncQueue.length > 0 && (
          <ul className="space-y-2 text-sm">
            {syncQueue.map(item => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-orange-500/20 bg-black/50 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-orange-50">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="text-orange-100/70">Encrypted block ready to sync.</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                    item.status === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-100'
                      : item.status === 'failed'
                        ? 'bg-orange-500/20 text-orange-50'
                        : 'bg-orange-400/20 text-orange-50'
                  }`}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {syncMessage && <p className="text-xs text-orange-100/70">{syncMessage}</p>}
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
