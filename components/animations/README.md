# Animation Components & Utilities

This directory contains premium animation components and utilities for MindVibe's UI enhancements.

## Components

### Core Animation Components

#### `BreathingOrb.tsx`
Animated breathing visualization with customizable patterns (4-7-8, 4-4-4).

**Usage:**
```tsx
<BreathingOrb
  size={250}
  color="#8b5cf6"
  pattern="4-7-8"
  autoStart={true}
  onCycleComplete={() => console.log('Cycle complete')}
/>
```

#### `ConfettiEffect.tsx`
Confetti celebration animation using canvas-confetti.

**Usage:**
```tsx
<ConfettiEffect
  trigger={showConfetti}
  colors={['#ff7327', '#ff9933']}
  particleCount={100}
/>
```

Or use the helper function:
```tsx
import { fireConfetti } from '@/components/animations/ConfettiEffect';
fireConfetti({ particleCount: 150 });
```

#### `ParticleSystem.tsx`
Canvas-based particle effect system for high-performance animations.

**Usage:**
```tsx
<ParticleSystem
  trigger={isActive}
  color="#ff7327"
  particleCount={30}
  origin={{ x: 100, y: 100 }}
/>
```

#### `TypingEffect.tsx`
Text typing animation with customizable speed.

**Usage:**
```tsx
<TypingEffect
  text="Hello, welcome to MindVibe!"
  speed={30}
  showCursor={true}
  onComplete={() => console.log('Typing complete')}
/>
```

### Emotional Components

#### `MoodParticles.tsx`
Particle burst effect for mood selection.

**Usage:**
```tsx
<MoodParticles
  color="#ff7327"
  trigger={isMoodSelected}
  origin={{ x: 150, y: 150 }}
/>
```

#### `AnimatedIntensitySlider.tsx`
Slider with smooth gradients, energy bars, and haptic feedback.

**Usage:**
```tsx
<AnimatedIntensitySlider
  value={intensity}
  onChange={setIntensity}
  min={1}
  max={10}
  color="#8b5cf6"
  glowColor="rgba(139, 92, 246, 0.4)"
/>
```

#### `StateGlowEffect.tsx`
Pulsing glow effect for emotional states.

**Usage:**
```tsx
<StateGlowEffect
  state={{
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)'
  }}
  isActive={isSelected}
/>
```

## Utilities

### Animation Configs (`lib/animations/spring-configs.ts`)

Predefined spring physics configurations for consistent animations:

```tsx
import { springConfigs, animationVariants, durations } from '@/lib/animations/spring-configs';

// Use predefined springs
<motion.div transition={springConfigs.smooth}>

// Use animation variants
<motion.div variants={animationVariants.slideUp}>

// Use standard durations
<motion.div transition={{ duration: durations.normal }}>
```

Available configs:
- `springConfigs.gentle` - Subtle animations
- `springConfigs.bouncy` - Playful interactions
- `springConfigs.smooth` - Elegant transitions
- `springConfigs.snappy` - Quick responses
- `springConfigs.slow` - Dramatic effects

Animation variants:
- `fade`, `slideUp`, `slideDown`, `scale`, `bounce`, `rotate`

## Hooks

### `useHapticFeedback`
Provides haptic feedback for supported devices.

```tsx
const { triggerHaptic } = useHapticFeedback();

triggerHaptic('light');    // Light tap
triggerHaptic('medium');   // Medium tap
triggerHaptic('heavy');    // Heavy tap
triggerHaptic('selection'); // Selection feedback
triggerHaptic('success');   // Success pattern
triggerHaptic('warning');   // Warning pattern
triggerHaptic('error');     // Error pattern
```

### `useStreamingText`
Text streaming effect with character-by-character reveal.

```tsx
const { displayedText, isComplete, skipToEnd } = useStreamingText(fullText, {
  speed: 30, // characters per second
  onComplete: () => console.log('Done!')
});
```

### `usePrefersReducedMotion`
Checks user's motion preferences for accessibility.

```tsx
const prefersReducedMotion = usePrefersReducedMotion();

// Disable animations if user prefers reduced motion
<motion.div animate={!prefersReducedMotion && { scale: 1.2 }}>
```

## Accessibility

All animations respect the `prefers-reduced-motion` user preference:

1. Haptic feedback is disabled when `prefers-reduced-motion` is enabled
2. Use `usePrefersReducedMotion` hook to conditionally apply animations
3. Provide static alternatives for critical information

## Performance

### Best Practices

1. **Use GPU-accelerated properties**: `transform`, `opacity`
2. **Avoid layout-triggering properties**: `width`, `height`, `top`, `left`
3. **Use will-change sparingly**: Only on elements that will animate
4. **Canvas for particles**: ParticleSystem uses canvas for 60fps performance
5. **Batch updates**: Use `AnimatePresence` for group animations

### Performance Monitoring

```tsx
// Monitor frame rate in development
useEffect(() => {
  let frameCount = 0;
  let lastTime = performance.now();
  
  const checkFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
      console.log(`FPS: ${frameCount}`);
      frameCount = 0;
      lastTime = currentTime;
    }
    requestAnimationFrame(checkFPS);
  };
  
  checkFPS();
}, []);
```

## Examples

### KIAAN Footer Enhancement
See `components/layout/KiaanFooter.tsx` for:
- Streaming text responses
- Animated avatar states (idle, thinking, celebrating)
- Spring physics for expand/collapse
- Message bubble slide-in animations

### StateCheckIn Enhancement
See `components/emotional/StateCheckIn.tsx` for:
- 3D emotional circles with perspective
- Particle burst on selection
- Animated intensity slider
- Glow effects

### Karma Reset Enhancement
See `app/tools/karma-reset/KarmaResetClient.tsx` for:
- Breathing orb visualization
- Confetti celebration
- Animated logos
- Smooth transitions

## Bundle Size

Current animation dependencies:
- `framer-motion`: ~60kb gzipped
- `canvas-confetti`: ~5kb gzipped
- `lottie-react`: ~40kb gzipped
- Custom components: ~15kb gzipped

**Total**: ~120kb gzipped (within 150kb budget ✅)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 12+)
- Mobile browsers: ✅ Optimized with haptic feedback

## Future Enhancements

- [ ] Lottie animations for complex graphics
- [ ] Sound effects (optional toggle)
- [ ] Advanced particle effects
- [ ] Gesture-based interactions
- [ ] 3D transforms with CSS
