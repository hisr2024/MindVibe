'use client';

import { useRef, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * JournalLogo3D - Animated Book Opening/Closing
 * 
 * Features:
 * - Animated book opening/closing
 * - Pages flutter on hover
 * - Golden light emanates
 */

interface JournalLogo3DProps {
  size?: number;
  className?: string;
}

function Book({ hovered }: { hovered: boolean }) {
  const leftCoverRef = useRef<THREE.Mesh>(null);
  const rightCoverRef = useRef<THREE.Mesh>(null);
  const pagesRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (leftCoverRef.current && rightCoverRef.current) {
      // Opening/closing animation
      const openAmount = hovered ? Math.PI / 4 : Math.PI / 12;
      leftCoverRef.current.rotation.y = THREE.MathUtils.lerp(
        leftCoverRef.current.rotation.y,
        -openAmount,
        0.05
      );
      rightCoverRef.current.rotation.y = THREE.MathUtils.lerp(
        rightCoverRef.current.rotation.y,
        openAmount,
        0.05
      );
    }

    if (pagesRef.current && hovered) {
      // Flutter effect
      pagesRef.current.rotation.y = Math.sin(time * 4) * 0.05;
    }

    if (glowRef.current) {
      // Pulsing glow
      const intensity = hovered ? 0.6 : 0.3;
      glowRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
      if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
        glowRef.current.material.opacity = intensity;
      }
    }
  });

  return (
    <group>
      {/* Golden glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial
          color="#FFD700"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Left cover */}
      <mesh ref={leftCoverRef} position={[-0.05, 0, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.8]} />
        <meshStandardMaterial
          color="#8B4513"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Right cover */}
      <mesh ref={rightCoverRef} position={[0.05, 0, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.8]} />
        <meshStandardMaterial
          color="#8B4513"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Pages */}
      <group ref={pagesRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[i * 0.02 - 0.02, 0, 0]}>
            <boxGeometry args={[0.01, 0.55, 0.75]} />
            <meshStandardMaterial
              color="#FFF8DC"
              metalness={0}
              roughness={1}
            />
          </mesh>
        ))}
      </group>

      {/* Bookmark */}
      <mesh position={[0, 0.3, 0.38]}>
        <boxGeometry args={[0.05, 0.6, 0.02]} />
        <meshStandardMaterial
          color="#FF7327"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

function Scene({ hovered }: { hovered: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#FFD700" />
      <pointLight position={[-3, -3, -3]} intensity={0.5} />
      <Book hovered={hovered} />
    </>
  );
}

function LoadingFallback({ size }: { size: number }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      📖
    </div>
  );
}

export function JournalLogo3D({ 
  size = 40, 
  className = '' 
}: JournalLogo3DProps) {
  const [hovered, setHovered] = useState(false);

  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div 
        className={`flex items-center justify-center text-3xl ${className}`}
        style={{ width: size, height: size }}
        aria-label="Sacred Journal"
        role="img"
      >
        📖
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Sacred Journal"
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
          <Scene hovered={hovered} />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default JournalLogo3D;
