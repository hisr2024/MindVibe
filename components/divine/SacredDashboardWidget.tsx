"use client";

/**
 * Sacred Dashboard Widget - Divine Quick Actions
 *
 * A beautiful widget for the dashboard offering:
 * - Quick breathing exercises
 * - Divine moments
 * - Sacred check-ins
 * - Serenity level indicator
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness, BreathingPattern } from '@/contexts/DivineConsciousnessContext';
import { SacredBreathingModal } from './SacredBreathingModal';
import { DivineMoment } from './DivineMoment';

interface SacredDashboardWidgetProps {
  showBreathing?: boolean;
  showMoments?: boolean;
  showReminder?: boolean;
  className?: string;
}

const QUICK_BREATHING_OPTIONS: { pattern: BreathingPattern; name: string; duration: string; icon: string }[] = [
  { pattern: 'peace_breath', name: 'Peace Breath', duration: '30s', icon: '🕊️' },
  { pattern: 'heart_breath', name: 'Heart Breath', duration: '45s', icon: '💙' },
  { pattern: 'grounding_breath', name: 'Grounding', duration: '40s', icon: '🌿' },
];

const DIVINE_MOMENTS: { type: 'instant_peace' | 'divine_presence' | 'gratitude'; name: string; icon: string }[] = [
  { type: 'instant_peace', name: 'Instant Peace', icon: '✨' },
  { type: 'divine_presence', name: 'Divine Presence', icon: '🙏' },
  { type: 'gratitude', name: 'Gratitude', icon: '💫' },
];

export function SacredDashboardWidget({
  showBreathing = true,
  showMoments = true,
  showReminder = true,
  className = '',
}: SacredDashboardWidgetProps) {
  const { actions, state } = useDivineConsciousness();
  const [reminder, setReminder] = useState(() => actions.getDivineReminder());
  const [activeSection, setActiveSection] = useState<'breathing' | 'moments' | null>(null);

  // Modal states
  const [breathingModalOpen, setBreathingModalOpen] = useState(false);
  const [selectedBreathingPattern, setSelectedBreathingPattern] = useState<BreathingPattern>('peace_breath');
  const [divineMomentOpen, setDivineMomentOpen] = useState(false);
  const [selectedMomentType, setSelectedMomentType] = useState<'instant_peace' | 'divine_presence' | 'gratitude'>('instant_peace');

  const handleStartBreathing = (pattern: BreathingPattern) => {
    setSelectedBreathingPattern(pattern);
    setBreathingModalOpen(true);
    actions.startBreathing(pattern);
  };

  const handleStartDivineMoment = (type: 'instant_peace' | 'divine_presence' | 'gratitude') => {
    setSelectedMomentType(type);
    setDivineMomentOpen(true);
    actions.startMicroMeditation(type);
  };

  const handleCloseBreathingModal = () => {
    setBreathingModalOpen(false);
    actions.stopBreathing();
  };

  const handleCloseDivineMoment = () => {
    setDivineMomentOpen(false);
    actions.stopMicroMeditation();
  };

  const refreshReminder = () => {
    setReminder(actions.getDivineReminder());
  };

  return (
    <motion.div
      className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(147, 197, 253, 0.4)',
                '0 0 0 10px rgba(147, 197, 253, 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xl">🙏</span>
          </motion.div>
          <div>
            <h3 className="text-white/90 font-medium">Sacred Space</h3>
            <p className="text-white/50 text-xs">Find peace in any moment</p>
          </div>
        </div>

        {/* Serenity indicator */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-4 rounded-full transition-all duration-300 ${
                  i < state.serenityLevel
                    ? 'bg-gradient-to-t from-blue-400 to-purple-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Divine Reminder */}
      {showReminder && (
        <motion.div
          className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={refreshReminder}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <p className="text-white/40 text-xs mb-1">✨ Divine Reminder (tap to refresh)</p>
          <p className="text-white/80 text-sm italic">{reminder}</p>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        {/* Sacred Breathing */}
        {showBreathing && (
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'breathing' ? null : 'breathing')}
              className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🌬️</span>
                <span className="text-white/80 text-sm">Sacred Breathing</span>
              </div>
              <motion.span
                className="text-white/40"
                animate={{ rotate: activeSection === 'breathing' ? 180 : 0 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {activeSection === 'breathing' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 pt-3">
                    {QUICK_BREATHING_OPTIONS.map(({ pattern, name, duration, icon }) => (
                      <motion.button
                        key={pattern}
                        onClick={() => handleStartBreathing(pattern)}
                        className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-xl mb-1">{icon}</span>
                        <span className="text-white/70 text-xs">{name}</span>
                        <span className="text-white/40 text-[10px]">{duration}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Divine Moments */}
        {showMoments && (
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'moments' ? null : 'moments')}
              className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💫</span>
                <span className="text-white/80 text-sm">Divine Moments</span>
              </div>
              <motion.span
                className="text-white/40"
                animate={{ rotate: activeSection === 'moments' ? 180 : 0 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {activeSection === 'moments' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 pt-3">
                    {DIVINE_MOMENTS.map(({ type, name, icon }) => (
                      <motion.button
                        key={type}
                        onClick={() => handleStartDivineMoment(type)}
                        className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-xl mb-1">{icon}</span>
                        <span className="text-white/70 text-xs text-center">{name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quick KIAAN Access */}
      <motion.button
        className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/10 rounded-xl text-white/90 transition-all flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>Talk to KIAAN</span>
        <span className="text-lg">💙</span>
      </motion.button>

      {/* Sacred Breathing Modal */}
      <SacredBreathingModal
        pattern={selectedBreathingPattern}
        isOpen={breathingModalOpen}
        onClose={handleCloseBreathingModal}
        cycles={3}
      />

      {/* Divine Moment Modal - rendered conditionally to trigger autoShow */}
      {divineMomentOpen && (
        <DivineMoment
          type={selectedMomentType}
          autoShow={true}
          duration={30}
          onComplete={handleCloseDivineMoment}
        />
      )}
    </motion.div>
  );
}

export default SacredDashboardWidget;
