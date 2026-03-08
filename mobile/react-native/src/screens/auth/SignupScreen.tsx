/**
 * Signup Screen
 *
 * New account creation with:
 * - Name, email, and password fields
 * - Confirm password validation
 * - Password strength indicator
 * - Terms of service acknowledgment
 * - Automatic login after successful signup
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuthStore } from '@state/stores/authStore';
import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';
import type { AuthStackParamList } from '@app-types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(name: string, email: string, password: string, confirm: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.name = 'Name is required';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'Please enter a valid email';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'At least 8 characters';
  if (password !== confirm) errors.confirm = 'Passwords do not match';
  return errors;
}

function getPasswordStrength(p: string): { label: string; color: string; width: string } {
  if (p.length === 0) return { label: '', color: 'transparent', width: '0%' };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  if (score <= 1) return { label: 'Weak', color: colors.semantic.error, width: '20%' };
  if (score <= 2) return { label: 'Fair', color: colors.semantic.warning, width: '40%' };
  if (score <= 3) return { label: 'Good', color: colors.gold[400], width: '60%' };
  if (score <= 4) return { label: 'Strong', color: colors.semantic.success, width: '80%' };
  return { label: 'Excellent', color: colors.semantic.success, width: '100%' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { signup, status, error, clearError } = useAuthStore();
  const isLoading = status === 'loading';
  const strength = getPasswordStrength(password);

  const handleSignup = useCallback(async () => {
    clearError();
    const formErrors = validate(name, email, password, confirm);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    await signup(email.trim().toLowerCase(), password, name.trim());
  }, [name, email, password, confirm, signup, clearError]);

  const renderField = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    fieldError: string | undefined,
    opts: {
      ref?: React.RefObject<TextInput>;
      nextRef?: React.RefObject<TextInput>;
      secure?: boolean;
      keyboardType?: 'email-address' | 'default';
      autoComplete?: string;
      textContentType?: string;
      placeholder?: string;
    } = {},
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        ref={opts.ref as React.Ref<TextInput>}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: fieldError ? colors.semantic.error : theme.inputBorder,
            color: theme.textPrimary,
          },
        ]}
        value={value}
        onChangeText={(t) => {
          onChange(t);
          if (errors[label.toLowerCase() as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [label.toLowerCase()]: undefined }));
          }
        }}
        placeholder={opts.placeholder ?? ''}
        placeholderTextColor={theme.textTertiary}
        secureTextEntry={opts.secure}
        keyboardType={opts.keyboardType}
        autoCapitalize={opts.keyboardType === 'email-address' ? 'none' : 'words'}
        autoComplete={opts.autoComplete as 'name' | 'email' | 'password' | 'password-new' | undefined}
        textContentType={opts.textContentType as 'name' | 'emailAddress' | 'newPassword' | undefined}
        returnKeyType={opts.nextRef ? 'next' : 'done'}
        onSubmitEditing={() => opts.nextRef?.current?.focus() ?? handleSignup()}
        editable={!isLoading}
        accessibilityLabel={label}
      />
      {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing['2xl'], paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ color: theme.accent, fontSize: 18 }}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Begin Your Journey
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Create your MindVibe account
          </Text>
        </View>

        {/* Server Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Form Fields */}
        {renderField('Name', name, setName, errors.name, {
          nextRef: emailRef,
          autoComplete: 'name',
          textContentType: 'name',
          placeholder: 'Your name',
        })}

        {renderField('Email', email, setEmail, errors.email, {
          ref: emailRef,
          nextRef: passwordRef,
          keyboardType: 'email-address',
          autoComplete: 'email',
          textContentType: 'emailAddress',
          placeholder: 'you@example.com',
        })}

        {renderField('Password', password, setPassword, errors.password, {
          ref: passwordRef,
          nextRef: confirmRef,
          secure: true,
          autoComplete: 'password-new',
          textContentType: 'newPassword',
          placeholder: 'At least 8 characters',
        })}

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            <View style={[styles.strengthBar, { backgroundColor: theme.inputBorder }]}>
              <View
                style={[
                  styles.strengthFill,
                  { backgroundColor: strength.color, width: strength.width as unknown as number },
                ]}
              />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
          </View>
        )}

        {renderField('Confirm', confirm, setConfirm, errors.confirm, {
          ref: confirmRef,
          secure: true,
          placeholder: 'Repeat password',
        })}

        {/* Signup Button */}
        <TouchableOpacity
          style={[
            styles.signupButton,
            { backgroundColor: theme.accent, opacity: isLoading ? 0.7 : 1 },
          ]}
          onPress={handleSignup}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.divine.black} />
          ) : (
            <Text style={styles.signupButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: theme.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
          >
            <Text style={[styles.loginLink, { color: theme.accent }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
  },
  backButton: {
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  fieldError: {
    ...typography.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    ...typography.caption,
    fontWeight: '500',
    width: 64,
    textAlign: 'right',
  },
  signupButton: {
    height: 52,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  signupButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
  },
  loginLink: {
    ...typography.body,
    fontWeight: '600',
  },
});
