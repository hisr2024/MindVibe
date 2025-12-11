'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * LanguageGlobeLogo - Animated 3D Globe with Continents
 * 
 * Features:
 * - Animated 3D globe with continents
 * - Spins slowly
 * - Glows on hover
 * - Particles orbit around it
 */

interface LanguageGlobeLogoProps {
  size?: number;
  className?: string;
}

function Globe({ hovered }: { hovered: boolean }) {
  const globeRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      // Slow rotation
      globeRef.current.rotation.y += 0.005;
      
      // Gentle wobble
      globeRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }

    if (particlesRef.current) {
      // Orbit particles
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  // Generate simple continent-like patterns
  const continents = React.useMemo(() => {
    const temp = [];
    for (let i = 0; i < 20; i++) {
      const phi = Math.acos(-1 + (2 * i) / 20);
      const theta = Math.sqrt(20 * Math.PI) * phi;
      temp.push({
        position: [
          0.55 * Math.cos(theta) * Math.sin(phi),
          0.55 * Math.cos(phi),
          0.55 * Math.sin(theta) * Math.sin(phi),
        ] as [number, number, number],
      });
    }
    return temp;
  }, []);

  return (
    <>
      {/* Main globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#2E9FFF"
          metalness={0.3}
          roughness={0.7}
          emissive="#2E9FFF"
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* Continents */}
      {continents.map((continent, i) => (
        <mesh key={i} position={continent.position}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#34D399"
            metalness={0.5}
            roughness={0.5}
            emissive="#34D399"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Orbiting particles */}
      {hovered && (
        <group ref={particlesRef}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#FFD700" />
              </mesh>
            );
          })}
        </group>
      )}
    </>
  );
}

function Scene({ hovered }: { hovered: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />
      <Globe hovered={hovered} />
    </>
  );
}

function LoadingFallback({ size }: { size: number }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      🌍
    </div>
  );
}

export function LanguageGlobeLogo({ 
  size = 32, 
  className = '' 
}: LanguageGlobeLogoProps) {
  const [hovered, setHovered] = React.useState(false);

  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div 
        className={`flex items-center justify-center text-2xl ${className}`}
        style={{ width: size, height: size }}
        aria-label="Language Globe"
        role="img"
      >
        🌍
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Language Globe"
      role="img"
    >
      <Suspense fallback={<LoadingFallback size={size} />}>
        <Canvas
          camera={{ position: [0, 0, 2], fov: 50 }}
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

export default LanguageGlobeLogo;
