/**
 * useDivineContent - Hook for fetching divine consciousness content from API
 *
 * Provides easy access to:
 * - Sacred breathing exercises
 * - Divine moments and meditations
 * - Sacred mood responses
 * - Divine reminders and affirmations
 */

import { useState, useCallback } from 'react';

const API_BASE = '/api/divine';

// Types
export interface SacredAtmosphere {
  serenity_moment: string;
  sacred_opening: string;
  divine_awareness: string;
  sacred_practice: string;
  divine_presence: string;
  affirmation: string;
  sacred_closing: string;
}

export interface BreathingExercise {
  name: string;
  pattern: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause?: number;
  instructions: string[];
  divine_message: string;
  closing: string;
}

export interface MicroMeditation {
  name: string;
  duration_seconds: number;
  guidance: string;
  affirmation: string;
}

export interface SacredMoodResponse {
  sacred_response: string;
  divine_message: string;
  affirmation: string;
  sacred_practice?: string;
  emotion_guidance?: {
    category: string;
    divine_reflection: string;
    sacred_practice: string;
    consciousness_note: string;
  };
}

export interface SacredPause {
  name: string;
  guidance: string;
  duration_seconds: number;
}

export interface DivineGreeting {
  greeting: string;
  time_of_day: string;
}

export interface EmotionComfort {
  opening: string;
  awareness: string;
  practice: string;
  closing: string;
}

// Hook
export function useDivineContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for API calls
  const fetchDivine = useCallback(async <T>(endpoint: string): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Divine API error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper for POST requests
  const postDivine = useCallback(async <T>(endpoint: string, body: object): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Divine API error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // API Methods

  /**
   * Get complete sacred atmosphere
   */
  const getSacredAtmosphere = useCallback(
    (emotion?: string) => fetchDivine<SacredAtmosphere>(`/atmosphere${emotion ? `?emotion=${emotion}` : ''}`),
    [fetchDivine]
  );

  /**
   * Get breathing exercise by pattern
   */
  const getBreathingExercise = useCallback(
    (pattern: string = 'peace_breath') => fetchDivine<BreathingExercise>(`/breathing/${pattern}`),
    [fetchDivine]
  );

  /**
   * Get random breathing exercise
   */
  const getRandomBreathingExercise = useCallback(
    () => fetchDivine<BreathingExercise>('/breathing/random'),
    [fetchDivine]
  );

  /**
   * Get micro-meditation
   */
  const getMicroMeditation = useCallback(
    (type: string = 'instant_peace') => fetchDivine<MicroMeditation>(`/meditation/${type}`),
    [fetchDivine]
  );

  /**
   * Get sacred mood response
   */
  const getSacredMoodResponse = useCallback(
    (moodScore: number, emotion?: string, includePractice: boolean = true) =>
      postDivine<SacredMoodResponse>('/mood-response', {
        mood_score: moodScore,
        emotion,
        include_practice: includePractice,
      }),
    [postDivine]
  );

  /**
   * Get divine reminder
   */
  const getDivineReminder = useCallback(
    () => fetchDivine<{ reminder: string }>('/reminder').then(d => d?.reminder ?? null),
    [fetchDivine]
  );

  /**
   * Get divine affirmation
   */
  const getDivineAffirmation = useCallback(
    () => fetchDivine<{ affirmation: string }>('/affirmation').then(d => d?.affirmation ?? null),
    [fetchDivine]
  );

  /**
   * Get time-appropriate greeting
   */
  const getTimeGreeting = useCallback(
    () => fetchDivine<DivineGreeting>('/greeting'),
    [fetchDivine]
  );

  /**
   * Get sacred pause
   */
  const getSacredPause = useCallback(
    (pauseType: string = '3_breath_reset') => fetchDivine<SacredPause>(`/sacred-pause?pause_type=${pauseType}`),
    [fetchDivine]
  );

  /**
   * Get divine check-in
   */
  const getDivineCheckIn = useCallback(
    () => fetchDivine<{ content: string }>('/check-in').then(d => d?.content ?? null),
    [fetchDivine]
  );

  /**
   * Get breathing moment for emotional state
   */
  const getBreathingMoment = useCallback(
    (userState: string = 'general') =>
      fetchDivine<{ breathing_moment: string }>(`/breathing-moment/${userState}`).then(d => d?.breathing_moment ?? null),
    [fetchDivine]
  );

  /**
   * Get emotion-specific divine comfort
   */
  const getEmotionComfort = useCallback(
    (emotion: string) => fetchDivine<EmotionComfort>(`/emotion-comfort/${emotion}`),
    [fetchDivine]
  );

  return {
    // State
    loading,
    error,

    // Methods
    getSacredAtmosphere,
    getBreathingExercise,
    getRandomBreathingExercise,
    getMicroMeditation,
    getSacredMoodResponse,
    getDivineReminder,
    getDivineAffirmation,
    getTimeGreeting,
    getSacredPause,
    getDivineCheckIn,
    getBreathingMoment,
    getEmotionComfort,
  };
}

export default useDivineContent;
