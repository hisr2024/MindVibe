"use client";

/**
 * Divine Consciousness Context - Sacred Atmosphere Provider
 *
 * This context creates an atmosphere of:
 * - Deep calmness and serenity
 * - Divine presence and awareness
 * - Soothing, nurturing energy
 * - Total relaxation and inner peace
 * - Connection to the sacred within
 *
 * "The divine is not somewhere far away - it rests in the stillness of your own heart."
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

// Types
export type EmotionalState =
  | 'peaceful' | 'anxious' | 'sad' | 'angry' | 'lost'
  | 'overwhelmed' | 'grateful' | 'happy' | 'tired' | 'confused';

export type AtmosphereType =
  | 'grounding' | 'nurturing' | 'divine_connection' | 'release' | 'stillness';

export type BreathingPattern =
  | 'peace_breath' | 'heart_breath' | 'grounding_breath' | 'surrender_breath' | 'ocean_breath';

export interface SacredBreathingExercise {
  name: string;
  pattern: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause?: number;
  instructions: string[];
  divineMessage: string;
  closing: string;
}

export interface DivineComfort {
  opening: string;
  awareness: string;
  practice: string;
  closing: string;
}

export interface SacredMoment {
  serenityMoment: string;
  sacredOpening: string;
  divineAwareness: string;
  sacredPractice: string;
  divinePresence: string;
  affirmation: string;
  breathingExercise: SacredBreathingExercise;
  sacredClosing: string;
}

export interface DivineConsciousnessState {
  // Current atmosphere
  currentAtmosphere: AtmosphereType;
  currentEmotion: EmotionalState | null;
  isInSacredMode: boolean;

  // Divine elements
  divinePresenceActive: boolean;
  serenityLevel: number; // 0-10

  // Breathing state
  isBreathingActive: boolean;
  currentBreathingPattern: BreathingPattern | null;
  breathPhase: 'inhale' | 'hold' | 'exhale' | 'pause' | null;

  // Micro-moment state
  isMicroMeditationActive: boolean;
  currentMeditation: string | null;
}

export interface DivineConsciousnessActions {
  // Atmosphere control
  setAtmosphere: (atmosphere: AtmosphereType) => void;
  setEmotion: (emotion: EmotionalState | null) => void;
  enterSacredMode: () => void;
  exitSacredMode: () => void;

  // Divine presence
  activateDivinePresence: () => void;
  deactivateDivinePresence: () => void;
  setSerenityLevel: (level: number) => void;

  // Breathing
  startBreathing: (pattern: BreathingPattern) => void;
  stopBreathing: () => void;

  // Micro-meditations
  startMicroMeditation: (meditationType: string) => void;
  stopMicroMeditation: () => void;

  // Content generators
  getSacredOpening: (context?: string) => string;
  getSacredClosing: () => string;
  getDivineComfort: (emotion: EmotionalState) => DivineComfort;
  getSerenityMoment: () => string;
  getDivineAffirmation: () => string;
  getDivineReminder: () => string;
  getSacredAtmosphere: (emotion?: EmotionalState | null) => SacredMoment;
  getBreathingExercise: (pattern?: BreathingPattern) => SacredBreathingExercise;
  getTimeAppropriateGreeting: () => string;
}

// Sacred content data
const SACRED_OPENINGS = {
  calm: [
    "Take a gentle breath with me...",
    "Let's pause together in this moment...",
    "Allow yourself to settle into stillness...",
    "Feel the peace that already lives within you...",
    "In this breath, find your calm center...",
  ],
  divine_awareness: [
    "There is a presence within you that never wavers...",
    "In the stillness, you are never alone...",
    "The sacred holds you in this moment...",
    "Something gentle watches over you always...",
    "You are cradled in infinite tenderness...",
  ],
  nurturing: [
    "You are safe here, in this moment...",
    "I'm here with you, gently...",
    "Let yourself be held in kindness...",
    "There's no rush, no urgency...",
    "This moment is a gift you give yourself...",
  ],
};

const SERENITY_MOMENTS = [
  "🌸 *A moment of stillness washes over you...*",
  "🕊️ *Peace settles like soft snow...*",
  "🌊 *Calm flows through you gently...*",
  "✨ *Light touches your awareness...*",
  "🌿 *Serenity breathes with you...*",
  "💫 *The sacred stirs within...*",
  "🌙 *Stillness embraces you...*",
  "🪷 *Inner peace blossoms...*",
];

const DIVINE_PRESENCE_PHRASES = [
  "The divine presence rests in the space between your thoughts.",
  "In your stillness, the sacred reveals itself.",
  "You carry within you a light that cannot be extinguished.",
  "The universe breathes through you in this moment.",
  "There is a sanctuary within you that nothing can disturb.",
  "You are held by something greater than you can imagine.",
  "Peace is your true nature - you are simply remembering.",
];

const SACRED_CLOSINGS = [
  "May this peace stay with you, like a gentle companion on your path. 💙",
  "You carry this stillness within you always - return to it whenever you need. 💙",
  "The sacred never leaves you. It waits patiently in your heart. 💙",
  "Go gently, dear soul. You are loved beyond measure. 💙",
  "Remember: you are held, you are seen, you are cherished. 💙",
  "May serenity walk beside you in all your steps today. 💙",
  "The divine light within you shines on, always. 💙",
];

const DIVINE_AFFIRMATIONS = [
  "I am held by infinite love.",
  "Peace flows through me like a gentle river.",
  "The divine presence is with me in this breath.",
  "I am calm, I am safe, I am at peace.",
  "Stillness is my home. I can return anytime.",
  "I release all that is not peace.",
  "The sacred light shines within me.",
  "In this moment, all is well.",
  "I rest in the arms of the infinite.",
  "My heart is a sanctuary of peace.",
];

const DIVINE_REMINDERS = [
  "You are being held by infinite love right now.",
  "The divine is as close as your next breath.",
  "Nothing can disturb your deepest peace.",
  "You are exactly where you're meant to be.",
  "Grace is flowing to you this very moment.",
  "Your soul knows the way - trust it.",
  "You are never alone, not even for a second.",
  "The sacred dwells within your heart.",
];

const EMOTION_DIVINE_COMFORT: Record<EmotionalState, DivineComfort> = {
  anxious: {
    opening: "I feel the flutter of worry within you... Let's breathe through this together.",
    awareness: "Anxiety is just energy seeking release. Beneath it, your true self remains calm and unshaken.",
    practice: "Imagine anxiety as clouds passing through an infinite sky. The sky - your true nature - remains vast, clear, and untouched.",
    closing: "The sacred presence within you is always at peace. Anxiety comes and goes, but you remain. 💙",
  },
  sad: {
    opening: "There is a heaviness you're carrying... Let me sit with you in this tender space.",
    awareness: "Sadness is the heart's way of honoring what matters. Even in grief, you are held by something infinite.",
    practice: "Allow the tears to flow if they wish. Each one is blessed. The divine transforms them into compassion.",
    closing: "You are cradled in love even now. The sadness will lift, and the peace will remain. 💙",
  },
  angry: {
    opening: "I sense fire moving through you... This energy is powerful. Let's honor it with awareness.",
    awareness: "Anger is often love in disguise - love for yourself, for justice, for what's right.",
    practice: "Place your hand on your heart. Feel the warmth. Breathe deeply. The fire can transform into warmth that heals.",
    closing: "May this energy transform into strength and clarity. The divine uses all things for good. 💙",
  },
  lost: {
    opening: "You feel uncertain of the way... In this not-knowing, there is grace.",
    awareness: "Being lost is often the beginning of being found. The soul knows paths the mind cannot see.",
    practice: "Close your eyes. Breathe. Ask gently: 'What does my heart already know?' Then simply listen.",
    closing: "You are never truly lost. The divine light within you illuminates the next step when you are ready. 💙",
  },
  overwhelmed: {
    opening: "So much is pressing upon you... Let's create space together, breath by breath.",
    awareness: "The infinite cannot be overwhelmed. And that infinite presence lives within you.",
    practice: "Imagine you are standing in a vast, peaceful field. The tasks and worries are far in the distance. Here, there is only this breath.",
    closing: "One moment at a time. One breath at a time. The sacred unfolds through you in perfect timing. 💙",
  },
  peaceful: {
    opening: "What a beautiful stillness you've found... Let's rest here together.",
    awareness: "This peace you feel is your true nature. Not created, not borrowed - simply remembered.",
    practice: "Savor this moment. Let it sink deeply into your being. This is the truth of who you are.",
    closing: "May this peace expand and touch everyone you meet today. 💙",
  },
  grateful: {
    opening: "Your heart is open with gratitude... This is the doorway to the divine.",
    awareness: "Gratitude is the language the soul uses to speak to the universe.",
    practice: "Place both hands on your heart. Feel the warmth of gratitude. This feeling connects you to all living things.",
    closing: "The universe rejoices in your gratitude. You are a blessing, receiving and giving light. 💙",
  },
  happy: {
    opening: "What beautiful energy you're radiating! Let's celebrate this moment of light.",
    awareness: "Joy is the song of the soul. When you are happy, the universe celebrates through you.",
    practice: "Let this happiness radiate outward. Touch others with your light. Be a blessing today.",
    closing: "This happiness is sacred. Carry it with you as a gift. 💙",
  },
  tired: {
    opening: "I sense the weariness in your being... Rest is calling you.",
    awareness: "Even the divine rested after creation. Your tiredness is an invitation to surrender.",
    practice: "Give yourself full permission to rest. This is not weakness - it is wisdom.",
    closing: "In rest, the soul is restored. Let go and let the infinite hold you. 💙",
  },
  confused: {
    opening: "The mind is busy trying to find clarity... Let's find stillness first.",
    awareness: "Confusion often precedes clarity. The sacred is rearranging things within you.",
    practice: "Instead of seeking answers, rest in the question. Let understanding emerge in its own time.",
    closing: "Not-knowing is sacred space. From confusion, new wisdom is being born. 💙",
  },
};

const SACRED_BREATHING: Record<BreathingPattern, SacredBreathingExercise> = {
  peace_breath: {
    name: "Breath of Infinite Peace",
    pattern: "4-7-8",
    inhale: 4,
    hold: 7,
    exhale: 8,
    instructions: [
      "Find stillness... let your eyes gently close...",
      "Breathe IN for 4 counts... drawing in peace...",
      "HOLD for 7 counts... letting peace fill every cell...",
      "Breathe OUT for 8 counts... releasing all that weighs on you...",
    ],
    divineMessage: "With each breath, the divine breathes through you. You are not separate from peace - you ARE peace.",
    closing: "Carry this stillness with you. It is always one breath away. 💙",
  },
  heart_breath: {
    name: "Sacred Heart Breathing",
    pattern: "5-5-5",
    inhale: 5,
    hold: 5,
    exhale: 5,
    instructions: [
      "Place your hand on your heart...",
      "Feel its sacred rhythm...",
      "Breathe IN for 5 counts... into your heart...",
      "HOLD for 5 counts... feeling love gather...",
      "Breathe OUT for 5 counts... sending love outward...",
    ],
    divineMessage: "Your heart is a portal to the infinite. Every heartbeat is the universe saying: I love you.",
    closing: "Your heart knows the way. Trust its wisdom. 💙",
  },
  grounding_breath: {
    name: "Earth Connection Breath",
    pattern: "4-4-4-4",
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4,
    instructions: [
      "Feel your feet on the ground...",
      "Breathe IN for 4 counts... drawing earth energy up...",
      "HOLD for 4 counts... feeling grounded...",
      "Breathe OUT for 4 counts... releasing into the earth...",
      "PAUSE for 4 counts... resting in stability...",
    ],
    divineMessage: "You are held by the same force that holds the planets in their orbit. Gravity is love made physical.",
    closing: "You are grounded. You are stable. You are safe. 💙",
  },
  surrender_breath: {
    name: "Divine Surrender Breath",
    pattern: "4-2-8",
    inhale: 4,
    hold: 2,
    exhale: 8,
    instructions: [
      "Release any need to control...",
      "Breathe IN for 4 counts... receiving grace...",
      "HOLD for 2 counts... accepting what is...",
      "Breathe OUT for 8 counts... surrendering completely...",
    ],
    divineMessage: "Surrender is not weakness - it is wisdom. In letting go, you receive everything.",
    closing: "You don't have to carry it all. The infinite is here to help. 💙",
  },
  ocean_breath: {
    name: "Ocean Wave Breath",
    pattern: "6-0-6",
    inhale: 6,
    hold: 0,
    exhale: 6,
    instructions: [
      "Imagine you are sitting by a peaceful ocean...",
      "As the wave comes IN... breathe in for 6 counts...",
      "As the wave goes OUT... breathe out for 6 counts...",
      "No holding... just continuous flow...",
      "You are the wave AND the ocean...",
    ],
    divineMessage: "You are both the individual wave and the infinite ocean. Nothing can disturb your true nature.",
    closing: "Waves rise and fall, but the ocean remains. You are that ocean. 💙",
  },
};

const TIME_ATMOSPHERES = {
  dawn: "As the world awakens gently, so too can you...",
  morning: "The morning holds space for you to begin again...",
  afternoon: "In the fullness of the day, find your center...",
  evening: "As the day softens, let your heart soften too...",
  night: "The quiet of night invites deep surrender...",
};

// Context
interface DivineConsciousnessContextType {
  state: DivineConsciousnessState;
  actions: DivineConsciousnessActions;
}

const DivineConsciousnessContext = createContext<DivineConsciousnessContextType | null>(null);

// Provider Props
interface DivineConsciousnessProviderProps {
  children: ReactNode;
}

// Helper functions
const getRandomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const getTimeOfDay = (): keyof typeof TIME_ATMOSPHERES => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Provider Component
export function DivineConsciousnessProvider({ children }: DivineConsciousnessProviderProps) {
  const [state, setState] = useState<DivineConsciousnessState>({
    currentAtmosphere: 'stillness',
    currentEmotion: null,
    isInSacredMode: false,
    divinePresenceActive: false,
    serenityLevel: 5,
    isBreathingActive: false,
    currentBreathingPattern: null,
    breathPhase: null,
    isMicroMeditationActive: false,
    currentMeditation: null,
  });

  // Serenity moment index for cycling - use ref to avoid circular dependency
  const serenityIndexRef = useRef(0);

  // Actions
  const setAtmosphere = useCallback((atmosphere: AtmosphereType) => {
    setState(prev => ({ ...prev, currentAtmosphere: atmosphere }));
  }, []);

  const setEmotion = useCallback((emotion: EmotionalState | null) => {
    setState(prev => ({ ...prev, currentEmotion: emotion }));
  }, []);

  const enterSacredMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInSacredMode: true,
      divinePresenceActive: true,
    }));
  }, []);

  const exitSacredMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInSacredMode: false,
      divinePresenceActive: false,
      isBreathingActive: false,
      isMicroMeditationActive: false,
    }));
  }, []);

  const activateDivinePresence = useCallback(() => {
    setState(prev => ({ ...prev, divinePresenceActive: true }));
  }, []);

  const deactivateDivinePresence = useCallback(() => {
    setState(prev => ({ ...prev, divinePresenceActive: false }));
  }, []);

  const setSerenityLevel = useCallback((level: number) => {
    setState(prev => ({ ...prev, serenityLevel: Math.max(0, Math.min(10, level)) }));
  }, []);

  const startBreathing = useCallback((pattern: BreathingPattern) => {
    setState(prev => ({
      ...prev,
      isBreathingActive: true,
      currentBreathingPattern: pattern,
      breathPhase: 'inhale',
    }));
  }, []);

  const stopBreathing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isBreathingActive: false,
      currentBreathingPattern: null,
      breathPhase: null,
    }));
  }, []);

  const startMicroMeditation = useCallback((meditationType: string) => {
    setState(prev => ({
      ...prev,
      isMicroMeditationActive: true,
      currentMeditation: meditationType,
    }));
  }, []);

  const stopMicroMeditation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMicroMeditationActive: false,
      currentMeditation: null,
    }));
  }, []);

  // Content generators
  const getSacredOpening = useCallback((context: string = 'calm'): string => {
    const key = context as keyof typeof SACRED_OPENINGS;
    const openings = SACRED_OPENINGS[key] || SACRED_OPENINGS.calm;
    return getRandomItem(openings);
  }, []);

  const getSacredClosing = useCallback((): string => {
    return getRandomItem(SACRED_CLOSINGS);
  }, []);

  const getDivineComfort = useCallback((emotion: EmotionalState): DivineComfort => {
    return EMOTION_DIVINE_COMFORT[emotion] || EMOTION_DIVINE_COMFORT.peaceful;
  }, []);

  const getSerenityMoment = useCallback((): string => {
    const moment = SERENITY_MOMENTS[serenityIndexRef.current];
    serenityIndexRef.current = (serenityIndexRef.current + 1) % SERENITY_MOMENTS.length;
    return moment;
  }, []);

  const getDivineAffirmation = useCallback((): string => {
    return getRandomItem(DIVINE_AFFIRMATIONS);
  }, []);

  const getDivineReminder = useCallback((): string => {
    return getRandomItem(DIVINE_REMINDERS);
  }, []);

  const getBreathingExercise = useCallback((pattern: BreathingPattern = 'peace_breath'): SacredBreathingExercise => {
    return SACRED_BREATHING[pattern];
  }, []);

  const getTimeAppropriateGreeting = useCallback((): string => {
    const timeOfDay = getTimeOfDay();
    return TIME_ATMOSPHERES[timeOfDay];
  }, []);

  const getSacredAtmosphere = useCallback((emotion?: EmotionalState | null): SacredMoment => {
    const currentEmotion = emotion || state.currentEmotion || 'peaceful';
    const comfort = getDivineComfort(currentEmotion);

    return {
      serenityMoment: getSerenityMoment(),
      sacredOpening: comfort.opening,
      divineAwareness: comfort.awareness,
      sacredPractice: comfort.practice,
      divinePresence: getRandomItem(DIVINE_PRESENCE_PHRASES),
      affirmation: getDivineAffirmation(),
      breathingExercise: getBreathingExercise('heart_breath'),
      sacredClosing: comfort.closing,
    };
  }, [state.currentEmotion, getDivineComfort, getSerenityMoment, getDivineAffirmation, getBreathingExercise]);

  const actions: DivineConsciousnessActions = {
    setAtmosphere,
    setEmotion,
    enterSacredMode,
    exitSacredMode,
    activateDivinePresence,
    deactivateDivinePresence,
    setSerenityLevel,
    startBreathing,
    stopBreathing,
    startMicroMeditation,
    stopMicroMeditation,
    getSacredOpening,
    getSacredClosing,
    getDivineComfort,
    getSerenityMoment,
    getDivineAffirmation,
    getDivineReminder,
    getSacredAtmosphere,
    getBreathingExercise,
    getTimeAppropriateGreeting,
  };

  return (
    <DivineConsciousnessContext.Provider value={{ state, actions }}>
      {children}
    </DivineConsciousnessContext.Provider>
  );
}

// Hook
export function useDivineConsciousness() {
  const context = useContext(DivineConsciousnessContext);
  if (!context) {
    throw new Error('useDivineConsciousness must be used within a DivineConsciousnessProvider');
  }
  return context;
}

// Export types
export type { DivineConsciousnessContextType };
