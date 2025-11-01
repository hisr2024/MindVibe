'use client'

import { useEffect, useRef, useState } from 'react'

export default function SOS() {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle')
  const ringRef = useRef<HTMLDivElement>(null)
  
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  
  useEffect(() => {
    const el = ringRef.current
    if (!el) return
    
    el.style.transition = 'transform 700ms'
    el.style.transform =
      phase === 'inhale'
        ? 'scale(1.1)'
        : phase === 'exhale'
        ? 'scale(0.9)'
        : 'scale(1)'
  }, [phase])
  
  async function run() {
    for (let i = 0; i < 4; i++) {
      setPhase('inhale')
      await sleep(4000)
      setPhase('hold')
      await sleep(7000)
      setPhase('exhale')
      await sleep(8000)
    }
    setPhase('idle')
  }
  
  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">SOS - Breathing Exercise</h1>
      <div
        ref={ringRef}
        className="rounded-full w-56 h-56 mx-auto border-4 border-blue-500"
      />
      <p className="text-center mt-8 text-lg">{phase}</p>
      <button
        onClick={run}
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg mx-auto block transition-colors"
      >
        Start Breathing Exercise
      </button>
    </main>
  )
}