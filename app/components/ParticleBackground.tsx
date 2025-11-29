'use client'

import Particles from 'react-tsparticles'
import type { ISourceOptions } from 'tsparticles-engine'

const particleOptions: ISourceOptions = {
  fpsLimit: 30,
  fullScreen: false,
  background: {
    color: 'transparent',
  },
  particles: {
    color: { value: '#00d4ff' },
    links: { enable: true, color: '#ff4dff', opacity: 0.45, width: 1 },
    move: { enable: true, speed: 2.2 },
    number: { value: 45, density: { enable: true, area: 600 } },
    opacity: { value: 0.8 },
    size: { value: { min: 2, max: 5 } },
    shape: { type: 'circle' },
  },
}

export function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Particles id="mv-particles" options={particleOptions} className="h-full w-full" />
      <div className="absolute inset-0 bg-aurora-grid opacity-70 mix-blend-screen" aria-hidden />
    </div>
  )
}
