/**
 * VoiceQuotaSheet — gentle upgrade sheet shown when:
 *   • free tier (no voice access at all)
 *   • bhakta tier with daily 30-min cap exhausted
 *
 * Per spec: NO countdown timers. The sheet copy comes from the backend
 * (quota.reason) so localization stays consistent with the audio
 * pre-rendered for the same situation. Shows the full tier matrix so
 * the user can see what they'd unlock.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Color, Spacing, Type } from '../../lib/theme';
import { useVoiceStore } from '../../stores/voiceStore';

const TIER_PRESET: Record<
  'free' | 'bhakta' | 'sadhak' | 'siddha',
  { label: string; subtitle: string }
> = {
  free: { label: 'Free', subtitle: 'You are here' },
  bhakta: { label: 'Bhakta', subtitle: '30 min/day · Friend + Voice Guide' },
  sadhak: { label: 'Sadhak', subtitle: 'Unlimited · all engines · offline cache' },
  siddha: { label: 'Siddha', subtitle: 'Unlimited + priority queue + custom voice' },
};

export default function VoiceQuotaSheet() {
  const router = useRouter();
  const quota = useVoiceStore((s) => s.quota);

  if (!quota) {
    router.replace('/voice');
    return null;
  }

  return (
    <SafeAreaView style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.dismissArea}
        onPress={() => router.back()}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.headline}>Sakha is for those who walk further</Text>
          <Text style={styles.body}>{quota.reason}</Text>

          <View style={styles.matrix}>
            {(['free', 'bhakta', 'sadhak', 'siddha'] as const).map((t) => {
              const isCurrent = t === quota.tier;
              const preset = TIER_PRESET[t];
              return (
                <View
                  key={t}
                  style={[styles.tierRow, isCurrent ? styles.tierRowCurrent : null]}
                >
                  <View style={styles.tierMeta}>
                    <Text style={[styles.tierLabel, isCurrent ? styles.tierLabelCurrent : null]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.tierSubtitle}>{preset.subtitle}</Text>
                  </View>
                  {isCurrent ? <Text style={styles.youBadge}>you</Text> : null}
                </View>
              );
            })}
          </View>

          <Text style={styles.note}>
            No countdown. No pressure. Tap below to walk further whenever
            it feels right.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upgrade tier"
            style={styles.cta}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.ctaText}>Walk further</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Not now"
            style={styles.dismissBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(5,7,20,0.7)' },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: Color.cosmicVoidSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Spacing.lg,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 48, height: 4, borderRadius: 2,
    backgroundColor: Color.divider,
    marginTop: Spacing.sm, marginBottom: Spacing.md,
  },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headline: {
    ...Type.display,
    color: Color.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  body: {
    ...Type.body,
    color: Color.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  matrix: { gap: Spacing.sm },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierRowCurrent: {
    borderColor: Color.divineGoldDim,
    backgroundColor: 'rgba(212, 160, 23, 0.06)',
  },
  tierMeta: { flex: 1 },
  tierLabel: { ...Type.hero, color: Color.textPrimary },
  tierLabelCurrent: { color: Color.divineGoldBright },
  tierSubtitle: { ...Type.caption, color: Color.textSecondary },
  youBadge: {
    ...Type.micro,
    color: Color.cosmicVoid,
    backgroundColor: Color.divineGoldBright,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  note: {
    ...Type.caption,
    color: Color.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },
  footer: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  cta: {
    width: '100%',
    paddingVertical: Spacing.md,
    backgroundColor: Color.divineGold,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaText: { ...Type.body, color: Color.cosmicVoid, fontWeight: '700' },
  dismissBtn: { paddingVertical: Spacing.sm },
  dismissText: { ...Type.caption, color: Color.textTertiary },
});
