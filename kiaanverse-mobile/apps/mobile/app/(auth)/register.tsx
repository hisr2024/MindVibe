/**
 * Register Screen
 *
 * Account creation with:
 * - Zod schema validation (name, email, password, confirmPassword)
 * - react-hook-form for form state + inline field errors
 * - Password match validation via zod .refine()
 * - LoadingMandala during registration
 *
 * Security: confirmPassword validated client-side before any API call.
 */

import React, { useCallback } from 'react';
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
import { useTranslation } from '@kiaanverse/i18n';

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
  const { signup, error, clearError, status } = useAuthStore();

  const isLoading = status === 'loading';

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
    [signup, clearError],
  );

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

          {/* Server-side error (e.g. email already taken) */}
          {error ? (
            <Text variant="caption" color={colors.semantic.error}>
              {error}
            </Text>
          ) : null}

          <GoldenButton
            title={t('register')}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
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
