/**
 * Register Screen
 *
 * Account creation with name, email, and password.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Input, Button, Divider, colors, spacing } from '@kiaanverse/ui';
import { useAuthStore } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

export default function RegisterScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const { signup, error, clearError, status } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValid = name.trim().length >= 2 && email.includes('@') && password.length >= 8;

  const handleSignup = useCallback(async () => {
    if (!isValid) return;
    clearError();
    await signup(email.trim(), password, name.trim());
  }, [email, password, name, isValid, signup, clearError]);

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text variant="h1" align="center">Create Account</Text>
          <Text variant="bodySmall" color={colors.divine.muted} align="center">
            Begin your spiritual journey
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('name')}
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />

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
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {error ? (
            <Text variant="caption" color={colors.semantic.error}>
              {error}
            </Text>
          ) : null}

          <Button
            title={t('register')}
            onPress={handleSignup}
            loading={status === 'loading'}
            disabled={!isValid}
          />
        </View>

        <Divider />

        <View style={styles.footer}>
          <Text variant="bodySmall" color={colors.divine.muted} align="center">
            {t('hasAccount')}{' '}
          </Text>
          <Link href="/(auth)/login">
            <Text variant="label" color={colors.gold[400]}>
              {t('login')}
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
    paddingVertical: spacing['5xl'],
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing['4xl'],
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
