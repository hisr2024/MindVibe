'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';

/**
 * EmotionIcon3D - 3D Sphere for Emotion Representation
 * 
 * Features:
 * - 3D sphere for each emotion
 * - Breathing based on intensity slider (1-10)
 * - Energy levels affect animation speed
 * - Hover effects with scale and rotation
 * - Selection effects with glowing border
 * - Emoji overlay with bounce animation
 */

export interface Emotion {
  id: string;
  label: string;
  emoji: string;
  color: string;
  energy: 'low' | 'medium' | 'high';
}

interface EmotionIcon3DProps {
  emotion: Emotion;
  intensity?: number;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

const energySpeeds = {
  low: 0.5,
  medium: 1.5,
  high: 3.0,
};

function EmotionSphere({ 
  color, 
  intensity, 
  energy, 
  selected, 
  hovered 
}: { 
  color: string; 
  intensity: number; 
  energy: 'low' | 'medium' | 'high';
  selected: boolean;
  hovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = energySpeeds[energy];

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      
      // Breathing animation
      const breathScale = 1 + Math.sin(time * speed) * (0.05 + intensity / 200);
      meshRef.current.scale.setScalar(breathScale);
      
      // Continuous rotation on Y-axis
      meshRef.current.rotation.y += 0.005 * speed;
      
      // Gentle wobble on X-axis
      meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      
      // Floating on Y-axis
      meshRef.current.position.y = Math.sin(time * speed * 0.5) * 0.1;
      
      // Emissive glow based on state
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        let emissiveIntensity = 0.5;
        if (selected) {
          emissiveIntensity = 1.5;
        } else if (hovered) {
          emissiveIntensity = 1.0;
        }
        meshRef.current.material.emissiveIntensity = emissiveIntensity;
      }
    }
  });

  const sphereColor = new THREE.Color(color);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={sphereColor}
        metalness={0.5}
        roughness={0.3}
        emissive={sphereColor}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function Scene({ 
  emotion, 
  intensity, 
  selected, 
  hovered 
}: { 
  emotion: Emotion; 
  intensity: number;
  selected: boolean;
  hovered: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />
      
      <EmotionSphere 
        color={emotion.color} 
        intensity={intensity}
        energy={emotion.energy}
        selected={selected}
        hovered={hovered}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
    </div>
  );
}

export function EmotionIcon3D({
  emotion,
  intensity = 5,
  selected = false,
  hovered = false,
  onClick,
  onHover,
}: EmotionIcon3DProps) {
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Selection ripple animation
  const rippleVariants = {
    idle: { scale: 1 },
    selected: { 
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: selected 
          ? `radial-gradient(circle, ${emotion.color}20, transparent)`
          : 'transparent',
      }}
      aria-label={`${emotion.label} emotion`}
      aria-pressed={selected}
    >
      {/* 3D Sphere Container */}
      <div className="relative w-24 h-24">
        {/* Glowing border for selected state */}
        {selected && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${emotion.color}`,
              boxShadow: `0 0 20px ${emotion.color}80`,
            }}
            variants={rippleVariants}
            animate="selected"
          />
        )}
        
        {/* 3D Canvas */}
        {!prefersReducedMotion ? (
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              camera={{ position: [0, 0, 3], fov: 50 }}
              gl={{ 
                antialias: true, 
                alpha: true,
                powerPreference: 'high-performance',
              }}
              dpr={[1, 1.5]}
            >
              <Scene 
                emotion={emotion} 
                intensity={intensity}
                selected={selected}
                hovered={hovered}
              />
            </Canvas>
          </Suspense>
        ) : (
          <div 
            className="flex items-center justify-center w-full h-full rounded-full text-4xl"
            style={{ backgroundColor: `${emotion.color}40` }}
          >
            {emotion.emoji}
          </div>
        )}
      </div>

      {/* Emoji overlay with bounce */}
      <motion.div
        className="text-3xl"
        animate={selected ? {
          y: [0, -5, 0],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        } : {}}
      >
        {emotion.emoji}
      </motion.div>

      {/* Label */}
      <span 
        className="text-sm font-medium"
        style={{ 
          color: selected ? emotion.color : '#fff',
        }}
      >
        {emotion.label}
      </span>
    </motion.button>
  );
}

export default EmotionIcon3D;
