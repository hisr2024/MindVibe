/**
 * Step 5: Ready — Golden CTA + notification permission request
 *
 * Final step with a divine GoldenButton to launch into the app.
 * Requests notification permission via expo-notifications.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import {
  Text,
  GoldenButton,
  LoadingMandala,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

interface ReadyStepProps {
  readonly onComplete: (notificationsEnabled: boolean) => void;
}

export function ReadyStep({ onComplete }: ReadyStepProps): React.JSX.Element {
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);

  const handleEnable = useCallback(async () => {
    setRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      onComplete(status === 'granted');
    } catch {
      // Permission denied or unavailable — continue without notifications
      onComplete(false);
    } finally {
      setRequesting(false);
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    onComplete(false);
  }, [onComplete]);

  if (requesting) {
    return (
      <View style={styles.container}>
        <LoadingMandala size={120} />
        <Text variant="bodySmall" color={colors.text.muted} align="center">
          {t('onboarding.readyRequesting')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.duration(800).delay(200)}
        style={styles.content}
      >
        <Text variant="sacred" color={colors.divine.aura} align="center">
          {t('onboarding.readyVerse')}
        </Text>
        <Text variant="caption" color={colors.text.muted} align="center">
          {t('onboarding.readyVerseAttribution')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(600)}
        style={styles.textWrap}
      >
        <Text variant="h1" align="center">
          {t('onboarding.readyTitle')}
        </Text>
        <Text variant="body" color={colors.text.secondary} align="center">
          {t('onboarding.readyBody')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(900)}
        style={styles.actions}
      >
        <GoldenButton
          title={t('onboarding.readyCtaEnable')}
          variant="divine"
          onPress={handleEnable}
          testID="ready-enable"
        />
        <GoldenButton
          title={t('onboarding.readyCtaSkip')}
          variant="ghost"
          onPress={handleSkip}
          testID="ready-skip"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textWrap: {
    gap: spacing.md,
    alignItems: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
