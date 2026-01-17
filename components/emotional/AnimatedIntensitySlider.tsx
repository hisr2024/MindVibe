/**
 * Animated Intensity Slider Component
 * Slider with smooth gradient transitions and haptic feedback
 */

'use client';

import { motion } from 'framer-motion';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface AnimatedIntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color: string;
  glowColor: string;
  className?: string;
}

export function AnimatedIntensitySlider({
  value,
  onChange,
  min = 1,
  max = 10,
  color,
  glowColor,
  className = '',
}: AnimatedIntensitySliderProps) {
  const { triggerHaptic } = useHapticFeedback();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
    triggerHaptic('selection');
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />
      </div>

      {/* Energy Bars with Stagger Effect */}
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 h-8 rounded transition-all duration-300"
            style={{
              backgroundColor: i < value ? color : 'rgba(255, 255, 255, 0.1)',
              boxShadow: i < value ? `0 0 8px ${glowColor}` : 'none',
            }}
            initial={{ scaleY: 0 }}
            animate={{
              scaleY: i < value ? 1 : 0.3,
            }}
            transition={{
              delay: i * 0.05,
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-orange-100/60">
        <span>Subtle</span>
        <span className="font-semibold text-orange-50">{value}/{max}</span>
        <span>Intense</span>
      </div>
    </div>
  );
}
