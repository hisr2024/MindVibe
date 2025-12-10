'use client';

import { useState } from 'react';

/**
 * Minimal Mood Check-In Component
 * Small stone layout for quick mood logging
 */
export function MinimalMoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  // Compact mood stones - fewer moods, more focused
  const moodStones = [
    { label: 'Peaceful', emoji: '🙏', color: 'from-emerald-400 to-teal-400', response: 'Beautiful calm. Stay with it. 💙' },
    { label: 'Happy', emoji: '😊', color: 'from-yellow-400 to-amber-400', response: 'Let that warmth stay with you. ✨' },
    { label: 'Neutral', emoji: '😐', color: 'from-slate-400 to-gray-400', response: 'Steady is good. You\'re showing up. 🌿' },
    { label: 'Tired', emoji: '😴', color: 'from-blue-400 to-indigo-400', response: 'Rest is not weakness. 💙' },
    { label: 'Anxious', emoji: '😰', color: 'from-amber-400 to-orange-400', response: 'Take a breath. I\'m with you. 🌊' },
    { label: 'Heavy', emoji: '🌧️', color: 'from-slate-500 to-gray-500', response: 'You\'re not alone. I\'m here. 💙' },
  ];

  const handleMoodSelect = (mood: typeof moodStones[0]) => {
    setSelectedMood(mood.label);
    setShowResponse(true);

    // Save to localStorage for tracking
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('mood_check_ins');
        const checkIns = existing ? JSON.parse(existing) : [];
        checkIns.push({
          mood: mood.label,
          timestamp: new Date().toISOString(),
        });
        // Keep only last 50 check-ins
        const trimmed = checkIns.slice(-50);
        localStorage.setItem('mood_check_ins', JSON.stringify(trimmed));
      } catch {
        // Ignore storage errors
      }
    }

    // Auto-hide response after 5 seconds
    setTimeout(() => {
      setShowResponse(false);
      setSelectedMood(null);
    }, 5000);
  };

  const selectedMoodData = moodStones.find(m => m.label === selectedMood);

  return (
    <section className="space-y-4 rounded-2xl border border-orange-500/20 bg-white/5 p-5 shadow-[0_16px_70px_rgba(255,115,39,0.12)]">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-orange-100/70">Quick Check-In</p>
        <h3 className="mt-1 text-xl font-semibold text-orange-50">
          How are you feeling?
        </h3>
      </div>

      {/* Stone Grid - Compact Layout */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {moodStones.map((mood) => {
          const isSelected = selectedMood === mood.label;
          return (
            <button
              key={mood.label}
              onClick={() => handleMoodSelect(mood)}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                isSelected 
                  ? 'scale-105 shadow-2xl ring-2 ring-orange-400/60' 
                  : 'hover:scale-105 hover:shadow-xl'
              }`}
              aria-label={`Select ${mood.label} mood`}
            >
              {/* Stone background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-80`} />
              
              {/* Texture overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
              
              {/* Stone border */}
              <div className="absolute inset-0 rounded-2xl border border-white/20" />

              {/* Content */}
              <div className="relative flex flex-col items-center gap-2">
                <span className="text-2xl sm:text-3xl" role="img" aria-label={mood.label}>
                  {mood.emoji}
                </span>
                <span className="text-[10px] font-semibold text-white sm:text-xs">
                  {mood.label}
                </span>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -right-1 -top-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 shadow-lg">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* KIAAN Micro-Response */}
      {showResponse && selectedMoodData && (
        <div className="animate-fadeIn rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-amber-300/10 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 text-sm font-bold text-slate-900">
              K
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-orange-100/70">KIAAN</p>
              <p className="text-sm leading-relaxed text-orange-50">
                {selectedMoodData.response}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="text-center">
        <p className="text-xs text-orange-100/60">
          Tap a stone to log your mood • Private & local only
        </p>
      </div>
    </section>
  );
}
