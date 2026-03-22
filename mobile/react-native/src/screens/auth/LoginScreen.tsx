/**
 * Login Screen
 *
 * Email/password authentication with:
 * - Form validation (email format, password length)
 * - Secure text entry with visibility toggle
 * - Error display from server responses
 * - Navigation to signup and forgot password
 * - Keyboard-aware scrolling for small screens
 * - Accessibility labels and hints
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuthStore } from '@state/stores/authStore';
import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';
import type { AuthStackParamList } from '@app-types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const { login, status, error, clearError } = useAuthStore();
  const isLoading = status === 'loading';

  const handleLogin = useCallback(async () => {
    clearError();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return;

    const success = await login(email.trim().toLowerCase(), password);
    if (!success) {
      // Error is set in the store and displayed below
    }
  }, [email, password, login, clearError]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing['3xl'], paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.accent }]}>MindVibe</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Welcome back to your journey
          </Text>
        </View>

        {/* Server Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Email Field */}
        <View style={styles.fieldGroup}>
          <Text
            style={[styles.label, { color: theme.textSecondary }]}
            accessibilityRole="text"
          >
            Email
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: emailError ? colors.semantic.error : theme.inputBorder,
                color: theme.textPrimary,
              },
            ]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            placeholder="you@example.com"
            placeholderTextColor={theme.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!isLoading}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your account email"
          />
          {emailError && (
            <Text style={styles.fieldError}>{emailError}</Text>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              ref={passwordRef}
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: passwordError ? colors.semantic.error : theme.inputBorder,
                  color: theme.textPrimary,
                },
              ]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Your password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              accessibilityLabel="Password"
              accessibilityHint="Enter your account password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
            >
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
          {passwordError && (
            <Text style={styles.fieldError}>{passwordError}</Text>
          )}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your email.')}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          accessibilityHint="Opens password reset dialog"
        >
          <Text style={[styles.forgotText, { color: theme.accent }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: theme.accent, opacity: isLoading ? 0.7 : 1 },
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          accessibilityHint="Signs into your MindVibe account"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.divine.black} />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Signup Link */}
        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: theme.textSecondary }]}>
            New to MindVibe?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
          >
            <Text style={[styles.signupLink, { color: theme.accent }]}>
              Create Account
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logo: {
    ...typography.h1,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 52,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldError: {
    ...typography.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing['2xl'],
  },
  forgotText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  loginButton: {
    height: 52,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  loginButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    ...typography.body,
  },
  signupLink: {
    ...typography.body,
    fontWeight: '600',
  },
});
