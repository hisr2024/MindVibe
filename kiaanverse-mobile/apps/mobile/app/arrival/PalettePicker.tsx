/**
 * PalettePicker — sacred color-scheme switcher for the arrival ceremony.
 *
 * Two exports:
 *   - <PalettePickerChip />   the small floating affordance, top-right corner
 *   - <PaletteSheet />        the bottom sheet that slides up with 4 previews
 *
 * The chip renders a four-quadrant preview of the active palette so the user
 * can see at-a-glance which scheme is on, then tap to change. The sheet shows
 * one card per palette with a 64pt mini-mandala painted in the palette's
 * divine accent, sitting on the palette's background — a faithful preview.
 *
 * State lives in `useThemeStore` (palette + setPalette) so the choice persists
 * across launches via AsyncStorage and propagates to every screen using
 * `<DivineBackground>`.
 */

import React, { useCallback } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  PALETTES,
  PALETTE_ORDER,
  type Palette,
  type PaletteId,
} from '@kiaanverse/ui';
import { useThemeStore } from '@kiaanverse/store';
import { KiaanWelcomeVisual } from './visuals';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHEET_EASING = Easing.bezier(0.22, 1.0, 0.36, 1.0);

// ---------------------------------------------------------------------------
// PalettePickerChip — floating top-right affordance
// ---------------------------------------------------------------------------

export interface PalettePickerChipProps {
  /** Open the bottom sheet when tapped. */
  readonly onPress: () => void;
  /** Optional positioning override. */
  readonly style?: ViewStyle;
}

export function PalettePickerChip({
  onPress,
  style,
}: PalettePickerChipProps): React.JSX.Element {
  const paletteId = useThemeStore((s) => s.palette);
  const palette = PALETTES[paletteId];

  const handlePress = useCallback((): void => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined
      );
    }
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[styles.chip, style]}
      accessibilityRole="button"
      accessibilityLabel={`Change color palette. Current: ${palette.label}`}
      accessibilityHint="Opens the sacred color-scheme picker"
      testID="arrival-palette-chip"
    >
      <View style={styles.chipInner}>
        <SwatchQuadrant palette={palette} size={26} />
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// PaletteSheet — slide-up bottom sheet with 4 palette cards
// ---------------------------------------------------------------------------

export interface PaletteSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function PaletteSheet({
  visible,
  onClose,
}: PaletteSheetProps): React.JSX.Element {
  const activeId = useThemeStore((s) => s.palette);
  const setPalette = useThemeStore((s) => s.setPalette);

  const sheetTranslate = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      sheetTranslate.value = withTiming(0, {
        duration: 360,
        easing: SHEET_EASING,
      });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      sheetTranslate.value = withTiming(SCREEN_HEIGHT, {
        duration: 280,
        easing: SHEET_EASING,
      });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, sheetTranslate, backdropOpacity]);

  const handleSelect = useCallback(
    (id: PaletteId): void => {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => undefined);
      }
      setPalette(id);
      // Brief pause so the user sees the check tick land before the sheet
      // closes — feels like the choice "took".
      setTimeout(onClose, 220);
    },
    [setPalette, onClose]
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslate.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.sheetRoot} testID="arrival-palette-sheet">
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handleBar} />
          <Text allowFontScaling={false} style={styles.sheetEyebrow}>
            SACRED COLOR SCHEME
          </Text>
          <Text allowFontScaling={false} style={styles.sheetTitle}>
            Choose your palette
          </Text>
          <Text allowFontScaling={false} style={styles.sheetSubtitle}>
            Each scheme dresses the entire app — from this introduction onward.
          </Text>

          <View style={styles.cardGrid}>
            {PALETTE_ORDER.map((id) => (
              <PaletteCard
                key={id}
                palette={PALETTES[id]}
                isActive={id === activeId}
                onSelect={handleSelect}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// PaletteCard — one card per scheme inside the sheet
// ---------------------------------------------------------------------------

interface PaletteCardProps {
  readonly palette: Palette;
  readonly isActive: boolean;
  readonly onSelect: (id: PaletteId) => void;
}

function PaletteCard({
  palette,
  isActive,
  onSelect,
}: PaletteCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={() => onSelect(palette.id)}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: palette.bg.void,
          borderColor: isActive
            ? palette.accent.divine
            : 'rgba(212, 164, 76, 0.18)',
          borderWidth: isActive ? 2 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${palette.label}${isActive ? ', currently selected' : ''}`}
      testID={`arrival-palette-card-${palette.id}`}
    >
      <View style={styles.cardVisual}>
        <KiaanWelcomeVisual
          accent={palette.accent.divine}
          isActive={isActive}
          size={64}
        />
      </View>
      <Text
        allowFontScaling={false}
        style={[styles.cardLabel, { color: palette.text.title }]}
        numberOfLines={1}
      >
        {palette.label}
      </Text>

      {/* Active check mark — small filled dot in the palette's divine gold */}
      {isActive ? (
        <View
          style={[
            styles.activeDot,
            { backgroundColor: palette.accent.divine },
          ]}
        />
      ) : null}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// SwatchQuadrant — 2×2 quadrant preview used inside the chip
// ---------------------------------------------------------------------------

interface SwatchQuadrantProps {
  readonly palette: Palette;
  readonly size: number;
}

function SwatchQuadrant({
  palette,
  size,
}: SwatchQuadrantProps): React.JSX.Element {
  const half = size / 2;
  const cells: ReadonlyArray<{ key: string; color: string }> = [
    { key: 'tl', color: palette.accent.primary },
    { key: 'tr', color: palette.accent.warm },
    { key: 'bl', color: palette.accent.cool },
    { key: 'br', color: palette.accent.divine },
  ];
  return (
    <View
      style={[
        styles.swatchWrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View style={styles.swatchRow}>
        <View style={{ width: half, height: half, backgroundColor: cells[0]!.color }} />
        <View style={{ width: half, height: half, backgroundColor: cells[1]!.color }} />
      </View>
      <View style={styles.swatchRow}>
        <View style={{ width: half, height: half, backgroundColor: cells[2]!.color }} />
        <View style={{ width: half, height: half, backgroundColor: cells[3]!.color }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hook — small helper so the chip + sheet can co-live in one parent screen
// ---------------------------------------------------------------------------

export function usePaletteSheet(): {
  visible: boolean;
  open: () => void;
  close: () => void;
} {
  const [visible, setVisible] = React.useState(false);
  return {
    visible,
    open: useCallback(() => setVisible(true), []),
    close: useCallback(() => setVisible(false), []),
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Chip — round, ~36pt, sits over the page top-right
  chip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 16, 36, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  chipInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchWrap: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  swatchRow: {
    flexDirection: 'row',
  },

  // Sheet root + backdrop
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  // Sheet container
  sheet: {
    backgroundColor: '#0A0E1F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.24)',
  },
  handleBar: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 164, 76, 0.45)',
    marginBottom: 18,
  },
  sheetEyebrow: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(212, 164, 76, 0.7)',
    textAlign: 'center',
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontStyle: 'italic',
    fontSize: 24,
    color: '#F5F0E8',
    textAlign: 'center',
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(245, 240, 232, 0.55)',
    textAlign: 'center',
    marginBottom: 22,
  },

  // Card grid — 2 columns, 2 rows
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    aspectRatio: 1.05,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardVisual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    letterSpacing: 0.3,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
