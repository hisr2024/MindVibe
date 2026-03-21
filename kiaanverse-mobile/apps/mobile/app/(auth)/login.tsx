/**
 * Login Screen
 *
 * Email/password authentication with:
 * - Zod schema validation (email format, password min 8 chars)
 * - react-hook-form for form state + inline field errors
 * - Biometric unlock button (when device supports + user enabled)
 * - LoadingMandala during authentication
 * - Developer mode bypass in __DEV__
 *
 * Security: No credentials logged. Tokens handled by authStore + SecureStore.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { Fingerprint } from 'lucide-react-native';
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
import { useTranslation } from '@kiaanverse/i18n';

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
    status,
    biometricAvailable,
    biometricEnabled,
    authenticateWithBiometric,
    devLogin,
  } = useAuthStore();

  const isLoading = status === 'loading';

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      clearError();
      await login(data.email.trim(), data.password);
    },
    [login, clearError],
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

          {/* Server-side error (e.g. invalid credentials) */}
          {error ? (
            <Text variant="caption" color={colors.semantic.error}>
              {error}
            </Text>
          ) : null}

          <GoldenButton
            title={t('login')}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
            testID="login-button"
          />

          {/* Biometric unlock — shown only when available + previously enabled */}
          {biometricAvailable && biometricEnabled ? (
            <GoldenButton
              title="Sign in with biometrics"
              variant="secondary"
              onPress={handleBiometric}
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
