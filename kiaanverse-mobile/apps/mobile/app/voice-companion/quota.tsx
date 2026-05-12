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
import { Color, Spacing, Type } from '../../voice/lib/theme';
import { useVoiceStore } from '../../voice/stores/voiceStore';
import { useTranslation } from '@kiaanverse/i18n';

// Tier label/subtitle is resolved at render via t() so each locale
// gets localized copy without changing the tier IDs (which feed the
// backend over the quota.reason wire format).
const TIER_KEYS: Record<
  'free' | 'bhakta' | 'sadhak' | 'siddha',
  { labelKey: string; subtitleKey: string }
> = {
  free: { labelKey: 'vcQuotaTierFree', subtitleKey: 'vcQuotaTierFreeSub' },
  bhakta: { labelKey: 'vcQuotaTierBhakta', subtitleKey: 'vcQuotaTierBhaktaSub' },
  sadhak: { labelKey: 'vcQuotaTierSadhak', subtitleKey: 'vcQuotaTierSadhakSub' },
  siddha: { labelKey: 'vcQuotaTierSiddha', subtitleKey: 'vcQuotaTierSiddhaSub' },
};

export default function VoiceQuotaSheet() {
  const router = useRouter();
  const { t } = useTranslation('voice');
  const quota = useVoiceStore((s) => s.quota);

  if (!quota) {
    router.replace('/voice');
    return null;
  }

  return (
    <SafeAreaView style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('vcQuotaCloseA11y')}
        style={styles.dismissArea}
        onPress={() => router.back()}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.headline}>{t('vcQuotaHeadline')}</Text>
          <Text style={styles.body}>{quota.reason}</Text>

          <View style={styles.matrix}>
            {(['free', 'bhakta', 'sadhak', 'siddha'] as const).map((tier) => {
              const isCurrent = tier === quota.tier;
              const preset = TIER_KEYS[tier];
              return (
                <View
                  key={tier}
                  style={[styles.tierRow, isCurrent ? styles.tierRowCurrent : null]}
                >
                  <View style={styles.tierMeta}>
                    <Text style={[styles.tierLabel, isCurrent ? styles.tierLabelCurrent : null]}>
                      {t(preset.labelKey)}
                    </Text>
                    <Text style={styles.tierSubtitle}>{t(preset.subtitleKey)}</Text>
                  </View>
                  {isCurrent ? <Text style={styles.youBadge}>{t('vcQuotaYou')}</Text> : null}
                </View>
              );
            })}
          </View>

          <Text style={styles.note}>{t('vcQuotaNote')}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vcQuotaUpgradeA11y')}
            style={styles.cta}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.ctaText}>{t('vcQuotaWalkFurther')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('vcQuotaNotNowA11y')}
            style={styles.dismissBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.dismissText}>{t('vcQuotaNotNow')}</Text>
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
