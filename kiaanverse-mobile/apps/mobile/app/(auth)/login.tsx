/**
 * Login Screen — Divine Temple redesign
 *
 * Visual layer only. All auth wiring preserved:
 *   - Zod schema validation (email format, password min 8 chars)
 *   - react-hook-form for form state + inline field errors
 *   - useAuthStore.login / authenticateWithBiometric / devLogin
 *   - Same Link destinations: /(auth)/forgot-password, /(auth)/register
 *   - Same testIDs: login-button, biometric-button, dev-login-button
 *
 * Design tokens (local to this screen — do NOT promote to theme yet):
 *   - Background gradient: #1a0f08 → #0d0806 → #050303 (warm midnight)
 *   - Primary gold: #d4a44c   Secondary: #e8bc5c   Deep: #8b6914
 *   - Text: #f4e4bc (cream)   Muted: #a89074 (taupe)
 *   - Error: #c46a3a (warm amber — not clinical red)
 *
 * Typography:
 *   CrimsonText-Regular is loaded in app/_layout.tsx via useFonts.
 *   If the font fails to load (non-fatal), React Native falls back to
 *   the platform serif. We never block the screen on font readiness.
 *
 * Security: No credentials logged. Tokens handled by authStore + SecureStore.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Text as RNText,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  ScrollView,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { useAuthStore } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

// ---------------------------------------------------------------------------
// Divine palette (local — intentionally not shared via theme)
// ---------------------------------------------------------------------------

const palette = {
  bgTop: '#1a0f08',
  bgMid: '#0d0806',
  bgBottom: '#050303',
  goldPrimary: '#d4a44c',
  goldHighlight: '#e8bc5c',
  goldDeep: '#8b6914',
  textCream: '#f4e4bc',
  textMuted: '#a89074',
  inputBg: 'rgba(212, 164, 76, 0.06)',
  inputBorder: 'rgba(212, 164, 76, 0.25)',
  inputBorderFocus: 'rgba(212, 164, 76, 0.6)',
  cardBg: 'rgba(26, 15, 8, 0.6)',
  cardBorder: 'rgba(212, 164, 76, 0.12)',
  errorWarm: '#c46a3a',
};

const FONT_SERIF = 'CrimsonText-Regular';

// Ornament asset — the existing diya/flame notification icon doubles as a
// sacred lamp glyph here. Falls back gracefully if the require() fails.
const ornamentSource = require('../../assets/notification-icon.png');

// ---------------------------------------------------------------------------
// Validation Schema — UNCHANGED from original
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
// DivineInput — themed text input with warm amber wash + focus glow
// ---------------------------------------------------------------------------

interface DivineInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | undefined;
}

function DivineInput({
  label,
  error,
  onFocus,
  onBlur,
  ...props
}: DivineInputProps): React.JSX.Element {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={inputStyles.container}>
      <RNText style={inputStyles.label}>{label}</RNText>
      <View
        style={[
          inputStyles.inputWrap,
          { borderColor: focused ? palette.inputBorderFocus : palette.inputBorder },
          error ? { borderColor: palette.errorWarm } : null,
        ]}
      >
        <TextInput
          {...props}
          style={inputStyles.input}
          placeholderTextColor={palette.textMuted}
          selectionColor={palette.goldPrimary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
      {error ? <RNText style={inputStyles.error}>{error}</RNText> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// DivineButton — gold-gradient primary action
// ---------------------------------------------------------------------------

interface DivineButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

function DivineButton({
  title,
  onPress,
  disabled,
  loading,
  testID,
  accessibilityLabel,
}: DivineButtonProps): React.JSX.Element {
  const inert = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inert}
      activeOpacity={0.85}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      style={[buttonStyles.wrap, inert ? buttonStyles.wrapDisabled : null]}
    >
      <LinearGradient
        colors={[palette.goldHighlight, palette.goldPrimary, palette.goldDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={buttonStyles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={palette.bgMid} />
        ) : (
          <RNText style={buttonStyles.label}>{title}</RNText>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// GhostButton — secondary "Create Account" style
// ---------------------------------------------------------------------------

interface GhostButtonProps {
  title: string;
  onPress: () => void;
  testID?: string;
}

function GhostButton({ title, onPress, testID }: GhostButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={ghostStyles.wrap}
    >
      <RNText style={ghostStyles.label}>{title}</RNText>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// PulsingOrnament — subtle opacity breath on the hero flame
// ---------------------------------------------------------------------------

function PulsingOrnament(): React.JSX.Element {
  // Using the built-in Animated API (not reanimated) keeps this screen
  // independent of worklet setup and works on every platform target.
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={heroStyles.ornamentHalo} accessible={false}>
      <Animated.View style={[heroStyles.ornamentWrap, { opacity }]}>
        <Image
          source={ornamentSource}
          style={heroStyles.ornamentImage}
          resizeMode="contain"
          accessible={false}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LoginScreen(): React.JSX.Element {
  const { t } = useTranslation('auth');
  const {
    login,
    error,
    clearError,
    status: _status,
    isLoading,
    biometricAvailable,
    biometricEnabled,
    authenticateWithBiometric,
    devLogin,
  } = useAuthStore();

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

  return (
    <View style={styles.root}>
      {/* Warm midnight gradient replaces the flat black void */}
      <LinearGradient
        colors={[palette.bgTop, palette.bgMid, palette.bgBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Amber radial-ish glow behind the hero. A stacked LinearGradient with
          transparent edges approximates a radial fall-off cheaply (no Skia). */}
      <View pointerEvents="none" style={styles.auraContainer}>
        <LinearGradient
          colors={['rgba(212, 164, 76, 0.18)', 'rgba(212, 164, 76, 0.04)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.aura}
        />
      </View>

      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={heroStyles.hero}>
              <PulsingOrnament />
              <View style={{ height: 20 }} />
              <RNText style={heroStyles.title} accessibilityRole="header">
                Kiaanverse
              </RNText>
              <View style={{ height: 8 }} />
              <RNText style={heroStyles.tagline}>Your spiritual companion</RNText>
              <View style={{ height: 4 }} />
              <RNText style={heroStyles.subtagline}>SAKHA AWAITS</RNText>
            </View>

            <View style={{ height: 56 }} />

            {/* Form card */}
            <View style={styles.card}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <DivineInput
                    label={(t('email') || 'Email').toString().toUpperCase()}
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

              <View style={{ height: 16 }} />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <DivineInput
                    label={(t('password') || 'Password').toString().toUpperCase()}
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

              {/* Server-side error — warm amber, not clinical red */}
              {error ? (
                <RNText style={styles.serverError} accessibilityLiveRegion="polite">
                  {error}
                </RNText>
              ) : null}
            </View>

            <View style={{ height: 20 }} />

            <DivineButton
              title={(t('login') || 'Sign In').toString()}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid}
              loading={isLoading}
              testID="login-button"
              accessibilityLabel="Sign in to Kiaanverse"
            />

            <View style={{ height: 16 }} />

            <View style={styles.forgotRow}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password"
                >
                  <RNText style={styles.forgotLink}>Forgot password?</RNText>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Biometric — only when available + previously enabled */}
            {biometricAvailable && biometricEnabled ? (
              <>
                <View style={{ height: 16 }} />
                <GhostButton
                  title="Sign in with biometrics"
                  onPress={handleBiometric}
                  testID="biometric-button"
                />
              </>
            ) : null}

            <View style={{ height: 32 }} />

            {/* Divider with a tiny gold dot in the middle */}
            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            <View style={{ height: 24 }} />

            <RNText style={styles.footerLead}>
              {t('noAccount') || "Don't have an account?"}
            </RNText>

            <View style={{ height: 12 }} />

            <Link href="/(auth)/register" asChild>
              <GhostButton
                title={(t('register') || 'Create Account').toString()}
                onPress={() => {
                  /* navigation handled by Link */
                }}
              />
            </Link>

            {/* Developer mode bypass — only in development builds */}
            {__DEV__ ? (
              <>
                <View style={{ height: 24 }} />
                <TouchableOpacity
                  onPress={devLogin}
                  testID="dev-login-button"
                  accessibilityRole="button"
                  accessibilityLabel="Developer login bypass"
                  style={styles.devBtn}
                >
                  <RNText style={styles.devBtnLabel}>Dev Login</RNText>
                </TouchableOpacity>
              </>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgBottom,
  },
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  auraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    alignItems: 'center',
  },
  aura: {
    width: 520,
    height: 420,
    opacity: 0.9,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    backgroundColor: palette.cardBg,
    borderColor: palette.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  serverError: {
    marginTop: 12,
    fontSize: 13,
    color: palette.errorWarm,
    fontFamily: Platform.select({ ios: undefined, android: undefined }),
  },
  forgotRow: {
    alignItems: 'flex-end',
  },
  forgotLink: {
    color: palette.goldPrimary,
    fontSize: 14,
    fontFamily: FONT_SERIF,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(212, 164, 76, 0.2)',
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.goldPrimary,
    marginHorizontal: 12,
    shadowColor: palette.goldHighlight,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  footerLead: {
    textAlign: 'center',
    color: palette.textCream,
    opacity: 0.7,
    fontSize: 14,
  },
  devBtn: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 164, 76, 0.3)',
    backgroundColor: 'rgba(212, 164, 76, 0.04)',
  },
  devBtnLabel: {
    color: palette.textMuted,
    fontSize: 13,
    letterSpacing: 1.2,
  },
});

