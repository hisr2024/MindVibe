/**
 * Viyoga — Release (Sacred Fire input)
 *
 * "What do you wish to release?" — prompts the user for the one thing
 * they're ready to offer to the Sacred Fire. The subtitle directly below
 * the question comes from the transmission when available, reminding
 * them to release the weight, not the love.
 *
 * On submit we persist the release text to the flow bucket (so the
 * fire screen / completion can read it if desired) and route to the
 * fire animation.
 */

import React, { useState } from 'react';
import { ShankhaVoiceInput } from '../../../voice/components/ShankhaVoiceInput';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSacredFlow } from '@/hooks/useSacredFlow';

const DEFAULT_SUBTITLE =
  'Not the love. Not the memory. But the weight of the pain.';

export default function ViyogaRelease(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { flow, updateAnswer } = useSacredFlow('viyoga');
  const [release, setRelease] = useState('');

  const subtitle =
    flow.aiResponse?.releaseSubtitle &&
    flow.aiResponse.releaseSubtitle.length > 0
      ? flow.aiResponse.releaseSubtitle
      : DEFAULT_SUBTITLE;

  const canOffer = release.trim().length > 0;

  const handleOffer = (): void => {
    if (!canOffer) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    updateAnswer('release', release.trim());
    router.push('/tools/viyoga/fire' as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#030510' }}
    >
      <ScrollView
        contentContainerStyle={[
          s.screen,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.tearWrap}>
          <View style={s.tearGlow} />
          <Text style={s.tear}>💧</Text>
        </View>

        <Text style={s.question}>What do you wish to release?</Text>
        <Text style={s.subtitle}>{subtitle}</Text>

        <ShankhaVoiceInput
          style={s.input}
          value={release}
          onChangeText={setRelease}
          placeholder="I release..."
          multiline
          dictationMode="append"
          />

        <TouchableOpacity
          style={[s.fireBtn, !canOffer && s.fireBtnOff]}
          disabled={!canOffer}
          onPress={handleOffer}
          accessibilityRole="button"
          accessibilityLabel="Offer to the Sacred Fire"
          accessibilityState={{ disabled: !canOffer }}
        >
          <LinearGradient
            colors={['#1B4FBB', '#0E7490']}
            style={s.fireBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.fireBtnText}>Offer to the Sacred Fire</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tearWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  tearGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  tear: {
    fontSize: 56,
  },
  question: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 22,
    color: '#D4A017',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: 'rgba(240,235,225,0.5)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(22,26,66,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#F0EBE1',
    minHeight: 120,
    marginBottom: 24,
    fontFamily: 'CrimsonText-Italic',
  },
  fireBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  fireBtnOff: {
    opacity: 0.4,
  },
  fireBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  fireBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
