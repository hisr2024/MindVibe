/**
 * Forgot Password Screen
 *
 * Email-only form for password reset requests.
 * Shows a confirmation message after submission regardless of
 * whether the email exists (prevents user enumeration).
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import {
  Screen,
  Text,
  Input,
  GoldenButton,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = useCallback(async () => {
    if (!isValidEmail) return;
    setLoading(true);

    // Simulate network delay — no backend endpoint exists yet.
    // When the API is ready, call api.auth.forgotPassword(email) here.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setLoading(false);
    setSubmitted(true);
  }, [isValidEmail]);

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text variant="h1" align="center">
            {t('forgotHeaderTitle')}
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            {t('forgotHeaderSubtitle')}
          </Text>
        </View>

        {submitted ? (
          <View style={styles.successCard}>
            <Text variant="h3" align="center" color={colors.primary[300]}>
              {t('forgotCheckInbox')}
            </Text>
            <Text variant="body" color={colors.text.secondary} align="center">
              {t('forgotResetLinkBody', { email })}
            </Text>
            <View style={styles.backLink}>
              <Link href="/(auth)/login">
                <Text variant="label" color={colors.primary[300]}>
                  {t('forgotBackToLogin')}
                </Text>
              </Link>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.form}>
              <Input
                label={t('forgotEmailLabel')}
                placeholder={t('forgotEmailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <GoldenButton
                title={t('forgotSendResetLink')}
                onPress={handleSubmit}
                loading={loading}
                disabled={!isValidEmail}
                testID="forgot-password-submit"
              />
            </View>

            <View style={styles.footer}>
              <Text
                variant="bodySmall"
                color={colors.text.muted}
                align="center"
              >
                {t('forgotRememberPassword')}{' '}
              </Text>
              <Link href="/(auth)/login">
                <Text variant="label" color={colors.primary[300]}>
                  {t('forgotSignIn')}
                </Text>
              </Link>
            </View>
          </>
        )}
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
  successCard: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
