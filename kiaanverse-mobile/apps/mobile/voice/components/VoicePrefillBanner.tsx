/**
 * VoicePrefillBanner — visible-confirmation ribbon for the
 * INPUT_TO_TOOL contract.
 *
 * Per the FINAL.2 spec, when Sakha navigates a user into a tool with
 * a prefilled payload (e.g. "I'm taking you to Emotional Reset and
 * I've carried over the work-anxiety we just discussed"), the
 * destination MUST surface a brief, dismissible visual confirmation
 * — silent navigation with mystery prefill is anti-trust.
 *
 * Design contract:
 *   • teal→gold gradient ribbon at the top of the screen,
 *   • Devanagari + English caption,
 *   • a single dismiss tap target (44dp min) that calls onDismiss,
 *   • auto-dismisses after 8s (caller can override via autoDismissMs).
 *
 * Pair with `useVoicePrefill`:
 *
 *   const { prefill, isVoicePrefilled, acknowledge } =
 *     useVoicePrefill<...>('ARDHA');
 *
 *   {isVoicePrefilled && (
 *     <VoicePrefillBanner
 *       label={prefill.split_theme ?? 'your reflection'}
 *       onDismiss={acknowledge}
 *     />
 *   )}
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

const DEFAULT_AUTO_DISMISS_MS = 8000;

export interface VoicePrefillBannerProps {
  /** Short noun phrase summarising what was carried over.
   *  E.g. 'work anxiety', 'सीमा with my brother', 'today's mood'. */
  label: string;
  /** Caller-provided dismiss handler. Hook the result of
   *  useVoicePrefill().acknowledge here. */
  onDismiss: () => void;
  /** Override the 8 s auto-dismiss timer. 0 disables auto-dismiss. */
  autoDismissMs?: number;
}

export function VoicePrefillBanner({
  label,
  onDismiss,
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
}: VoicePrefillBannerProps): React.JSX.Element {
  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onDismiss]);

  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      exiting={FadeOutUp.duration(200)}
      style={styles.wrap}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <LinearGradient
        colors={['#0e7490', '#d4a017']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss voice prefill notice"
          style={({ pressed }) => [
            styles.tap,
            pressed && styles.tapPressed,
          ]}
          hitSlop={8}
        >
          <View style={styles.row}>
            <Text variant="caption" color={colors.neutral[50]} style={styles.devanagari}>
              ✦ सखा से लाया
            </Text>
            <Text variant="caption" color={colors.neutral[50]} style={styles.english}>
              From your conversation: {label}
            </Text>
            <Text variant="caption" color={colors.neutral[100]} style={styles.dismiss}>
              Tap to dismiss
            </Text>
          </View>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  gradient: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  tap: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  tapPressed: { opacity: 0.7 },
  row: {
    flexDirection: 'column',
    gap: 2,
  },
  devanagari: {
    fontWeight: '600',
  },
  english: {
    opacity: 0.95,
  },
  dismiss: {
    opacity: 0.75,
    fontSize: 11,
    marginTop: 2,
  },
});
