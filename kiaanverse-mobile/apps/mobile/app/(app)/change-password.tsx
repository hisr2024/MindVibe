/**
 * Change Password — POST /api/auth/change-password.
 *
 * Backend contract (backend/routes/auth.py `change_password`):
 *   body:     { current_password, new_password, revoke_other_sessions? }
 *   errors:   403 WRONG_PASSWORD, 422 SAME_PASSWORD / VALIDATION_ERROR
 *   policy:   ≥ 8 chars, upper + lower + digit + special, not common
 *   response: { message, sessions_revoked }
 *
 * The client-side policy mirrored below exists to catch obvious mistakes
 * before we round-trip — the server remains the authority. We still
 * surface whatever the server says verbatim on 422 so the user sees the
 * specific rule they violated ("must contain at least one special
 * character" etc.) rather than a generic "please try again".
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  DivineScreenWrapper,
  GoldenButton,
  GoldenDivider,
  SacredInput,
} from '@kiaanverse/ui';
import { apiClient } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

const TEXT_PRIMARY = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.5)';
const TEXT_TERTIARY = 'rgba(240,235,225,0.4)';

/** Surface a FastAPI error body — `detail` can be a string or `{detail, code}`. */
function extractErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { detail?: unknown } } })
    .response;
  const detail = response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') {
    const inner = detail as { detail?: unknown; message?: unknown };
    if (typeof inner.detail === 'string') return inner.detail;
    if (typeof inner.message === 'string') return inner.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Client-side pre-flight validation matching the server policy. Returns
 *  the i18n key of the violated rule, or null when the password passes. */
function validateNewPassword(pwd: string, current: string): string | null {
  if (pwd.length < 8) return 'settings.passwordMinChars';
  if (pwd.length > 128) return 'settings.passwordMaxChars';
  if (!/[A-Z]/.test(pwd)) return 'settings.passwordNeedsUpper';
  if (!/[a-z]/.test(pwd)) return 'settings.passwordNeedsLower';
  if (!/[0-9]/.test(pwd)) return 'settings.passwordNeedsDigit';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'settings.passwordNeedsSpecial';
  if (current.length > 0 && pwd === current)
    return 'settings.passwordSameAsCurrent';
  return null;
}

export default function ChangePasswordScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const fieldsFilled =
    current.length > 0 && newPass.length > 0 && confirm.length > 0;

  const previewErrorKey = useMemo(() => {
    if (!newPass && !confirm) return null;
    if (newPass && confirm && newPass !== confirm)
      return 'settings.passwordsMustMatch';
    if (newPass) return validateNewPassword(newPass, current);
    return null;
  }, [newPass, confirm, current]);

  const handleChange = async () => {
    if (newPass !== confirm) {
      Alert.alert(
        t('settings.passwordsMismatchTitle'),
        t('settings.passwordsMismatchMessage'),
      );
      return;
    }
    const policyKey = validateNewPassword(newPass, current);
    if (policyKey) {
      Alert.alert(t('settings.passwordTooWeakTitle'), t(policyKey));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        current_password: current,
        new_password: newPass,
      });
      Alert.alert(
        t('settings.passwordChangedTitle'),
        t('settings.passwordChangedMessage'),
        [{ text: t('common.ok'), onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert(
        t('settings.couldNotChangePasswordTitle'),
        extractErrorMessage(err, t('settings.genericRetry')),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DivineScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('settings.back')}
            hitSlop={12}
          >
            <Text style={styles.backText}>{`‹ ${t('settings.back')}`}</Text>
          </Pressable>

          <Text style={styles.title}>{t('settings.changePasswordTitle')}</Text>
          <Text style={styles.lede}>{t('settings.changePasswordLede')}</Text>

          <GoldenDivider style={styles.divider} />

          <SacredInput
            value={current}
            onChangeText={setCurrent}
            placeholder={t('settings.currentPasswordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            containerStyle={styles.inputGap}
          />
          <SacredInput
            value={newPass}
            onChangeText={setNewPass}
            placeholder={t('settings.newPasswordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            containerStyle={styles.inputGap}
          />
          <SacredInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder={t('settings.confirmPasswordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            {...(previewErrorKey ? { error: t(previewErrorKey) } : {})}
            containerStyle={styles.inputGap}
          />

          <Text style={styles.rule}>{t('settings.passwordRule')}</Text>

          <GoldenButton
            title={
              loading
                ? t('settings.changingButton')
                : t('settings.changePasswordButton')
            }
            onPress={handleChange}
            loading={loading}
            disabled={loading || !fieldsFilled || previewErrorKey !== null}
            style={styles.cta}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </DivineScreenWrapper>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  backBtn: { marginBottom: 20 },
  backText: {
    fontSize: 15,
    color: TEXT_MUTED,
    fontFamily: 'Outfit-Regular',
  },
  title: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: TEXT_PRIMARY,
  },
  lede: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    fontFamily: 'CrimsonText-Italic',
  },
  divider: { marginVertical: 20 },
  inputGap: { marginBottom: 12 },
  rule: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: TEXT_TERTIARY,
    fontFamily: 'Outfit-Regular',
  },
  cta: { marginTop: 24 },
});
