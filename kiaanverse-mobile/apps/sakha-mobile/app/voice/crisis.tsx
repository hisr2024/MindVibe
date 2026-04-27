/**
 * CrisisOverlay — full-screen, NON-DISMISSIBLE crisis routing.
 *
 * Per spec, when a ServerCrisisFrame arrives the player has already
 * been stopped + heavy haptic fired (useCrisisHandler). This screen
 * renders the visible response:
 *   • "You are not alone" headline (warm, never frightening)
 *   • Helpline list with one-tap dial
 *   • "I am safe" CTA (only path to dismiss; calls acknowledge())
 *   • Steady warm light — no animations per spec
 */

import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Color, Spacing, Type } from '../../lib/theme';
import { selectCrisis, useVoiceStore } from '../../stores/voiceStore';
import { useCrisisHandler } from '../../hooks/voice/useCrisisHandler';

export default function CrisisOverlay() {
  const router = useRouter();
  const crisis = useVoiceStore(selectCrisis);
  const { acknowledge } = useCrisisHandler();

  if (!crisis) {
    // Defensive — shouldn't render without crisis state, but if the
    // user got here directly, just bounce home.
    router.replace('/voice');
    return null;
  }

  const handleCall = (raw: string) => {
    const digits = raw.replace(/[^\d+]/g, '');
    if (!digits) return;
    Linking.openURL('tel:' + digits).catch(() => {});
  };

  const handleAcknowledge = async () => {
    await acknowledge();
    router.back();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headline}>You are not alone</Text>
        <Text style={styles.body}>
          Your feelings are real, and there is help — right now, on this phone.
          Please reach out to one of these lines.
        </Text>

        <View style={styles.helplineList}>
          {crisis.helpline.map((h) => (
            <Pressable
              key={h.name + h.number}
              accessibilityRole="button"
              accessibilityLabel={`Call ${h.name} at ${h.number}`}
              style={styles.helplineRow}
              onPress={() => handleCall(h.number)}
            >
              <View style={styles.helplineMeta}>
                <Text style={styles.helplineName}>{h.name}</Text>
                {h.is_24x7 ? <Text style={styles.helplineHours}>24×7</Text> : null}
              </View>
              <Text style={styles.helplineNumber}>{h.number}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.regionNote}>Region: {crisis.region} · {crisis.language.toUpperCase()}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I am safe — dismiss this overlay"
          style={styles.safeBtn}
          onPress={handleAcknowledge}
        >
          <Text style={styles.safeBtnText}>I am safe</Text>
        </Pressable>
        <Text style={styles.incidentId}>Incident · {crisis.incidentId.slice(0, 8)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Color.crisisWash },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
  },
  headline: {
    ...Type.display,
    color: Color.textCrisis,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  body: {
    ...Type.body,
    color: Color.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  helplineList: { gap: Spacing.md },
  helplineRow: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helplineMeta: { flex: 1 },
  helplineName: { ...Type.body, color: Color.textPrimary, fontWeight: '600' },
  helplineHours: { ...Type.micro, color: Color.textCrisis, marginTop: 2 },
  helplineNumber: { ...Type.hero, color: Color.divineGoldBright },
  regionNote: {
    ...Type.micro,
    color: Color.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  safeBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    minWidth: 220,
    alignItems: 'center',
  },
  safeBtnText: { ...Type.body, color: Color.textPrimary, fontWeight: '600' },
  incidentId: {
    ...Type.micro,
    color: Color.textTertiary,
    marginTop: Spacing.md,
  },
});
