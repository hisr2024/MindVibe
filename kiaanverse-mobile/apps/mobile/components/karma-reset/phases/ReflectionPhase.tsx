/**
 * ReflectionPhase — Sakha asks three adaptive questions, one at a time.
 *
 * Flow:
 *   1. Fetch question N (0, 1, 2) from the backend.
 *   2. Show the question with a word-by-word reveal.
 *   3. User picks a pre-written option OR writes their own answer.
 *   4. Advance to the next question (or call `onComplete` with all answers).
 *
 * Mirrors `app/(mobile)/m/karma-reset/phases/ReflectionPhase.tsx`.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useKarmaReset } from '../../../hooks/useKarmaReset';
import { WordReveal } from '../WordReveal';
import type {
  KarmaReflectionAnswer,
  KarmaReflectionQuestion,
  KarmaResetContext,
} from '../types';
import { CATEGORY_COLORS } from '../types';

interface ReflectionPhaseProps {
  context: KarmaResetContext;
  onComplete: (answers: KarmaReflectionAnswer[]) => void;
}

function LotusIndicator({
  position,
  activeIndex,
}: {
  position: number;
  activeIndex: number;
}): React.JSX.Element {
  const scale = useSharedValue(1);
  const isActive = position === activeIndex;

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: position <= activeIndex ? 1 : 0.3,
  }));

  return (
    <Animated.Text style={[styles.lotus, style]}>
      {position < activeIndex ? '🪷' : position === activeIndex ? '🪷' : '○'}
    </Animated.Text>
  );
}

export function ReflectionPhase({
  context,
  onComplete,
}: ReflectionPhaseProps): React.JSX.Element {
  const { fetchReflectionQuestion, isLoadingQuestion } = useKarmaReset();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] =
    useState<KarmaReflectionQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [showFreeText, setShowFreeText] = useState(false);
  const [answers, setAnswers] = useState<KarmaReflectionAnswer[]>([]);

  const categoryColor = CATEGORY_COLORS[context.category];

  // Fetch question on index change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const q = await fetchReflectionQuestion(
        context,
        questionIndex as 0 | 1 | 2,
      );
      if (!cancelled) setCurrentQuestion(q);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [questionIndex, context, fetchReflectionQuestion]);

  const handleSelectOption = useCallback((option: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(option);
    setShowFreeText(false);
    setFreeText('');
  }, []);

  const handleShowFreeText = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFreeText(true);
    setSelectedOption(null);
  }, []);

  const currentAnswer =
    selectedOption ||
    (showFreeText && freeText.trim().length > 0 ? freeText.trim() : null);

  const handleNext = useCallback(() => {
    if (!currentAnswer || !currentQuestion) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const answer: KarmaReflectionAnswer = {
      questionIndex,
      question: currentQuestion.question,
      answer: currentAnswer,
    };
    const next = [...answers, answer];
    setAnswers(next);

    if (questionIndex < 2) {
      setQuestionIndex(questionIndex + 1);
      setSelectedOption(null);
      setFreeText('');
      setShowFreeText(false);
      setCurrentQuestion(null);
    } else {
      onComplete(next);
    }
  }, [
    currentAnswer,
    currentQuestion,
    questionIndex,
    answers,
    onComplete,
  ]);

  // Sakha avatar pulsing glow
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);
  const avatarStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.15 + 0.15 * glow.value,
    shadowRadius: 20 + 16 * glow.value,
  }));

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
        {/* Progress */}
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <LotusIndicator key={i} position={i} activeIndex={questionIndex} />
          ))}
        </View>

        {/* Sakha avatar */}
        <View style={styles.avatarColumn}>
          <Animated.View style={[styles.avatar, avatarStyle]}>
            <Text style={styles.avatarFace}>🙏</Text>
          </Animated.View>
          <Text style={styles.avatarLabel}>Sakha is with you</Text>
        </View>

        {/* Loading / question */}
        {isLoadingQuestion || !currentQuestion ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.loadingColumn}
          >
            <ActivityIndicator size="small" color="#D4A017" />
            <Text style={styles.loadingText}>Sakha is contemplating...</Text>
          </Animated.View>
        ) : (
          <Animated.View
            key={`q-${questionIndex}`}
            entering={FadeInDown.duration(300)}
          >
            {/* Question card */}
            <View style={styles.questionCard}>
              <Text style={styles.questionTag}>Sakha asks:</Text>
              <WordReveal
                text={currentQuestion.question}
                speed={70}
                style={styles.questionText}
              />
              {currentQuestion.subtext ? (
                <Animated.Text
                  entering={FadeIn.delay(600).duration(300)}
                  style={styles.subtext}
                >
                  {currentQuestion.subtext}
                </Animated.Text>
              ) : null}
            </View>

            {/* Options */}
            <View style={styles.optionsColumn}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                return (
                  <Animated.View
                    key={`${i}-${option}`}
                    entering={FadeInDown.delay(800 + i * 100).duration(300)}
                  >
                    <Pressable
                      onPress={() => handleSelectOption(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.option,
                        {
                          backgroundColor: isSelected
                            ? `${categoryColor}20`
                            : 'rgba(22,26,66,0.4)',
                          borderLeftColor: isSelected
                            ? categoryColor
                            : 'rgba(255,255,255,0.06)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: isSelected
                              ? '#D4A017'
                              : 'rgba(212,160,23,0.3)',
                            backgroundColor: isSelected
                              ? '#D4A017'
                              : 'transparent',
                          },
                        ]}
                      />
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}

              {/* Speak freely */}
              <Animated.View entering={FadeIn.delay(1200).duration(300)}>
                <Pressable
                  onPress={handleShowFreeText}
                  accessibilityRole="button"
                  style={[
                    styles.option,
                    {
                      backgroundColor: showFreeText
                        ? `${categoryColor}20`
                        : 'transparent',
                      borderLeftColor: showFreeText
                        ? categoryColor
                        : 'rgba(255,255,255,0.1)',
                      borderLeftWidth: 3,
                      borderStyle: 'dashed',
                    },
                  ]}
                >
                  <Text
                    style={[styles.optionText, { color: '#B8AE98', fontSize: 14 }]}
                  >
                    Speak freely...
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Free text */}
              {showFreeText ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <TextInput
                    value={freeText}
                    onChangeText={setFreeText}
                    placeholder="Share what is in your heart..."
                    placeholderTextColor="#6B6355"
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    style={styles.freeText}
                  />
                </Animated.View>
              ) : null}
            </View>

            {/* CTA */}
            {currentAnswer ? (
              <Animated.View
                entering={FadeInUp.duration(300)}
                style={styles.ctaWrap}
              >
                <Pressable
                  onPress={handleNext}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.cta,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.ctaLabel}>
                    {questionIndex < 2 ? 'Next Question' : 'Receive Wisdom'}
                  </Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </Pressable>
              </Animated.View>
            ) : null}
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  lotus: {
    fontSize: 16,
  },
  avatarColumn: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    backgroundColor: 'rgba(17,20,53,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
  },
  avatarFace: {
    fontSize: 22,
  },
  avatarLabel: {
    fontSize: 10,
    color: '#6B6355',
    fontStyle: 'italic',
  },
  loadingColumn: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#B8AE98',
    fontStyle: 'italic',
  },
  questionCard: {
    backgroundColor: 'rgba(17,20,53,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.12)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(212,160,23,0.5)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  questionTag: {
    fontSize: 9,
    color: '#D4A017',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  questionText: {
    color: '#F0EBE1',
    fontSize: 17,
    lineHeight: 28,
  },
  subtext: {
    fontStyle: 'italic',
    fontSize: 14,
    color: '#B8AE98',
    lineHeight: 22,
    marginTop: 12,
  },
  optionsColumn: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 58,
    borderRadius: 14,
    borderLeftWidth: 3,
  },
  radio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontStyle: 'italic',
    fontSize: 15,
    color: '#F0EBE1',
    lineHeight: 22,
  },
  freeText: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderRadius: 14,
    backgroundColor: 'rgba(22,26,66,0.5)',
    color: '#F0EBE1',
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  ctaWrap: {
    marginTop: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
    backgroundColor: 'rgba(22,26,66,0.5)',
  },
  ctaLabel: {
    fontSize: 15,
    color: '#F0C040',
    fontWeight: '500',
  },
  ctaArrow: {
    fontSize: 16,
    color: '#F0C040',
  },
});
