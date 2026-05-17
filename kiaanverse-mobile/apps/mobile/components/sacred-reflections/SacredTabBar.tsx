/**
 * Sacred Reflections — 4-tab pill bar.
 *
 * One-to-one port of the Kiaanverse.com mobile web UI: pill row with the
 * Devanagari label above the English SMALLCAPS label. The active tab gets
 * a gold-outlined pill; inactive tabs are borderless and muted.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing } from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

import { SACRED_TABS, type SacredTab } from './constants';

interface SacredTabBarProps {
  readonly active: SacredTab;
  readonly onChange: (tab: SacredTab) => void;
}

export function SacredTabBar({
  active,
  onChange,
}: SacredTabBarProps): React.JSX.Element {
  const { t } = useTranslation('sacred-reflections');
  const handlePress = useCallback(
    (tab: SacredTab) => {
      if (tab === active) return;
      void Haptics.selectionAsync();
      onChange(tab);
    },
    [active, onChange]
  );

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {SACRED_TABS.map((tab) => {
        const isActive = tab.id === active;
        const localizedLabel = t(tab.labelKey);
        return (
          <Pressable
            key={tab.id}
            onPress={() => handlePress(tab.id)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t('tabA11yFmt', { label: localizedLabel })}
          >
            <Text
              variant="devanagariSmall"
              color={isActive ? colors.primary[500] : colors.text.secondary}
              style={styles.sanskrit}
            >
              {tab.sanskrit}
            </Text>
            <Text
              variant="caption"
              color={isActive ? colors.primary[500] : colors.text.muted}
              style={styles.label}
            >
              {localizedLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackMedium,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabActive: {
    borderColor: colors.alpha.goldStrong,
    backgroundColor: colors.alpha.goldLight,
  },
  sanskrit: {
    // fontSize + lineHeight + Noto-Sans-Devanagari come from
    // variant="devanagariSmall" (15pt / 30pt). Devanagari matras (ी, े,
    // ो, ि, ौ) extend above the consonant baseline; with the old
    // variant="caption" preset they were clipped to "लख / पठन / बाध /
    // ताथ". The preset's 2.0 lineHeight gives the matras vertical room.
    marginBottom: 2,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
