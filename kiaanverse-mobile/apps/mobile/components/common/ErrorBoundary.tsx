/**
 * ErrorBoundary — catches unhandled render errors in the component tree.
 *
 * Wraps all screens in the root _layout.tsx. When a child component throws
 * during render, this boundary:
 *   1. Sends the error to Sentry via errorTracking
 *   2. Shows a golden recovery card with a retry button
 *   3. Logs in __DEV__ for developer visibility
 *
 * Must be a class component — React's componentDidCatch is class-only.
 *
 * The fallback UI is styled to match the Kiaanverse cosmic dark theme and
 * uses a compassionate message. Users never see raw error text.
 */

import React, { type ErrorInfo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import { captureError, breadcrumb } from '../../services/errorTracking';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  /** Content to render when no error. */
  children: React.ReactNode;
  /** Optional custom fallback — receives error + retry callback. */
  fallback?: (props: { error: Error; retry: () => void }) => React.JSX.Element;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Send to Sentry with component stack for debugging
    captureError(error, {
      componentStack: errorInfo.componentStack ?? 'unknown',
      boundary: 'ErrorBoundary',
    });

    breadcrumb('ErrorBoundary caught render error', {
      errorMessage: error.message,
    });

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Custom fallback if provided
      if (fallback) {
        return fallback({ error, retry: this.handleRetry });
      }

      // Default golden recovery card
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>🕉</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              A moment of turbulence on the path. Take a breath, and let us try again.
            </Text>
            <Pressable
              onPress={this.handleRetry}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return children;
  }
}

// ---------------------------------------------------------------------------
// Styles — cosmic dark theme with golden accent card
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    // Subtle golden glow
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    minWidth: 140,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.dark,
  },
});
