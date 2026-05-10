/**
 * Verify Email Pending Screen.
 *
 * Where the AuthGate routes any authenticated user whose
 * `email_verified` is still false (a stale-token rehydrate from a build
 * that didn't enforce verification, or a session created when the
 * backend's REQUIRE_EMAIL_VERIFICATION was off). They are NOT allowed
 * into /(tabs) until they verify, but they are also not signed out —
 * they just sit here, can resend the email, then tap the link.
 *
 * Two actions:
 *   • Resend verification email — POSTs `/api/auth/resend-verification`
 *   • Sign out                  — clears the stale session via authStore.logout
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@kiaanverse/api';
import { useAuthStore } from '@kiaanverse/store';
import {
  GoldenButton,
  Screen,
  Text,
  colors,
  spacing,
  useTheme,
} from '@kiaanverse/ui';

const SUPPORT_EMAIL = 'thesacredquest2@gmail.com';

export default function VerifyEmailPendingScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const email = user?.email ?? '';

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = useCallback(async () => {
    if (!email) {
      setError('We do not have your email on file. Please sign out and sign in again.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await authService.resendVerification(email);
      setSent(true);
    } catch (err) {
      setError(
        (err as { message?: string })?.message ??
          `Could not send a fresh email right now. Try again or email ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setSending(false);
    }
  }, [email]);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.replace('/(auth)/login');
  }, [logout]);

  return (
    <Screen
      gradient
      gradientVariant="sacred"
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.center}>
        <Text style={styles.glyph}>📧</Text>
        <Text variant="h2" align="center" style={styles.title}>
          One last step
        </Text>
        <Text
          variant="caption"
          color={colors.text.secondary}
          align="center"
          style={styles.body}
        >
          We sent a verification link to{'\n'}
          <Text color={colors.primary[500]}>{email || 'your email'}</Text>.
          {'\n\n'}
          Tap it to confirm your address. Once verified, you can return here and continue.
        </Text>

        {sent ? (
          <Text
            variant="caption"
            color={colors.primary[500]}
            align="center"
            style={styles.body}
          >
            ✓ Fresh email on its way. Check your inbox (and spam folder).
          </Text>
        ) : null}
        {error ? (
          <Text
            variant="caption"
            color={colors.semantic.error}
            align="center"
            style={styles.body}
          >
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <GoldenButton
            title={sending ? 'Sending…' : 'Resend verification email'}
            onPress={handleResend}
            disabled={sending || !email}
          />
          <GoldenButton
            title="Sign out"
            variant="secondary"
            onPress={handleSignOut}
          />
        </View>

        <Text
          variant="caption"
          color={colors.text.muted}
          align="center"
          style={styles.support}
        >
          Need help? Email {SUPPORT_EMAIL}.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  glyph: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  body: {
    maxWidth: 380,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  support: {
    marginTop: spacing.xl,
  },
});
