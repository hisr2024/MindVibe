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
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
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
  /** Toggled when the user taps "Show details" — reveals error.message + stack. */
  showDetails: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, showDetails: false };
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
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  handleToggleDetails = (): void => {
    this.setState((prev) => ({ ...prev, showDetails: !prev.showDetails }));
  };

  render(): React.ReactNode {
    const { hasError, error, showDetails } = this.state;
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
              A moment of turbulence on the path. Take a breath, and let us try
              again.
            </Text>
            <Pressable
              onPress={this.handleRetry}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>

            <Pressable
              onPress={this.handleToggleDetails}
              style={styles.detailsToggle}
              accessibilityRole="button"
              accessibilityLabel={showDetails ? 'Hide details' : 'Show details'}
            >
              <Text style={styles.detailsToggleText}>
                {showDetails ? 'Hide details' : 'Show details'}
              </Text>
            </Pressable>

            {showDetails ? (
              <ScrollView style={styles.detailsBox} nestedScrollEnabled>
                <Text style={styles.detailsLabel}>Error</Text>
                <Text selectable style={styles.detailsText}>
                  {error.name}: {error.message}
                </Text>
                {error.stack ? (
                  <>
                    <Text style={styles.detailsLabel}>Stack</Text>
                    <Text selectable style={styles.detailsStack}>
                      {error.stack}
                    </Text>
                  </>
                ) : null}
              </ScrollView>
            ) : null}
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
  // Details toggle — small text link under the Try Again button. Lets the
  // user see the actual error.message + stack on screen so release-build
  // crashes are diagnosable without adb logcat or Sentry access.
  detailsToggle: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  detailsToggleText: {
    fontSize: 12,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  detailsBox: {
    marginTop: spacing.md,
    maxHeight: 240,
    width: '100%',
    backgroundColor: colors.background.dark,
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  detailsText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  detailsStack: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
