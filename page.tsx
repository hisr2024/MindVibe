'use client'
import { useEffect, useRef, useState } from 'react'
export default function SOS(){
  const [phase,setPhase] = useState<'idle'|'inhale'|'hold'|'exhale'>('idle')
  const ringRef = useRef<HTMLDivElement>(null)
  const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms))
  useEffect(()=>{ const el=ringRef.current; if(!el) return; el.style.transition='transform 700ms'; el.style.transform=phase==='inhale'?'scale(1.1)':phase==='exhale'?'scale(0.9)':'scale(1)' },[phase])
  async function run(){ for(let i=0;i<4;i++){ setPhase('inhale'); await sleep(4000); setPhase('hold'); await sleep(7000); setPhase('exhale'); await sleep(8000);} setPhase('idle') }
  return (<main className="min-h-screen px-6 py-10"><h1 className="text-3xl font-bold mb-6">SOS</h1><div ref={ringRef} className="rounded-full w-56 h-56 mx-auto border" /><p className="text-center my-4 text-zinc-300">{phase==='idle'?'Tap start. Follow the ring.':phase}</p><div className="flex justify-center gap-3"><button onClick={run} className="rounded-2xl px-4 py-2 bg-white text-black">Start</button><button onClick={()=>setPhase('idle')} className="rounded-2xl px-4 py-2 border border-zinc-700">Reset</button></div></main>) }