/**
 * Step 1: Welcome — "Meet Sakha, Your Divine Companion"
 *
 * Animated SakhaAvatar intro with a gentle breathing aura
 * set against a full cosmic gradient with sacred golden glow.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Text,
  SakhaAvatar,
  GoldenButton,
  DivineBackground,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

interface WelcomeStepProps {
  readonly onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <DivineBackground variant="sacred">
      <View style={styles.container}>
        <Animated.View
          entering={FadeInDown.duration(800).delay(200)}
          style={styles.avatarWrap}
        >
          {/* Golden aura ring behind avatar. "Sakha" is the brand persona
              name and stays as-is across every locale. */}
          <View style={styles.auraRing}>
            <SakhaAvatar size={140} state="idle" name="Sakha" />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={styles.textWrap}
        >
          <Text variant="h1" align="center">
            {t('onboarding.welcomeTitle')}
          </Text>
          <Text variant="body" color={colors.text.secondary} align="center">
            {t('onboarding.welcomeBody')}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(800)}
          style={styles.ctaWrap}
        >
          <GoldenButton
            title={t('onboarding.welcomeCta')}
            variant="divine"
            onPress={onNext}
            testID="welcome-next"
          />
        </Animated.View>
      </View>
    </DivineBackground>
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
  avatarWrap: {
    alignItems: 'center',
  },
  auraRing: {
    padding: 6,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.divine.aura,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  textWrap: {
    gap: spacing.md,
    alignItems: 'center',
  },
  ctaWrap: {
    width: '100%',
  },
});
