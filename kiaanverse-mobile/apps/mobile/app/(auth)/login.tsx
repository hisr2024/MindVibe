/**
 * Login Screen
 *
 * Email/password authentication with:
 * - Zod schema validation (email format, password min 8 chars)
 * - react-hook-form for form state + inline field errors
 * - Biometric unlock button (when device supports + user enabled)
 * - LoadingMandala during authentication
 * - Developer mode bypass in __DEV__
 * - Handles 403 email_not_verified from backend
 *
 * Security: No credentials logged. Tokens handled by authStore + SecureStore.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import {
  Screen,
  Text,
  Input,
  GoldenButton,
  Divider,
  LoadingMandala,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useAuthStore } from '@kiaanverse/store';
import { authService } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

const SUPPORT_EMAIL = 'thesacredquest2@gmail.com';

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LoginScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const {
    login,
    error,
    clearError,
    status: _status,
    isLoading,
    biometricAvailable,
    biometricEnabled,
    authenticateWithBiometric,
    devLogin,
  } = useAuthStore();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  // Resend-verification side state. The store's `error` already holds the
  // friendly text when the backend returns 403 EMAIL_NOT_VERIFIED (handled
  // in authService.ts:104-110); we only need to detect the substring to
  // know whether to render the inline Resend button.
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const isUnverifiedError = Boolean(
    error &&
      /verify your email|EMAIL_NOT_VERIFIED|verification link/i.test(error),
  );

  const handleResendVerification = useCallback(async () => {
    const email = getValues('email').trim();
    if (!email) {
      setResendError('Enter your email above first.');
      return;
    }
    setResending(true);
    setResendError(null);
    try {
      await authService.resendVerification(email);
      setResendSent(true);
    } catch (err) {
      setResendError(
        (err as { message?: string })?.message ??
          `Could not send a fresh email. Please email ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setResending(false);
    }
  }, [getValues]);

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      clearError();
      await login(data.email.trim(), data.password);
    },
    [login, clearError]
  );

  const handleBiometric = useCallback(async () => {
    clearError();
    await authenticateWithBiometric();
  }, [authenticateWithBiometric, clearError]);

  // Show mandala while authenticating
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <LoadingMandala size={160} />
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Signing in...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text variant="h1" align="center">
            Kiaanverse
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Your spiritual companion
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('email')}
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('password')}
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
              />
            )}
          />

          {/* Server-side error (e.g. invalid credentials, email not verified) */}
          {error ? (
            <Text variant="caption" color={colors.semantic.error}>
              {error}
            </Text>
          ) : null}

          {/* When the backend returns 403 EMAIL_NOT_VERIFIED, give the user a
              one-tap recovery path right next to the error instead of a dead
              end. Mirrors the verify-email-pending screen but inline. */}
          {isUnverifiedError ? (
            <View style={{ gap: spacing.xs }}>
              {resendSent ? (
                <Text variant="caption" color={colors.primary[500]}>
                  ✓ Fresh verification email sent. Check your inbox (and spam).
                </Text>
              ) : null}
              {resendError ? (
                <Text variant="caption" color={colors.semantic.error}>
                  {resendError}
                </Text>
              ) : null}
              <GoldenButton
                title={resending ? 'Sending…' : 'Resend verification email'}
                variant="secondary"
                onPress={handleResendVerification}
                disabled={resending}
                testID="resend-verification-from-login"
              />
              <Text variant="caption" color={colors.text.muted}>
                Still nothing? Email {SUPPORT_EMAIL}.
              </Text>
            </View>
          ) : null}

          <GoldenButton
            title={t('login')}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            testID="login-button"
          />

          {/* Biometric unlock — shown only when available + previously enabled */}
          {biometricAvailable && biometricEnabled ? (
            <GoldenButton
              title="Sign in with biometrics"
              variant="secondary"
              onPress={handleBiometric}
              disabled={isLoading}
              testID="biometric-button"
            />
          ) : null}

          <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
            <Text variant="caption" color={colors.primary[300]}>
              Forgot password?
            </Text>
          </Link>
        </View>

        <Divider />

        <View style={styles.footer}>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            {t('noAccount')}{' '}
          </Text>
          <Link href="/(auth)/register">
            <Text variant="label" color={colors.primary[300]}>
              {t('register')}
            </Text>
          </Link>
        </View>

        {/* Developer mode bypass — only in development builds */}
        {__DEV__ ? (
          <View style={styles.devSection}>
            <GoldenButton
              title="Dev Login"
              variant="ghost"
              onPress={devLogin}
              testID="dev-login-button"
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  devSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