const heroStyles = StyleSheet.create({
  hero: {
    alignItems: 'center',
  },
  ornamentHalo: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    // Soft golden halo — shadow on iOS, elevation-ish on Android
    shadowColor: palette.goldPrimary,
    shadowOpacity: 0.8,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  ornamentWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornamentImage: {
    width: 56,
    height: 56,
    // tintColor lets the existing monochrome notification icon adopt the
    // warm gold palette without shipping a new asset.
    tintColor: palette.goldHighlight,
  },
  title: {
    fontFamily: FONT_SERIF,
    fontSize: 44,
    color: palette.goldPrimary,
    letterSpacing: 2,
    textShadowColor: 'rgba(212, 164, 76, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    fontFamily: FONT_SERIF,
    fontSize: 16,
    color: palette.textCream,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  subtagline: {
    fontSize: 12,
    color: palette.goldPrimary,
    opacity: 0.75,
    letterSpacing: 1.8,
    marginTop: 2,
  },
});

const inputStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  input: {
    color: palette.textCream,
    fontSize: 16,
    paddingVertical: 12,
    // Subtle — avoids iOS default green-ish caret on dark inputs
    ...Platform.select({
      web: { outlineStyle: 'none' as unknown as undefined },
      default: {},
    }),
  },
  error: {
    marginTop: 8,
    color: palette.errorWarm,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});

const buttonStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: palette.goldPrimary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  wrapDisabled: {
    opacity: 0.55,
  },
  gradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: FONT_SERIF,
    fontSize: 18,
    color: '#2a1a08',
    letterSpacing: 1.2,
  },
});

const ghostStyles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.goldPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: FONT_SERIF,
    fontSize: 16,
    color: palette.goldPrimary,
    letterSpacing: 1.1,
  },
});
