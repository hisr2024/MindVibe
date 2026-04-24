/**
 * SankalpaPhase — Sacred intention setting.
 *
 * The user picks a dharmic quality (अहिंसा, सत्य, करुणा, विवेक, सेवा,
 * वैराग्य) and either accepts the auto-generated sankalpa or edits it.
 * Tapping the ceremonial seal button (SankalpaSealButton) commits the
 * intention and advances to the Seal phase.
 *
 * Mirrors `app/(mobile)/m/karma-reset/phases/SankalphaPhase.tsx`.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { WordReveal } from '../WordReveal';
import { SankalpaSealButton } from '../SankalpaSealButton';
import type {
  DharmicQualityConfig,
  KarmaResetContext,
  KarmaWisdomResponse,
  SankalpaSeal,
} from '../types';
import { DHARMIC_QUALITIES } from '../types';

interface SankalpaPhaseProps {
  wisdom: KarmaWisdomResponse;
  context: KarmaResetContext;
  onComplete: (sankalpa: SankalpaSeal) => void;
}

function QualityTile({
  quality,
  isSelected,
  onPress,
}: {
  quality: DharmicQualityConfig;
  isSelected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isSelected ? 1.02 : 1, {
      damping: 25,
      stiffness: 400,
    });
  }, [isSelected, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={styles.qualityCell}
    >
      <Animated.View
        style={[
          styles.qualityTile,
          {
            backgroundColor: isSelected
              ? `${quality.color}20`
              : 'rgba(17,20,53,0.8)',
            borderColor: isSelected
              ? `${quality.color}80`
              : 'rgba(255,255,255,0.06)',
            borderTopColor: isSelected
              ? quality.color
              : 'rgba(255,255,255,0.06)',
            borderTopWidth: isSelected ? 2 : 1,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.qualitySanskrit,
            { color: isSelected ? quality.color : `${quality.color}CC` },
          ]}
        >
          {quality.sanskrit}
        </Text>
        <Text style={styles.qualityLabel}>{quality.label}</Text>
        <Text style={styles.qualityDesc}>{quality.description}</Text>
      </Animated.View>
    </Pressable>
  );
}

function autoIntention(
  qualityId: string,
  context: KarmaResetContext,
  wisdom: KarmaWisdomResponse
): string {
  const quality = DHARMIC_QUALITIES.find((q) => q.id === qualityId);
  const action =
    wisdom.actionDharma[0]?.practice || 'act with conscious awareness';
  return `Today I align with ${
    quality?.label ?? 'dharma'
  }. In my ${context.category}, I choose to ${action.toLowerCase()}`;
}

export function SankalpaPhase({
  wisdom,
  context,
  onComplete,
}: SankalpaPhaseProps): React.JSX.Element {
  // Default: first action dharma concept → quality id if matched, else ahimsa
  const defaultQuality = useMemo(() => {
    const firstConcept = wisdom.actionDharma[0]?.concept?.toLowerCase() ?? '';
    return (
      DHARMIC_QUALITIES.find((q) => firstConcept.includes(q.id))?.id ?? 'ahimsa'
    );
  }, [wisdom]);

  const [selectedQuality, setSelectedQuality] = useState(defaultQuality);
  const [intentionText, setIntentionText] = useState(() =>
    autoIntention(defaultQuality, context, wisdom)
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleQualityChange = useCallback(
    (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedQuality(id);
      if (!isEditing) {
        setIntentionText(autoIntention(id, context, wisdom));
      }
    },
    [isEditing, context, wisdom]
  );

  const handleSeal = useCallback(() => {
    onComplete({
      dharmicFocus: selectedQuality,
      intentionText,
      sealed: true,
      sealedAt: new Date(),
    });
  }, [selectedQuality, intentionText, onComplete]);

  const selectedConfig = DHARMIC_QUALITIES.find(
    (q) => q.id === selectedQuality
  );
  const accent = selectedConfig?.color ?? '#D4A017';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Opening words */}
        <View style={styles.openingColumn}>
          <WordReveal
            text="Arjuna understood. Then he stood up. Now — what will you do?"
            speed={70}
            style={styles.opening}
          />
          <Animated.Text
            entering={FadeIn.delay(1500).duration(400)}
            style={styles.openingSubtext}
          >
            Set your sankalpa. One intention. One day.
          </Animated.Text>
        </View>

        {/* Quality selector — 2×3 grid */}
        <Animated.View
          entering={FadeIn.delay(2000).duration(400)}
          style={styles.qualitiesSection}
        >
          <Text style={styles.sectionLabel}>Choose your dharmic focus</Text>
          <View style={styles.qualitiesGrid}>
            {DHARMIC_QUALITIES.map((q) => (
              <QualityTile
                key={q.id}
                quality={q}
                isSelected={selectedQuality === q.id}
                onPress={() => handleQualityChange(q.id)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Sankalpa card */}
        <Animated.View
          entering={FadeIn.delay(2300).duration(400)}
          style={[styles.sankalpaCard, { borderLeftColor: accent }]}
        >
          <Text style={styles.sankalpaTag}>My Sankalpa</Text>
          {isEditing ? (
            <TextInput
              value={intentionText}
              onChangeText={setIntentionText}
              onBlur={() => setIsEditing(false)}
              multiline
              maxLength={500}
              textAlignVertical="top"
              autoFocus
              style={styles.intentionEditor}
              placeholder="Write your sankalpa..."
              placeholderTextColor="#6B6355"
            />
          ) : (
            <Pressable onPress={() => setIsEditing(true)}>
              <Text style={styles.intentionText}>{intentionText}</Text>
              <Text style={styles.editHint}>Tap to edit</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* The Seal ceremony */}
        <Animated.View
          entering={FadeIn.delay(2800).duration(400)}
          style={styles.sealSection}
        >
          <SankalpaSealButton onSeal={handleSeal} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  openingColumn: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  opening: {
    fontSize: 17,
    color: '#F0EBE1',
    textAlign: 'center',
    lineHeight: 28,
  },
  openingSubtext: {
    fontStyle: 'italic',
    fontSize: 14,
    color: '#B8AE98',
    textAlign: 'center',
  },
  qualitiesSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#6B6355',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  qualitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  qualityCell: {
    width: '50%',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  qualityTile: {
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  qualitySanskrit: {
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  qualityLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B8AE98',
    marginTop: 2,
  },
  qualityDesc: {
    fontSize: 9,
    fontWeight: '300',
    color: '#6B6355',
  },
  sankalpaCard: {
    backgroundColor: 'rgba(17,20,53,0.98)',
    borderLeftWidth: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sankalpaTag: {
    fontSize: 9,
    color: '#D4A017',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  intentionText: {
    fontStyle: 'italic',
    fontSize: 18,
    color: '#F0EBE1',
    lineHeight: 30,
  },
  intentionEditor: {
    fontStyle: 'italic',
    fontSize: 18,
    color: '#F0EBE1',
    lineHeight: 30,
    padding: 0,
    minHeight: 80,
  },
  editHint: {
    fontSize: 10,
    color: '#6B6355',
    marginTop: 8,
  },
  sealSection: {
    alignItems: 'center',
    marginTop: 8,
  },
});
