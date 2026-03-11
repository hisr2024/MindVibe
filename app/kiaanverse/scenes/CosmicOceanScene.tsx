/**
 * CosmicOceanScene — The infinite Kshira Sagara, milky ocean of creation.
 *
 * A luminous deep-blue ocean lit by golden celestial light from above.
 * Soft pink lotuses float with warm self-illumination. Gentle blue water
 * sparkles catch the light. Nebula mist in warm indigo-violet.
 *
 * Atmosphere: Primordial, vast, peaceful. NOT dark void.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/** Ocean surface — deep blue with visible reflective quality */
function CosmicWater() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 0.25) * 0.06
  })

  return (
    <Plane ref={meshRef} args={[200, 200, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <meshStandardMaterial
        color="#0a1540"
        emissive="#1a2a6a"
        emissiveIntensity={0.2}
        metalness={0.85}
        roughness={0.2}
        transparent
        opacity={0.95}
      />
    </Plane>
  )
}

/** Water surface sparkles — bright blue-white dots */
function WaterSparkles() {
  const ref = useRef<THREE.Points>(null)
  const count = 250

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 100) - 0.5) * 50
      pos[i * 3 + 1] = -0.42
      pos[i * 3 + 2] = (seeded(i + 200) - 0.5) * 50 - 8
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.3 + Math.sin(clock.elapsedTime * 0.4) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#88bbff"
        size={0.1}
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Floating lotus — warm glowing petals, not blobby spheres */
function FloatingLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)
  const baseY = position[1]

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.4 + position[0]) * 0.06
    ref.current.rotation.y = clock.elapsedTime * 0.04
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Lily pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial color="#1a5a2a" emissive="#0a3a1a" emissiveIntensity={0.15} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer petals — cone shapes for petal-like look */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 8) * Math.PI * 2) * 0.22, 0.06, Math.sin((i / 8) * Math.PI * 2) * 0.22]}
          rotation={[0.4, (i / 8) * Math.PI * 2, 0]}
        >
          <coneGeometry args={[0.1, 0.24, 4]} />
          <meshStandardMaterial
            color="#ffb0c8"
            emissive="#ff88a0"
            emissiveIntensity={0.45}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Inner petals */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`in-${i}`}
          position={[Math.cos((i / 5) * Math.PI * 2) * 0.1, 0.12, Math.sin((i / 5) * Math.PI * 2) * 0.1]}
          rotation={[0.3, (i / 5) * Math.PI * 2, 0]}
        >
          <coneGeometry args={[0.06, 0.16, 4]} />
          <meshStandardMaterial
            color="#ffd4e0"
            emissive="#ffb0c8"
            emissiveIntensity={0.5}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Golden center */}
      <Sphere args={[0.04, 8, 8]} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={0.8} />
      </Sphere>
      {/* Self-illumination */}
      <pointLight position={[0, 0.2, 0]} intensity={0.4} color="#ffaacc" distance={3} decay={2} />
    </group>
  )
}

/** Nebula atmosphere — warm indigo, not pitch black */
function NebulaFog() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.08 + Math.sin(clock.elapsedTime * 0.12) * 0.03
    ref.current.rotation.y = clock.elapsedTime * 0.008
  })

  return (
    <Sphere ref={ref} args={[50, 16, 16]} position={[0, 6, -8]}>
      <meshBasicMaterial color="#2a1a4a" transparent opacity={0.08} side={THREE.BackSide} />
    </Sphere>
  )
}

/** Celestial motes — bright floating stars in warm colors */
function CelestialMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 180

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = seeded(i + 4000) * Math.PI * 2
      const r = 3 + seeded(i + 5000) * 20
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = 1 + seeded(i + 6000) * 10
      pos[i * 3 + 2] = Math.sin(theta) * r - 12
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const type = seeded(i + 7000)
      if (type < 0.4) { c[i * 3] = 1; c[i * 3 + 1] = 0.88; c[i * 3 + 2] = 0.5 }
      else if (type < 0.7) { c[i * 3] = 0.5; c[i * 3 + 1] = 0.65; c[i * 3 + 2] = 1.0 }
      else { c[i * 3] = 0.8; c[i * 3 + 1] = 0.55; c[i * 3 + 2] = 1.0 }
    }
    return c
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.004
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.2 + i) * 0.002
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        transparent
        opacity={0.75}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function CosmicOceanScene() {
  return (
    <group>
      <CosmicWater />
      <WaterSparkles />

      {/* Lotus formations */}
      <FloatingLotus position={[-3, -0.3, -4]} scale={1.1} />
      <FloatingLotus position={[2.5, -0.3, -6]} />
      <FloatingLotus position={[-5.5, -0.3, -9]} scale={0.8} />
      <FloatingLotus position={[4.5, -0.3, -3]} scale={0.9} />
      <FloatingLotus position={[-1, -0.3, -12]} scale={0.6} />
      <FloatingLotus position={[6, -0.3, -8]} scale={0.7} />

      <NebulaFog />
      <CelestialMotes />

      {/* STRONG golden light from above — the divine illumination */}
      <pointLight position={[0, 16, -6]} intensity={2.5} color="#ffd700" distance={60} decay={1.2} />
      <pointLight position={[-8, 8, -12]} intensity={1.0} color="#4477cc" distance={35} decay={1.5} />
      <pointLight position={[8, 8, -12]} intensity={1.0} color="#7766bb" distance={35} decay={1.5} />
      <pointLight position={[0, 2, 4]} intensity={0.4} color="#9988cc" distance={12} decay={2} />

      {/* Base ambient */}
      <ambientLight intensity={0.12} color="#1a1a3a" />

      <fog attach="fog" args={['#0a0a22', 15, 80]} />
    </group>
  )
}
