'use client';

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * KarmicTreeLogo - Growing Tree with Glowing Leaves
 * 
 * Features:
 * - Tree with glowing leaves
 * - Leaves sway in wind
 * - Roots pulse with energy
 * - Grows when user improves karma (controlled by growth prop)
 */

interface KarmicTreeLogoProps {
  size?: number;
  className?: string;
  growth?: number; // 0-1, controls tree size
}

function Tree({ growth = 0.7 }: { growth: number }) {
  const trunkRef = useRef<THREE.Mesh>(null);
  const leavesRef = useRef<THREE.Group>(null);
  const rootsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (leavesRef.current) {
      // Sway leaves in wind
      leavesRef.current.rotation.z = Math.sin(time * 0.8) * 0.1;
      leavesRef.current.rotation.x = Math.cos(time * 0.6) * 0.05;
    }

    if (rootsRef.current) {
      // Pulse roots with energy
      const pulseSc = 1 + Math.sin(time * 1.5) * 0.05;
      rootsRef.current.scale.setScalar(pulseSc);
    }
  });

  // Generate leaves
  const leaves = useMemo(() => {
    const temp = [];
    const leafCount = Math.floor(12 * growth);
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.2;
      const height = 0.2 + Math.random() * 0.4;
      temp.push({
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ] as [number, number, number],
      });
    }
    return temp;
  }, [growth]);

  // Generate roots
  const roots = useMemo(() => {
    const temp = [];
    const rootCount = Math.floor(6 * growth);
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2;
      const radius = 0.15 + Math.random() * 0.1;
      temp.push({
        position: [
          Math.cos(angle) * radius,
          -0.3,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rotation: [0, angle, Math.PI / 6] as [number, number, number],
      });
    }
    return temp;
  }, [growth]);

  return (
    <group>
      {/* Trunk */}
      <mesh ref={trunkRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08 * growth, 0.12 * growth, 0.8 * growth, 8]} />
        <meshStandardMaterial
          color="#8B4513"
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Leaves */}
      <group ref={leavesRef}>
        {leaves.map((leaf, i) => (
          <mesh key={i} position={leaf.position}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#34D399"
              metalness={0.3}
              roughness={0.5}
              emissive="#34D399"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Roots */}
      <group ref={rootsRef}>
        {roots.map((root, i) => (
          <mesh key={i} position={root.position} rotation={root.rotation}>
            <cylinderGeometry args={[0.03, 0.04, 0.3, 6]} />
            <meshStandardMaterial
              color="#6B4423"
              metalness={0.2}
              roughness={0.8}
              emissive="#FFD700"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Energy glow at base */}
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function Scene({ growth }: { growth: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 3]} intensity={1} />
      <pointLight position={[0, -2, 0]} intensity={0.5} color="#FFD700" />
      <Tree growth={growth} />
    </>
  );
}

function LoadingFallback({ size }: { size: number }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      🌳
    </div>
  );
}

export function KarmicTreeLogo({ 
  size = 80, 
  className = '',
  growth = 0.7 
}: KarmicTreeLogoProps) {
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div 
        className={`flex items-center justify-center text-5xl ${className}`}
        style={{ width: size, height: size }}
        aria-label="Karmic Tree"
        role="img"
      >
        🌳
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }}
      className={className}
      aria-label="Karmic Tree"
      role="img"
    >
      <Suspense fallback={<LoadingFallback size={size} />}>
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 1.5]}
        >
          <Scene growth={growth} />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default KarmicTreeLogo;
