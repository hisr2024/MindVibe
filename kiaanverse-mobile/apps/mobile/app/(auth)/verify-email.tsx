/**
 * Verify Email Screen — deep-link handler.
 *
 * Reachable by tapping the link in the verification email
 * (`{FRONTEND_URL}/verify-email?token=...`) when the OS resolves the
 * link to the app via the `kiaanverse` URL scheme + universal links
 * declared in `app.config.ts`. The backend route is
 * `POST /api/auth/verify-email` (`backend/routes/auth.py:1130`).
 *
 * Three render states:
 *   pending — `OmLoader` + "Verifying your email…" while the API call is in flight
 *   success — gold checkmark + auto-redirect to /(auth)/login after 2s
 *   error   — friendly message + Resend button (calls /api/auth/resend-verification)
 *
 * The screen never holds an authenticated session of its own; it just
 * confirms the token and bounces the user back to login. The login
 * screen will then accept their credentials because `email_verified` is
 * now true on the backend.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@kiaanverse/api';
import {
  GoldenButton,
  OmLoader,
  Screen,
  Text,
  colors,
  spacing,
  useTheme,
} from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

type Phase = 'pending' | 'success' | 'error';

const SUPPORT_EMAIL = 'thesacredquest2@gmail.com';

export default function VerifyEmailScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';
  const email = typeof params.email === 'string' ? params.email : '';
  const { theme } = useTheme();

  const [phase, setPhase] = useState<Phase>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Verify on mount.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setPhase('error');
      setErrorMessage(t('verifyNoToken'));
      return;
    }
    (async () => {
      try {
        await authService.verifyEmail(token);
        if (cancelled) return;
        setPhase('success');
        // Hand off to the login door after a beat so the user sees the
        // "verified" confirmation before being redirected.
        setTimeout(() => {
          if (!cancelled) router.replace('/(auth)/login');
        }, 2000);
      } catch (err) {
        if (cancelled) return;
        const message =
          (err as { message?: string })?.message ?? t('verifyCouldNotVerify');
        setPhase('error');
        setErrorMessage(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const handleResend = useCallback(async () => {
    if (!email) {
      setErrorMessage(t('verifyNeedEmailToResend'));
      return;
    }
    setResending(true);
    try {
      await authService.resendVerification(email);
      setResendSent(true);
    } catch (err) {
      setErrorMessage(
        (err as { message?: string })?.message ??
          t('verifyCouldNotSendNow', { supportEmail: SUPPORT_EMAIL }),
      );
    } finally {
      setResending(false);
    }
  }, [email, t]);

  return (
    <Screen
      gradient
      gradientVariant="sacred"
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.center}>
        {phase === 'pending' ? (
          <>
            <OmLoader size={72} />
            <Text variant="h2" align="center" style={styles.title}>
              {t('verifyVerifyingTitle')}
            </Text>
            <Text
              variant="caption"
              color={colors.text.secondary}
              align="center"
              style={styles.body}
            >
              {t('verifyVerifyingBody')}
            </Text>
          </>
        ) : phase === 'success' ? (
          <>
            <Text style={styles.checkmark}>✓</Text>
            <Text variant="h2" color={colors.primary[500]} align="center" style={styles.title}>
              {t('verifySuccessTitle')}
            </Text>
            <Text
              variant="caption"
              color={colors.text.secondary}
              align="center"
              style={styles.body}
            >
              {t('verifySuccessBody')}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.crossmark}>!</Text>
            <Text variant="h2" align="center" style={styles.title}>
              {t('verifyErrorTitle')}
            </Text>
            <Text
              variant="caption"
              color={colors.text.secondary}
              align="center"
              style={styles.body}
            >
              {errorMessage ?? t('verifyErrorBody')}
            </Text>
            {resendSent ? (
              <Text
                variant="caption"
                color={colors.primary[500]}
                align="center"
                style={styles.body}
              >
                {t('verifyFreshEmailOnTheWayTo', { email })}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <GoldenButton
                title={
                  resending
                    ? t('verifySending')
                    : t('verifyResendVerificationEmail')
                }
                onPress={handleResend}
                disabled={resending || !email}
              />
              <GoldenButton
                title={t('verifyBackToSignIn')}
                variant="secondary"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
            <Text
              variant="caption"
              color={colors.text.muted}
              align="center"
              style={styles.support}
            >
              {t('verifyStillStuck', { supportEmail: SUPPORT_EMAIL })}
            </Text>
          </>
        )}
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
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.lg,
  },
  body: {
    maxWidth: 360,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  support: {
    marginTop: spacing.xl,
  },
  checkmark: {
    fontSize: 64,
    color: colors.primary[500],
  },
  crossmark: {
    fontSize: 64,
    color: colors.semantic.error,
    fontWeight: '700',
  },
});
