/**
 * Privacy Settings — GDPR data export + account deletion (mobile).
 *
 * Mirrors the web ``/settings/privacy`` page. Endpoints hit the
 * backend directly (``/api/v1/privacy/*``) via the shared Axios
 * client which already handles JWT auth + token refresh.
 *
 * - Download My Data (Art. 20) — queue export, poll status, open
 *   signed download link in the browser.
 * - Delete My Account (Art. 17) — confirm → 30-day grace → cancel.
 */

import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  GoldenButton,
  Divider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import {
  usePrivacyStatus,
  useCancelDeletion,
  useRequestDeletion,
  useRequestExport,
} from '@kiaanverse/api';
import { API_CONFIG } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

export default function PrivacySettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const {
    data: status,
    refetch,
    isLoading: statusLoading,
  } = usePrivacyStatus();
  const requestExport = useRequestExport();
  const requestDeletion = useRequestDeletion();
  const cancelDeletion = useCancelDeletion();

  const [polling, setPolling] = useState(false);

  const exportStatus = status?.export?.status;
  const deletionStatus = status?.deletion?.status;

  // ─── Export ──────────────────────────────────────────
  const handleRequestExport = useCallback(async () => {
    void Haptics.selectionAsync();
    try {
      await requestExport.mutateAsync();
      startPolling();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { status: number } })?.response?.status === 429
          ? t('privacyExportRateLimited')
          : t('privacyExportFailed');
      Alert.alert(t('privacyExportAlertTitle'), msg);
    }
  }, [requestExport, t]);

  const startPolling = useCallback(() => {
    if (polling) return;
    setPolling(true);
    const id = setInterval(async () => {
      const { data: fresh } = await refetch();
      const s = fresh?.export?.status;
      if (!s || ['completed', 'failed', 'expired'].includes(s)) {
        clearInterval(id);
        setPolling(false);
        if (s === 'completed') {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        }
      }
    }, 10_000);
  }, [polling, refetch]);

  const handleDownload = useCallback(() => {
    const token = status?.export?.download_token;
    if (!token) return;
    const url = `${API_CONFIG.baseURL}/api/v1/privacy/export?token=${encodeURIComponent(token)}`;
    void Linking.openURL(url);
  }, [status]);

  // ─── Deletion ──────────────────────────────────────────
  const handleRequestDeletion = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t('privacyDeleteAlertTitle'),
      t('privacyDeleteAlertBody'),
      [
        { text: t('privacyKeepAccount'), style: 'cancel' },
        {
          text: t('privacyDelete30Days'),
          style: 'destructive',
          onPress: async () => {
            try {
              await requestDeletion.mutateAsync(undefined);
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
              );
            } catch {
              Alert.alert(
                t('privacyErrorTitle'),
                t('privacyDeletionFailed')
              );
            }
          },
        },
      ]
    );
  }, [requestDeletion, t]);

  const handleCancelDeletion = useCallback(() => {
    Alert.alert(
      t('privacyCancelDelTitle'),
      t('privacyCancelDelBody'),
      [
        { text: t('privacyNoButton'), style: 'cancel' },
        {
          text: t('privacyYesKeepButton'),
          onPress: async () => {
            try {
              await cancelDeletion.mutateAsync();
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            } catch {
              Alert.alert(
                t('privacyErrorTitle'),
                t('privacyCancelDelFailed')
              );
            }
          },
        },
      ]
    );
  }, [cancelDeletion, t]);

  // ─── Helpers ──────────────────────────────────────────
  const gracePeriodDate = status?.deletion?.grace_period_ends_at
    ? new Date(status.deletion.grace_period_ends_at).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      )
    : null;

  const isExportReady = exportStatus === 'completed';
  const isExportPending =
    exportStatus === 'pending' || exportStatus === 'processing';
  const isDeletionPending = deletionStatus === 'grace_period';

  return (
    <Screen scroll>
      <GoldenHeader title={t('privacyTitle')} onBack={() => router.back()} />

      {/* Deletion banner */}
      {isDeletionPending && gracePeriodDate && (
        <Card style={[styles.card, styles.dangerCard]}>
          <Text variant="label" color={colors.semantic.error}>
            {t('privacyDeletionBannerTitle')}
          </Text>
          <Text variant="caption" color={colors.text.muted} style={styles.mt4}>
            {t('privacyDeletionBannerFmt', { date: gracePeriodDate })}
          </Text>
          <Pressable
            onPress={handleCancelDeletion}
            disabled={cancelDeletion.isPending}
            style={styles.mt8}
          >
            <Text
              variant="caption"
              color={colors.primary[500]}
              style={styles.underline}
            >
              {cancelDeletion.isPending
                ? t('privacyCancellingButton')
                : t('privacyCancelRequestLink')}
            </Text>
          </Pressable>
        </Card>
      )}

      {/* Export section */}
      <SectionHeader title={t('privacyExportSection')} />
      <Card style={styles.card}>
        <Text variant="caption" color={colors.text.muted} style={styles.mb8}>
          {t('privacyExportDesc')}
        </Text>

        {isExportReady && (
          <GoldenButton title={t('privacyDownloadButton')} onPress={handleDownload} />
        )}

        {isExportPending && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text variant="caption" color={colors.text.secondary}>
              {exportStatus === 'pending'
                ? t('privacyExportQueued')
                : t('privacyExportBuilding')}
            </Text>
          </View>
        )}

        {(!exportStatus ||
          exportStatus === 'failed' ||
          exportStatus === 'expired') && (
          <GoldenButton
            title={requestExport.isPending ? t('privacyRequestingButton') : t('privacyRequestExport')}
            onPress={handleRequestExport}
            disabled={requestExport.isPending}
          />
        )}

        {status?.export?.expires_at && isExportReady && (
          <Text
            variant="caption"
            color={colors.text.muted}
            style={[styles.mt4, styles.textCenter]}
          >
            {t('privacyLinkExpiresFmt', {
              date: new Date(status.export.expires_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            })}
          </Text>
        )}
      </Card>

      {/* Delete section */}
      <SectionHeader title={t('privacyDeleteSection')} />
      <Card style={styles.card}>
        <Text variant="caption" color={colors.text.muted} style={styles.mb8}>
          {t('privacyDeleteDesc')}
        </Text>

        {!isDeletionPending && (
          <Pressable
            onPress={handleRequestDeletion}
            disabled={requestDeletion.isPending}
            style={styles.dangerButton}
          >
            <Text variant="label" color={colors.semantic.error}>
              {requestDeletion.isPending
                ? t('privacySchedulingButton')
                : t('privacyRequestDeletion')}
            </Text>
          </Pressable>
        )}
      </Card>

      {/* Footer */}
      <Text variant="caption" color={colors.text.muted} style={styles.footer}>
        {t('privacyFooterEmail')}
      </Text>
    </Screen>
  );
}

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <Text
      variant="caption"
      color={colors.text.muted}
      style={styles.sectionHeader}
    >
      {title.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.04)',
    marginTop: spacing.sm,
  },
  sectionHeader: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mb8: { marginBottom: 8 },
  textCenter: { textAlign: 'center' },
  underline: { textDecorationLine: 'underline' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: colors.primary[500],
  },
  dangerButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: radii.md,
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  footer: {
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});
