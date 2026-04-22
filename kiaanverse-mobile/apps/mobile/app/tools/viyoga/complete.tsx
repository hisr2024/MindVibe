/**
 * Viyoga — Completion
 *
 * All five flames lit, OM glyph, "VIYOGA COMPLETE" caption, the date of
 * the offering, and three actions: return to home, journal this, talk
 * to Sakha. Reaching this screen implies the Sacred Fire ritual finished
 * so we also reset the transient flow state — a user tapping into
 * Viyoga again should arrive fresh.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSacredFlow } from '@/hooks/useSacredFlow';

const FLAME_COUNT = 5;

function formatOfferedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ViyogaComplete(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { resetFlow } = useSacredFlow('viyoga');

  const offeredDate = useMemo(formatOfferedDate, []);

  // Reset the in-memory flow once the user lands here. We do this on
  // unmount so the date/copy above reads correctly during this session
  // but the next Viyoga start is clean.
  useEffect(() => {
    return () => {
      resetFlow();
    };
  }, [resetFlow]);

  const handleHome = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  const handleJournal = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/journal');
  };

  const handleSakha = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/chat');
  };

  return (
    <View
      style={[
        s.screen,
        {
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      <View
        style={s.flames}
        accessibilityLabel={`All ${FLAME_COUNT} flames are lit`}
      >
        {Array.from({ length: FLAME_COUNT }).map((_, i) => (
          <Text key={i} style={s.flame}>🔥</Text>
        ))}
      </View>

      <Text style={s.om} accessibilityLabel="OM">ॐ</Text>

      <Text style={s.complete}>VIYOGA COMPLETE</Text>

      <Text style={s.date}>Offered on {offeredDate}</Text>

      <View style={s.buttons}>
        <TouchableOpacity
          style={s.btn}
          onPress={handleHome}
          accessibilityRole="button"
          accessibilityLabel="Return to home"
        >
          <Text style={s.btnText}>Return to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btn}
          onPress={handleJournal}
          accessibilityRole="button"
          accessibilityLabel="Journal this offering"
        >
          <Text style={s.btnText}>Journal This</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btn}
          onPress={handleSakha}
          accessibilityRole="button"
          accessibilityLabel="Talk to Sakha"
        >
          <Text style={[s.btnText, s.btnTextGold]}>Talk to Sakha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030510',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  flames: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  flame: {
    fontSize: 24,
  },
  om: {
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 72,
    color: '#D4A017',
    lineHeight: 72 * 1.4,
    marginBottom: 16,
  },
  complete: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: 'rgba(212,160,23,0.8)',
    letterSpacing: 3.25,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  date: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: 'rgba(240,235,225,0.35)',
    marginBottom: 48,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  btn: {
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 17,
    color: 'rgba(240,235,225,0.75)',
  },
  btnTextGold: {
    color: '#D4A017',
  },
});
