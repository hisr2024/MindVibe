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
              variant="caption"
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
    fontSize: 15,
    marginBottom: 2,
    // Devanagari (लेख / पठन / बोध / तिथि) must use a font with proper
    // Indic shaping tables. Falling back from a Latin-only display font
    // (Outfit / Cormorant) onto the system fallback drops OpenType GSUB/GPOS
    // rules — Android then renders combining matras in the wrong positions
    // (े drops, ो becomes ा, तिथि shuffles to तिाथ). NotoSansDevanagari is
    // bundled in useSacredFonts.ts; using it directly fixes the shaping.
    fontFamily: 'NotoSansDevanagari-Regular',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
