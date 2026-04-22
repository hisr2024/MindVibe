/**
 * Viyoga — Step 1: Separation Type Selector
 *
 * "What form does your separation take?"
 *
 * Six cards (death, estrangement, heartbreak, self, home, divine) with
 * their own colour accent. Selecting a card tints its border + left edge
 * and unlocks the gradient Continue CTA. Choice persists to FlowState
 * as `separation_type`.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSacredFlow } from '@/hooks/useSacredFlow';

// 6 separation types — exact from kiaanverse.com screenshots
const SEPARATION_TYPES = [
  {
    id: 'death',
    skt: 'मृत्यु-विच्छेद',
    label: 'Departure Through Death',
    desc: 'A soul has crossed the threshold',
    color: '#9CA3AF',
  },
  {
    id: 'estrangement',
    skt: 'सम्बन्ध-विच्छेद',
    label: 'Estrangement & Silence',
    desc: 'Distance that was chosen or imposed',
    color: '#8B5CF6',
  },
  {
    id: 'heartbreak',
    skt: 'प्रेम-वेदना',
    label: 'Heartbreak & Romantic Loss',
    desc: 'Love that transformed or ended',
    color: '#EC4899',
  },
  {
    id: 'self',
    skt: 'आत्म-विच्छेद',
    label: 'Separation from Self',
    desc: 'Lost, numb, no longer yourself',
    color: '#60A5FA',
  },
  {
    id: 'home',
    skt: 'देश-विरह',
    label: 'Longing for Home',
    desc: 'Exile, displacement, rootlessness',
    color: '#F59E0B',
  },
  {
    id: 'divine',
    skt: 'विरह-भक्ति',
    label: 'Longing for the Divine',
    desc: 'Spiritual separation, the dark night',
    color: '#D4A017',
  },
] as const;

export default function ViyogaStep1(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const { updateAnswer } = useSacredFlow('viyoga');

  const handleSelect = (id: string): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const handleContinue = (): void => {
    if (!selected) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateAnswer('separation_type', selected);
    router.push('/tools/viyoga/step2' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#030510' }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.question}>What form does your separation take?</Text>

        {SEPARATION_TYPES.map((type) => {
          const isSelected = selected === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                s.typeCard,
                isSelected && {
                  borderColor: type.color,
                  backgroundColor: `${type.color}12`,
                },
              ]}
              onPress={() => handleSelect(type.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={type.label}
            >
              <View
                style={[
                  s.cardAccent,
                  { backgroundColor: isSelected ? type.color : 'transparent' },
                ]}
              />

              <View style={s.cardContent}>
                <Text style={[s.cardSkt, { color: isSelected ? type.color : '#D4A017' }]}>
                  {type.skt}
                </Text>
                <Text style={[s.cardLabel, isSelected && { color: '#F0EBE1' }]}>
                  {type.label}
                </Text>
                <Text style={s.cardDesc}>{type.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.continueBtn, !selected && s.continueBtnOff]}
          onPress={handleContinue}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !selected }}
        >
          <LinearGradient
            colors={selected ? ['#1B4FBB', '#0E7490'] : ['#1a1d2e', '#1a1d2e']}
            style={s.continueBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.continueBtnText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  question: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 22,
    color: '#D4A017',
    marginBottom: 20,
    lineHeight: 32,
  },
  typeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22,26,66,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.15)',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 72,
  },
  cardAccent: {
    width: 3,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardSkt: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 12,
    lineHeight: 24,
    marginBottom: 2,
  },
  cardLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: 'rgba(240,235,225,0.85)',
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(240,235,225,0.4)',
  },
  footer: {
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnOff: {
    opacity: 0.4,
  },
  continueBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
