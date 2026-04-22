/**
 * Edit Profile — POST /api/profile.
 *
 * The backend profile route (backend/routes/profile.py) stores a separate
 * Profile row that carries the display name as `full_name`. The User row
 * still keeps its own `name` (used by the auth flow) — updating the
 * Profile row is what the rest of the app reads from `api.profile.me`.
 *
 * Backend contract (ProfileCreateUpdateIn):
 *   body:     { full_name?, base_experience }   ← base_experience REQUIRED
 *   response: { full_name, base_experience, ... }
 *
 * `base_experience` is a required non-empty string on every write. To
 * avoid clobbering an existing profile's value we read it back first via
 * GET and re-send what's there; when the user has no profile row yet
 * (GET returns 404) we seed `'new_user'` — the same sentinel the web
 * profile page uses at first-sign-in (app/profile/page.tsx).
 *
 * After the POST succeeds we reconcile the local authStore user so the
 * Profile tab + KIAAN greetings reflect the change immediately without
 * waiting for a refetch.
 */

import React, { useCallback, useState } from 'react';
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
import { api } from '@kiaanverse/api';
import { useAuthStore } from '@kiaanverse/store';

const TEXT_PRIMARY = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.5)';
const TEXT_TERTIARY = 'rgba(240,235,225,0.4)';

function extractErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { detail?: unknown } } }).response;
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

export default function EditProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState<string>(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  const trimmed = name.trim();
  const hasChanges = trimmed.length > 0 && trimmed !== (user?.name ?? '');

  const handleSave = useCallback(async () => {
    if (trimmed.length === 0) {
      Alert.alert('Name required', 'Your sacred name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      // Preserve whatever base_experience the backend already has; fall
      // back to 'new_user' when no profile row exists yet (first-time
      // write). Without this the POST would 422 because base_experience
      // is required and has no server-side default.
      let baseExperience = 'new_user';
      try {
        const { data: existing } = await api.profile.get();
        const existingBase = (existing as { base_experience?: unknown } | null)
          ?.base_experience;
        if (typeof existingBase === 'string' && existingBase.length > 0) {
          baseExperience = existingBase;
        }
      } catch (getErr) {
        // 404 = no profile yet; anything else is unexpected but non-fatal
        // for the write — we'll still attempt the POST with the sentinel.
        const status = (getErr as { statusCode?: number }).statusCode;
        if (status !== 404 && status !== undefined) {
          // eslint-disable-next-line no-console
          console.warn('[edit-profile] profile.get failed:', status, getErr);
        }
      }

      const { data } = await api.profile.update({
        full_name: trimmed,
        base_experience: baseExperience,
      });
      const nextName =
        (data as { full_name?: string | null } | null)?.full_name ?? trimmed;

      // Optimistically reconcile the authStore — Profile tab + KIAAN
      // greetings read from `user.name` and won't refetch until the next
      // app resume otherwise.
      if (user) {
        setUser({ ...user, name: nextName });
      }

      Alert.alert(
        'Profile updated',
        'Your sacred identity has been updated. 🙏',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert(
        'Could not update profile',
        extractErrorMessage(err, 'Please try again in a moment.'),
      );
    } finally {
      setLoading(false);
    }
  }, [trimmed, user, setUser, router]);

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
            accessibilityLabel="Back"
            hitSlop={12}
          >
            <Text style={styles.backText}>{'‹ Back'}</Text>
          </Pressable>

          <Text style={styles.title}>Edit Profile</Text>

          <GoldenDivider style={styles.divider} />

          <Text style={styles.label}>Display name</Text>
          <SacredInput
            value={name}
            onChangeText={setName}
            placeholder="Your sacred name"
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={styles.note}>
            This name appears on your profile and in KIAAN greetings.
          </Text>

          {user?.email ? (
            <>
              <Text style={[styles.label, styles.labelSpaced]}>Email</Text>
              <Text style={styles.readOnly}>{user.email}</Text>
              <Text style={styles.note}>
                Email changes are not yet supported. Contact support to update
                it.
              </Text>
            </>
          ) : null}

          <GoldenButton
            title={loading ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            loading={loading}
            disabled={loading || !hasChanges}
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
  divider: { marginVertical: 20 },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 20,
  },
  readOnly: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: TEXT_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(22,26,66,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.14)',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: TEXT_TERTIARY,
    fontFamily: 'Outfit-Regular',
  },
  cta: { marginTop: 32 },
});
