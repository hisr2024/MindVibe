/**
 * VoiceOnboarding — first-use flow.
 *
 * Three steps:
 *   1. "Sakha is Krishna's voice as a companion" intro
 *   2. Microphone permission request (expo-av Audio.requestPermissions)
 *   3. Brief mood baseline (one-tap chips: anxious / sad / lonely /
 *      curious / grateful / other) — pinned to SecureStore so the
 *      first turn's mood detection has a starting point.
 *
 * Auto-advances on permission grant; falls back to a "settings →
 * permissions" CTA when denied.
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';
import { Color, Spacing, Type } from '../../lib/theme';
import { useVoiceStore } from '../../stores/voiceStore';

const MOOD_PRESETS = [
  'anxious', 'sad', 'lonely', 'angry',
  'overwhelmed', 'curious', 'grateful', 'other',
] as const;

const PERSISTED_MOOD_KEY = 'sakha:onboarding_mood';

export default function VoiceOnboarding() {
  const router = useRouter();
  const personaMismatch = useVoiceStore((s) => s.personaMismatch);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [permission, setPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [chosenMood, setChosenMood] = useState<string | null>(null);

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
      const result = await Audio.requestPermissionsAsync();
      setPermission(result.status === 'granted' ? 'granted' : 'denied');
      if (result.status === 'granted') setStep(2);
      return;
    }
    if (step === 2 && chosenMood) {
      await SecureStore.setItemAsync(PERSISTED_MOOD_KEY, chosenMood);
      router.replace('/voice');
    }
  };

  const handleSkipMood = async () => {
    router.replace('/voice');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {personaMismatch ? (
          <PersonaMismatchPanel />
        ) : step === 0 ? (
          <IntroPanel onNext={handleNext} />
        ) : step === 1 ? (
          <PermissionPanel permission={permission} onRetry={handleNext} />
        ) : (
          <MoodPanel
            chosen={chosenMood}
            onChoose={setChosenMood}
            onContinue={handleNext}
            onSkip={handleSkipMood}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function IntroPanel({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.deva}>सखा</Text>
      <Text style={styles.headline}>Sakha</Text>
      <Text style={styles.body}>
        Krishna's voice — as a companion. Speak. Be heard. Hear back.
      </Text>
      <Text style={styles.bodySmall}>
        Audio leaves your phone only while you are speaking. Your reflections
        are encrypted and yours alone.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Begin"
        style={styles.primaryBtn}
        onPress={onNext}
      >
        <Text style={styles.primaryBtnText}>Begin</Text>
      </Pressable>
    </View>
  );
}

function PermissionPanel({
  permission,
  onRetry,
}: {
  permission: 'pending' | 'granted' | 'denied';
  onRetry: () => void;
}) {
  if (permission === 'pending') {
    return (
      <View style={styles.panel}>
        <Text style={styles.headline}>Asking for the microphone…</Text>
        <Text style={styles.body}>Sakha needs to hear you.</Text>
      </View>
    );
  }
  if (permission === 'granted') {
    return (
      <View style={styles.panel}>
        <Text style={styles.headline}>Thank you</Text>
      </View>
    );
  }
  return (
    <View style={styles.panel}>
      <Text style={styles.headline}>Microphone is needed</Text>
      <Text style={styles.body}>
        Without microphone access, Sakha cannot hear you. You can change
        this later in your phone's app settings.
      </Text>
      <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={onRetry}>
        <Text style={styles.primaryBtnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function MoodPanel({
  chosen,
  onChoose,
  onContinue,
  onSkip,
}: {
  chosen: string | null;
  onChoose: (m: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.headline}>How are you, right now?</Text>
      <Text style={styles.body}>
        Pick what's closest. Sakha will hear the rest.
      </Text>
      <View style={styles.moodGrid}>
        {MOOD_PRESETS.map((m) => {
          const isChosen = chosen === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={'Mood: ' + m}
              style={[styles.moodChip, isChosen ? styles.moodChipChosen : null]}
              onPress={() => onChoose(m)}
            >
              <Text style={[styles.moodText, isChosen ? styles.moodTextChosen : null]}>
                {m}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!chosen}
        style={[styles.primaryBtn, !chosen ? styles.primaryBtnDisabled : null]}
        onPress={onContinue}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

function PersonaMismatchPanel() {
  return (
    <View style={styles.panel}>
      <Text style={styles.headline}>An update is waiting</Text>
      <Text style={styles.body}>
        The Sakha you have on this phone is from an earlier moment.
        Please update the app to hear today's voice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Color.cosmicVoid },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  panel: { alignItems: 'center', gap: Spacing.md },
  deva: {
    ...Type.sanskrit,
    color: Color.divineGoldBright,
    fontSize: 48, lineHeight: 56,
    marginBottom: Spacing.sm,
  },
  headline: { ...Type.display, color: Color.textPrimary, textAlign: 'center' },
  body: { ...Type.body, color: Color.textSecondary, textAlign: 'center' },
  bodySmall: { ...Type.caption, color: Color.textTertiary, textAlign: 'center' },
  primaryBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Color.divineGold,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: Color.divineGoldDim, opacity: 0.5 },
  primaryBtnText: { ...Type.body, color: Color.cosmicVoid, fontWeight: '700' },
  skipText: { ...Type.caption, color: Color.textTertiary, marginTop: Spacing.sm },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  moodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Color.divider,
    backgroundColor: 'transparent',
  },
  moodChipChosen: {
    borderColor: Color.divineGoldBright,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  moodText: { ...Type.body, color: Color.textSecondary },
  moodTextChosen: { color: Color.divineGoldBright },
});
