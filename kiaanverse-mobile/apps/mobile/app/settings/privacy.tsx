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

export default function PrivacySettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: status, refetch, isLoading: statusLoading } = usePrivacyStatus();
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
          ? 'You can request one export per 24 hours.'
          : 'Failed to queue export. Please try again.';
      Alert.alert('Export', msg);
    }
  }, [requestExport]);

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
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      'Delete Your Account',
      'Your account will be scheduled for permanent deletion in 30 days. ' +
        'During this time you can cancel at any time.\n\n' +
        '• All data permanently erased\n' +
        '• Stripe subscription cancelled\n' +
        '• Encrypted journal entries deleted\n' +
        '• Cannot be undone after 30 days',
      [
        { text: 'Keep My Account', style: 'cancel' },
        {
          text: 'Delete in 30 Days',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestDeletion.mutateAsync(undefined);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } catch {
              Alert.alert('Error', 'Failed to schedule deletion. Please try again.');
            }
          },
        },
      ],
    );
  }, [requestDeletion]);

  const handleCancelDeletion = useCallback(() => {
    Alert.alert(
      'Cancel Deletion',
      'Your account will be fully restored. Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Keep My Account',
          onPress: async () => {
            try {
              await cancelDeletion.mutateAsync();
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to cancel deletion. Please try again.');
            }
          },
        },
      ],
    );
  }, [cancelDeletion]);

  // ─── Helpers ──────────────────────────────────────────
  const gracePeriodDate = status?.deletion?.grace_period_ends_at
    ? new Date(status.deletion.grace_period_ends_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const isExportReady = exportStatus === 'completed';
  const isExportPending = exportStatus === 'pending' || exportStatus === 'processing';
  const isDeletionPending = deletionStatus === 'grace_period';

  return (
    <Screen scroll>
      <GoldenHeader title="Your Privacy" onBack={() => router.back()} />

      {/* Deletion banner */}
      {isDeletionPending && gracePeriodDate && (
        <Card style={[styles.card, styles.dangerCard]}>
          <Text variant="label" color={colors.semantic.error}>
            Account Deletion Scheduled
          </Text>
          <Text variant="caption" color={colors.text.muted} style={styles.mt4}>
            Your account will be permanently deleted on{' '}
            <Text variant="caption" color={colors.text.primary}>
              {gracePeriodDate}
            </Text>
            .
          </Text>
          <Pressable
            onPress={handleCancelDeletion}
            disabled={cancelDeletion.isPending}
            style={styles.mt8}
          >
            <Text variant="caption" color={colors.primary[500]} style={styles.underline}>
              {cancelDeletion.isPending ? 'Cancelling…' : 'Cancel deletion request'}
            </Text>
          </Pressable>
        </Card>
      )}

      {/* Export section */}
      <SectionHeader title="Download My Data" />
      <Card style={styles.card}>
        <Text variant="caption" color={colors.text.muted} style={styles.mb8}>
          Art. 20 — Right to data portability. Includes your conversations,
          practice data, and account info as a ZIP archive.
        </Text>

        {isExportReady && (
          <GoldenButton title="Download ZIP" onPress={handleDownload} />
        )}

        {isExportPending && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text variant="caption" color={colors.text.secondary}>
              {exportStatus === 'pending' ? 'Export queued…' : 'Building your archive…'}
            </Text>
          </View>
        )}

        {(!exportStatus || exportStatus === 'failed' || exportStatus === 'expired') && (
          <GoldenButton
            title={requestExport.isPending ? 'Requesting…' : 'Request Export'}
            onPress={handleRequestExport}
            disabled={requestExport.isPending}
          />
        )}

        {status?.export?.expires_at && isExportReady && (
          <Text variant="caption" color={colors.text.muted} style={[styles.mt4, styles.textCenter]}>
            Link expires{' '}
            {new Date(status.export.expires_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        )}
      </Card>

      {/* Delete section */}
      <SectionHeader title="Delete My Account" />
      <Card style={styles.card}>
        <Text variant="caption" color={colors.text.muted} style={styles.mb8}>
          Art. 17 — Right to erasure. All your data will be permanently
          deleted after a 30-day grace period.
        </Text>

        {!isDeletionPending && (
          <Pressable
            onPress={handleRequestDeletion}
            disabled={requestDeletion.isPending}
            style={styles.dangerButton}
          >
            <Text variant="label" color={colors.semantic.error}>
              {requestDeletion.isPending ? 'Scheduling…' : 'Request Account Deletion'}
            </Text>
          </Pressable>
        )}
      </Card>

      {/* Footer */}
      <Text variant="caption" color={colors.text.muted} style={styles.footer}>
        Questions? privacy@kiaanverse.com
      </Text>
    </Screen>
  );
}

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <Text variant="caption" color={colors.text.muted} style={styles.sectionHeader}>
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
