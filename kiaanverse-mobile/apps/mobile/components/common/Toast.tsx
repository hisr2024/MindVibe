/**
 * Toast — global notification toasts driven by uiStore.toastQueue.
 *
 * Renders the front toast from the FIFO queue. Each toast slides in from
 * the top, displays for its duration (default 3s), then auto-dismisses.
 * When one toast dismisses, the next in the queue appears.
 *
 * Variants:
 *   success — green left border, checkmark feel
 *   error   — red left border, alert feel
 *   warning — amber left border, caution feel
 *   info    — blue left border, informational
 *
 * Positioning: absolute overlay below the safe area top inset so it
 * clears the status bar and any navigation headers.
 *
 * Usage: Components never render this directly — they call
 *   useUiStore.getState().addToast({ message, type })
 * and this component picks it up automatically.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import { useUiStore, type Toast as ToastType } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Variant color map
// ---------------------------------------------------------------------------

const VARIANT_COLORS: Record<ToastType['type'], string> = {
  success: colors.semantic.success,
  error: colors.semantic.error,
  warning: colors.semantic.warning,
  info: colors.semantic.info,
};

const DEFAULT_DURATION = 3000;

// ---------------------------------------------------------------------------
// Single Toast Item
// ---------------------------------------------------------------------------

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastType;
  onDismiss: (id: string) => void;
}): React.JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    onDismiss(toast.id);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION;
    timerRef.current = setTimeout(dismiss, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, dismiss]);

  const accentColor = VARIANT_COLORS[toast.type];

  return (
    <Animated.View
      entering={SlideInUp.duration(250).springify().damping(18)}
      exiting={SlideOutUp.duration(200)}
      style={[styles.toast, { borderLeftColor: accentColor }]}
    >
      <Pressable
        onPress={dismiss}
        style={styles.toastContent}
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
      >
        <Animated.View entering={FadeIn.delay(50)} style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={3}>
            {toast.message}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Toast Container — renders the front toast from the queue
// ---------------------------------------------------------------------------

export function ToastContainer(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const toastQueue = useUiStore((s) => s.toastQueue);
  const removeToast = useUiStore((s) => s.removeToast);

  // Only show the front toast — queue processes sequentially
  const currentToast = toastQueue[0];

  if (!currentToast) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(100)}
      style={[styles.container, { top: insets.top + spacing.xs }]}
      pointerEvents="box-none"
    >
      <ToastItem
        key={currentToast.id}
        toast={currentToast}
        onDismiss={removeToast}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 10000,
  },
  toast: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    // Subtle elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.text.primary,
  },
});
