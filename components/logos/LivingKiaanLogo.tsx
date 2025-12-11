'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * Living KIAAN Logo - 3D Interactive Animated Logo
 * 
 * Features:
 * - 3D torus representing Krishna's flute
 * - Inner sphere with peacock feather accent
 * - Breathing animation that responds to emotional states
 * - Interactive hover effects with particles
 * - Glowing aura with bloom effects
 * - 60fps performance optimized
 */

type EmotionalState = 'peaceful' | 'listening' | 'thinking' | 'speaking' | 'celebrating' | 'guiding';

interface LivingKiaanLogoProps {
  emotionalState?: EmotionalState;
  size?: number;
  interactive?: boolean;
  showAura?: boolean;
}

interface EmotionalConfig {
  breathingSpeed: number;
  glowColor: string;
  rotationSpeed: number;
  scale: number;
  bloomIntensity: number;
}

const emotionalConfigs: Record<EmotionalState, EmotionalConfig> = {
  peaceful: {
    breathingSpeed: 0.5, // 2s cycle
    glowColor: '#FF7327',
    rotationSpeed: 0.3,
    scale: 1.0,
    bloomIntensity: 1.0,
  },
  listening: {
    breathingSpeed: 0.67, // 1.5s cycle
    glowColor: '#FFD700',
    rotationSpeed: 0.5,
    scale: 1.1,
    bloomIntensity: 1.2,
  },
  thinking: {
    breathingSpeed: 0.33, // 3s cycle
    glowColor: '#FF8C00',
    rotationSpeed: 0.8,
    scale: 1.05,
    bloomIntensity: 1.5,
  },
  speaking: {
    breathingSpeed: 1.0, // 1s cycle
    glowColor: '#FF4500',
    rotationSpeed: 1.0,
    scale: 1.15,
    bloomIntensity: 1.8,
  },
  celebrating: {
    breathingSpeed: 2.0, // 0.5s cycle
    glowColor: '#FFD700',
    rotationSpeed: 1.5,
    scale: 1.3,
    bloomIntensity: 2.5,
  },
  guiding: {
    breathingSpeed: 0.56, // 1.8s cycle
    glowColor: '#FF7F50',
    rotationSpeed: 0.6,
    scale: 1.12,
    bloomIntensity: 1.3,
  },
};

function TorusLogo({ config, interactive, showAura }: { 
  config: EmotionalConfig; 
  interactive: boolean;
  showAura: boolean;
}) {
  const torusRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame(({ clock }) => {
    if (torusRef.current && sphereRef.current && groupRef.current) {
      const time = clock.getElapsedTime();
      
      // Breathing animation
      const breathScale = config.scale + Math.sin(time * config.breathingSpeed * Math.PI) * 0.05;
      torusRef.current.scale.setScalar(breathScale);
      sphereRef.current.scale.setScalar(breathScale * 0.9);
      
      // Floating motion
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.1;
      
      // Rotation
      groupRef.current.rotation.y += 0.01 * config.rotationSpeed;
      groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      
      // Emissive pulsing
      if (torusRef.current.material instanceof THREE.MeshStandardMaterial) {
        torusRef.current.material.emissiveIntensity = 
          0.5 + Math.sin(time * config.breathingSpeed * Math.PI) * 0.3;
      }
    }
  });

  const glowColor = useMemo(() => new THREE.Color(config.glowColor), [config.glowColor]);

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => interactive && setHovered(true)}
      onPointerOut={() => interactive && setHovered(false)}
    >
      {/* Main torus - Krishna's flute representation */}
      <mesh ref={torusRef}>
        <torusGeometry args={[1.2, 0.5, 24, 48]} />
        <meshStandardMaterial
          color={config.glowColor}
          metalness={0.9}
          roughness={0.1}
          emissive={glowColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Inner sphere - Peacock feather accent */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#2E9FFF"
          metalness={0.8}
          roughness={0.2}
          emissive="#2E9FFF"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Hover particles */}
      {interactive && hovered && (
        <Particles count={12} color={config.glowColor} />
      )}

      {/* Aura overlay */}
      {showAura && (
        <mesh scale={2}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

function Particles({ count, color }: { count: number; color: string }) {
  const particlesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2;
      temp.push({
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle * 2) * 0.5,
          Math.sin(angle) * radius,
        ] as [number, number, number],
      });
    }
    return temp;
  }, [count]);

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ config, interactive, showAura }: { 
  config: EmotionalConfig; 
  interactive: boolean;
  showAura: boolean;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      {interactive && <OrbitControls enableZoom={false} enablePan={false} />}
      
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2E9FFF" />
      
      <TorusLogo config={config} interactive={interactive} showAura={showAura} />
      
      <EffectComposer>
        <Bloom
          intensity={config.bloomIntensity}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  );
}

function LoadingFallback({ size }: { size: number }) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );
}

export function LivingKiaanLogo({
  emotionalState = 'peaceful',
  size = 100,
  interactive = true,
  showAura = true,
}: LivingKiaanLogoProps) {
  const config = emotionalConfigs[emotionalState];

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Fallback to simple emoji for reduced motion
    return (
      <div 
        className="flex items-center justify-center text-4xl"
        style={{ width: size, height: size }}
        aria-label="KIAAN Logo"
        role="img"
      >
        🕉️
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }}
      aria-label={`KIAAN Logo - ${emotionalState} state`}
      role="img"
    >
      <Suspense fallback={<LoadingFallback size={size} />}>
        <Canvas
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <Scene config={config} interactive={interactive} showAura={showAura} />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default LivingKiaanLogo;
