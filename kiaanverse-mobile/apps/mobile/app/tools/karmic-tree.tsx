/**
 * Karmic Tree — placeholder route.
 *
 * The full Karmic Tree visualisation hasn't shipped yet, but voice
 * navigation routes for KARMIC_TREE land here so the user never
 * sees a 404. Pattern-matches the audit findings in PR-G:
 * tool-prefill-contracts.ts has a KARMIC_TREE entry (allowedFields
 * = ['focus_area']) but no destination route existed on disk.
 *
 * When the real tree screen lands, replace this file's body with
 * the production component and the TOOL_ROUTES entry in
 * voice/hooks/useToolInvocation.ts can stay pointed at the same
 * /tools/karmic-tree path.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  DivineBackground,
  GoldenHeader,
  Text,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { VoicePrefillBanner } from '../../voice/components/VoicePrefillBanner';
import { useVoicePrefill } from '../../voice/hooks/useVoicePrefill';
import { useTranslation } from '@kiaanverse/i18n';

export default function KarmicTreeStub(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('tools');
  const voice = useVoicePrefill<{ focus_area?: string }>('KARMIC_TREE');

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      <GoldenHeader title={t('karmicTreeTitle')} onBack={() => router.back()} />

      {voice.isVoicePrefilled && (
        <VoicePrefillBanner
          label={voice.prefill?.focus_area ?? t('karmicTreeRootsFallback')}
          onDismiss={voice.acknowledge}
        />
      )}

      <View style={styles.body}>
        <Text style={styles.sanskrit}>कर्म वृक्ष</Text>
        <Text style={styles.title}>{t('karmicTreeTitle')}</Text>
        <Text style={styles.tagline}>{t('karmicTreeTagline1')}</Text>
        <Text style={styles.tagline}>{t('karmicTreeTagline2')}</Text>

        <Pressable
          onPress={() => router.replace('/tools')}
          accessibilityRole="button"
          accessibilityLabel={t('karmicTreeBackToArmoryA11y')}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{t('karmicTreeBackToArmoryCta')}</Text>
        </Pressable>
      </View>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  sanskrit: {
    fontSize: 36,
    color: colors.primary[400],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    color: colors.neutral[50],
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: colors.neutral[300],
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary[600],
  },
  ctaText: {
    color: colors.neutral[50],
    fontSize: 16,
    fontWeight: '600',
  },
});
