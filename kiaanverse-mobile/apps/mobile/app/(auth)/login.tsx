/**
 * Login Screen
 *
 * Email/password authentication with the MindVibe backend.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Input, Button, Divider, colors, spacing } from '@kiaanverse/ui';
import { useAuthStore } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

export default function LoginScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const { login, error, clearError, status } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;
    clearError();
    await login(email.trim(), password);
  }, [email, password, login, clearError]);

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text variant="h1" align="center">Kiaanverse</Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Your spiritual companion
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('email')}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Input
            label={t('password')}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />

          {error ? (
            <Text variant="caption" color={colors.semantic.error}>
              {error}
            </Text>
          ) : null}

          <Button
            title={t('login')}
            onPress={handleLogin}
            loading={status === 'loading'}
            disabled={!email.trim() || !password.trim()}
          />

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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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
});
