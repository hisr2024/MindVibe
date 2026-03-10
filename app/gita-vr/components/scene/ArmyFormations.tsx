/**
 * ArmyFormations — Instanced army silhouettes for Kurukshetra
 *
 * Uses InstancedMesh for performance: hundreds of soldier silhouettes
 * on both sides of the battlefield. Low detail, hidden partially by fog.
 * Pandava army (left/blue) and Kaurava army (right/red).
 */

'use client'

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

interface ArmyProps {
  side: 'pandava' | 'kaurava'
  count?: number
}

function ArmyGroup({ side, count = 150 }: ArmyProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const spearRef = useRef<THREE.InstancedMesh>(null)

  const baseX = side === 'pandava' ? -60 : 60
  const color = side === 'pandava' ? '#2a3a5c' : '#5c2a2a'

  const matrices = useMemo(() => {
    const soldierMatrices: THREE.Matrix4[] = []
    const spearMatrices: THREE.Matrix4[] = []
    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 15)
      const col = i % 15
      const xOffset = baseX + (side === 'pandava' ? -row * 4 : row * 4)
      const zOffset = (col - 7.5) * 3 + (Math.random() - 0.5) * 1.5

      // Soldier body
      dummy.position.set(xOffset + (Math.random() - 0.5), 0.5, zOffset)
      dummy.scale.setScalar(0.8 + Math.random() * 0.3)
      dummy.updateMatrix()
      soldierMatrices.push(dummy.matrix.clone())

      // Spear
      dummy.position.set(xOffset + (Math.random() - 0.5), 2.0, zOffset)
      dummy.scale.set(1, 1.5 + Math.random() * 0.5, 1)
      dummy.updateMatrix()
      spearMatrices.push(dummy.matrix.clone())
    }

    return { soldierMatrices, spearMatrices }
  }, [count, baseX, side])

  useEffect(() => {
    if (meshRef.current) {
      matrices.soldierMatrices.forEach((matrix, i) => {
        meshRef.current!.setMatrixAt(i, matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }
    if (spearRef.current) {
      matrices.spearMatrices.forEach((matrix, i) => {
        spearRef.current!.setMatrixAt(i, matrix)
      })
      spearRef.current.instanceMatrix.needsUpdate = true
    }
  }, [matrices])

  return (
    <group>
      {/* Soldier bodies */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <capsuleGeometry args={[0.2, 0.6, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </instancedMesh>

      {/* Spears */}
      <instancedMesh ref={spearRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.02, 0.015, 1.5, 4]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
      </instancedMesh>

      {/* Battle flags */}
      {[0, 1, 2].map((i) => {
        const flagZ = (i - 1) * 15
        const flagX = baseX + (side === 'pandava' ? -8 : 8)
        const flagColor = side === 'pandava' ? '#3a5a9c' : '#9c3a3a'
        return (
          <group key={i} position={[flagX, 0, flagZ]}>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 6, 6]} />
              <meshStandardMaterial color="#666" metalness={0.5} />
            </mesh>
            <mesh position={[0.3, 5.5, 0]}>
              <planeGeometry args={[0.8, 0.6]} />
              <meshStandardMaterial
                color={flagColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function ArmyFormations() {
  return (
    <group>
      <ArmyGroup side="pandava" count={150} />
      <ArmyGroup side="kaurava" count={150} />
    </group>
  )
}
