/**
 * DialogueSpaceScene — Sacred banyan grove for intimate divine dialogue.
 *
 * A WARM, lit clearing beneath a great banyan tree. Golden-green light
 * filters through leaves, warm fireflies drift lazily, soft green
 * leaves fall. The sacred mandala glows with golden warmth.
 *
 * Atmosphere: Intimate, protected, warm. Like sitting by a sacred fire.
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

/** Rich green ground, not near-black */
function ForestGround() {
  return (
    <Plane args={[60, 60, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <meshStandardMaterial color="#1a3818" roughness={0.92} metalness={0.02} />
    </Plane>
  )
}

/** Visible warm banyan tree with golden light filtering through */
function BanyanTree() {
  return (
    <group position={[0, 0, -6]}>
      {/* Main trunk — visible warm brown */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.7, 1.2, 7, 8]} />
        <meshStandardMaterial color="#4a2a12" roughness={0.95} />
      </mesh>
      {/* Aerial roots — more visible */}
      {[
        { x: -1.0, z: -0.3 }, { x: 0.8, z: 0.2 }, { x: -0.6, z: 0.5 },
        { x: 1.1, z: -0.4 }, { x: -0.3, z: -0.7 }, { x: 0.5, z: 0.6 },
      ].map((r, i) => (
        <mesh key={i} position={[r.x, 2.5, r.z]}>
          <cylinderGeometry args={[0.03, 0.06, 5, 4]} />
          <meshStandardMaterial color="#3a2010" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Canopy — warmer green, more visible */}
      <Sphere args={[7, 16, 16]} position={[0, 8, 0]}>
        <meshStandardMaterial
          color="#1a4a1a"
          emissive="#0a2a0a"
          emissiveIntensity={0.1}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </Sphere>
      <Sphere args={[5, 12, 12]} position={[0, 7.5, 0]}>
        <meshStandardMaterial
          color="#2a5a2a"
          emissive="#1a3a1a"
          emissiveIntensity={0.08}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Sphere>
      {/* STRONG golden light filtering through leaves */}
      <pointLight position={[0, 9, 0]} intensity={3.5} color="#ffd700" distance={22} decay={1.5} />
      <pointLight position={[-2.5, 7, 1.5]} intensity={0.8} color="#ffcc44" distance={10} decay={2} />
      <pointLight position={[2.5, 7, -1.5]} intensity={0.8} color="#ffcc44" distance={10} decay={2} />
    </group>
  )
}

/** Sacred meditation mandala — warm golden glow */
function SacredMandala() {
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!innerRef.current) return
    innerRef.current.rotation.z = clock.elapsedTime * 0.02
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Stone platform — lighter, visible */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.15, 32]} />
        <meshStandardMaterial color="#6a6a5a" roughness={0.85} metalness={0.08} />
      </mesh>
      {/* Sacred geometry ring — golden, visible */}
      <mesh ref={innerRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 2.2, 8]} />
        <meshStandardMaterial
          color="#d4a44c"
          emissive="#ffd700"
          emissiveIntensity={0.25}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner octagram */}
      <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[0.3, 1.2, 8]} />
        <meshStandardMaterial
          color="#e4b44c"
          emissive="#ffd700"
          emissiveIntensity={0.18}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Center light — warm and bright */}
      <pointLight position={[0, 0.3, 0]} intensity={1.0} color="#ffd700" distance={5} decay={2} />
    </group>
  )
}

/** Bright fireflies — golden, warm, clearly visible */
function Fireflies() {
  const ref = useRef<THREE.Points>(null)
  const count = 80

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (seeded(i + 200) - 0.5) * 14
      if (axis === 1) return 0.5 + seeded(i + 400) * 6
      return (seeded(i + 600) - 0.5) * 14 - 4
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const t = clock.elapsedTime * 0.4 + i * 0.6
      pos[i * 3] += Math.sin(t) * 0.003
      pos[i * 3 + 1] += Math.cos(t * 0.6) * 0.002
      pos[i * 3 + 2] += Math.sin(t * 0.4) * 0.002
    }
    ref.current.geometry.attributes.position.needsUpdate = true

    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.65 + Math.sin(clock.elapsedTime * 0.8) * 0.15
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffee66"
        size={0.08}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Gentle green leaves drifting down */
function FallingLeaves() {
  const ref = useRef<THREE.Points>(null)
  const count = 35

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 800) - 0.5) * 8
      pos[i * 3 + 1] = 3 + seeded(i + 900) * 5
      pos[i * 3 + 2] = (seeded(i + 1000) - 0.5) * 8 - 5
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 0.003
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.5 + i * 2) * 0.003
      if (pos[i * 3 + 1] < -0.1) pos[i * 3 + 1] = 7 + seeded(i + 900) * 3
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#aacc55" size={0.08} transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

export default function DialogueSpaceScene() {
  return (
    <group>
      <ForestGround />
      <BanyanTree />
      <SacredMandala />
      <Fireflies />
      <FallingLeaves />

      {/* STRONG warm golden ambient — forest should feel LIT */}
      <pointLight position={[4, 5, 3]} intensity={1.2} color="#ffcc66" distance={20} decay={1.5} />
      <pointLight position={[-4, 5, 3]} intensity={1.2} color="#ffcc66" distance={20} decay={1.5} />
      <pointLight position={[0, 1, 5]} intensity={0.4} color="#ffeedd" distance={10} decay={2} />

      {/* Base ambient — warm green, not pitch black */}
      <ambientLight intensity={0.15} color="#2a3a1a" />

      <fog attach="fog" args={['#0a1808', 10, 45]} />
    </group>
  )
}
