/**
 * Register Screen
 *
 * Account creation with:
 * - Zod schema validation (name, email, password, confirmPassword)
 * - react-hook-form for form state + inline field errors
 * - Password match validation via zod .refine()
 * - LoadingMandala during registration
 * - Email verification message after successful signup
 *
 * Backend contract: Signup returns NO tokens. The user must verify their
 * email address before they can log in (backend returns 403 on unverified).
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
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

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RegisterScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const {
    signup,
    error,
    clearError,
    status: _status,
    isLoading,
    signupPendingVerification,
    signupEmail,
    signupVerificationSent,
    clearSignupPending,
  } = useAuthStore();
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      clearError();
      await signup(data.email.trim(), data.password, data.name.trim());
    },
    [signup, clearError]
  );

  const handleGoToLogin = useCallback(() => {
    clearSignupPending();
    router.replace('/(auth)/login');
  }, [clearSignupPending, router]);

  // Show mandala while registering
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <LoadingMandala size={160} />
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Creating your account...
          </Text>
        </View>
      </Screen>
    );
  }

  // ──── Resend (used by the "delivery failed" branch below) ─────────────
  const handleResend = useCallback(async () => {
    if (!signupEmail) {
      setResendError(
        `We do not have your email on file. Try signing up again or email ${SUPPORT_EMAIL}.`,
      );
      return;
    }
    setResending(true);
    setResendError(null);
    try {
      await authService.resendVerification(signupEmail);
      setResendSent(true);
    } catch (err) {
      setResendError(
        (err as { message?: string })?.message ??
          `Could not send a fresh email right now. Please email ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setResending(false);
    }
  }, [signupEmail]);

  // After successful signup — show one of two outcome screens.
  if (signupPendingVerification) {
    // Branch A: backend confirmed the email actually shipped. Original
    // happy-path copy.
    if (signupVerificationSent) {
      return (
        <Screen>
          <View style={styles.verificationContainer}>
            <Text variant="h2" align="center">
              Check your email
            </Text>
            <Text variant="body" color={colors.text.muted} align="center">
              We sent a verification link to{' '}
              <Text color={colors.primary[500]}>{signupEmail ?? 'your email'}</Text>
              . Please verify your email before signing in.
            </Text>
            <GoldenButton
              title="Go to Sign In"
              onPress={handleGoToLogin}
              testID="go-to-login-button"
            />
          </View>
        </Screen>
      );
    }

    // Branch B: account exists but the verification email FAILED to send
    // (provider not configured / domain unverified / sandbox restriction
    // / rate-limit). Earlier builds silently fell through to the form here,
    // leaving the user with no signal — that was a primary cause of the
    // "I created an account and never got an email" bug. Tell them honestly.
    return (
      <Screen>
        <View style={styles.verificationContainer}>
          <Text variant="h2" align="center" color={colors.semantic.error}>
            Account created, but…
          </Text>
          <Text variant="body" color={colors.text.muted} align="center">
            Your account was created, but we could not send the verification
            email to{' '}
            <Text color={colors.primary[500]}>{signupEmail ?? 'your email'}</Text>
            .{'\n\n'}
            Tap below to try sending the link again. If it still does not
            arrive, please contact{' '}
            <Text color={colors.primary[500]}>{SUPPORT_EMAIL}</Text>.
          </Text>

          {resendSent ? (
            <Text variant="body" color={colors.primary[500]} align="center">
              ✓ A fresh verification email is on its way.
            </Text>
          ) : null}
          {resendError ? (
            <Text variant="caption" color={colors.semantic.error} align="center">
              {resendError}
            </Text>
          ) : null}

          <GoldenButton
            title={resending ? 'Sending…' : 'Resend verification email'}
            onPress={handleResend}
            disabled={resending}
            testID="resend-verification-button"
          />
          <GoldenButton
            title="Go to Sign In"
            variant="secondary"
            onPress={handleGoToLogin}
            testID="go-to-login-button"
          />
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
            Create Account
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Begin your spiritual journey
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('name')}
                placeholder="Your full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
            )}
          />

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
                placeholder="At least 8 characters"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}
          />

          {/* Server-side error (e.g. email already taken, password policy) */}
          {error ? (
            <Text variant="caption" color={colors.semantic.error}>
              {error}
            </Text>
          ) : null}

          <GoldenButton
            title={t('register')}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            testID="register-button"
          />
        </View>

        <Divider />

        <View style={styles.footer}>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            {t('hasAccount')}{' '}
          </Text>
          <Link href="/(auth)/login">
            <Text variant="label" color={colors.primary[300]}>
              {t('login')}
            </Text>
          </Link>
        </View>
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
  verificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
