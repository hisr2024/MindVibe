/**
 * useSadhana — Hook combining Zustand store with sadhana service calls.
 * Provides a clean API for the SadhanaExperience component.
 */

'use client'

import { useCallback } from 'react'
import { useSadhanaStore } from '@/stores/sadhanaStore'
import { composeSadhana, completeSadhana } from '@/services/sadhanaService'
import type { SadhanaMood } from '@/types/sadhana.types'

export function useSadhana() {
  const store = useSadhanaStore()

  /** Select mood and compose the practice */
  const selectMood = useCallback(async (mood: SadhanaMood) => {
    store.setMood(mood)
    store.setIsComposing(true)

    try {
      const hour = new Date().getHours()
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

      const composition = await composeSadhana({ mood, timeOfDay })
      store.setComposition(composition)

      /* Auto-advance to breathwork after a brief pause for greeting */
      setTimeout(() => {
        store.nextPhase()
      }, 2500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compose practice'
      store.setError(message)

      /* Use fallback composition so the experience still works */
      store.setComposition(getFallbackComposition(mood))
      setTimeout(() => {
        store.nextPhase()
      }, 2000)
    }
  }, [store])

  /** Complete the practice and record results */
  const complete = useCallback(async () => {
    if (!store.mood || !store.composition) return

    store.setPhase('complete')

    try {
      const result = await completeSadhana({
        mood: store.mood,
        reflectionText: store.reflectionText || undefined,
        intentionText: store.intentionText || undefined,
        durationSeconds: store.startedAt ? Math.round((Date.now() - store.startedAt) / 1000) : 300,
        verseId: store.composition.verse.verseId,
      })
      return result
    } catch {
      /* If completion API fails, still show the completion screen */
      return {
        success: true,
        xpAwarded: 25,
        streakCount: 1,
        message: 'Your practice is sealed. Walk in dharma today.',
      }
    }
  }, [store])

  return {
    ...store,
    selectMood,
    complete,
  }
}

/** 7 curated fallback verses — one per day of week for offline variety */
const FALLBACK_VERSES = [
  { chapter: 2, verse: 47, verseId: '2.47', sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', english: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.', transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana', modernInsight: 'Focus on what you can do, not what might happen.', personalInterpretation: 'This verse reminds us that our power lies in action, not in controlling outcomes. Today, do what is right and release attachment to results.' },
  { chapter: 6, verse: 5, verseId: '6.5', sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥', english: 'Elevate yourself through the power of your mind, and do not degrade yourself, for the mind can be the friend and also the enemy of the self.', transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet', modernInsight: 'You are your own greatest ally — or your own worst obstacle.', personalInterpretation: 'Your mind is the instrument of your liberation. Train it gently, like a friend, and it will carry you through any difficulty.' },
  { chapter: 9, verse: 26, verseId: '9.26', sanskrit: 'पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति। तदहं भक्त्युपहृतमश्नामि प्रयतात्मनः॥', english: 'If one offers Me with love and devotion a leaf, a flower, a fruit, or water, I will accept it.', transliteration: 'patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati', modernInsight: 'It is the sincerity of the offering, not its grandeur, that matters.', personalInterpretation: 'The universe responds to the purity of your intention. Even the smallest act of devotion, done with a full heart, is received with grace.' },
  { chapter: 4, verse: 7, verseId: '4.7', sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥', english: 'Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest Myself.', transliteration: 'yadā yadā hi dharmasya glānir bhavati bhārata', modernInsight: 'In every crisis, there is the seed of renewal and restoration.', personalInterpretation: 'Even in the darkest moments, a force for good rises. Trust that the universe bends toward dharma, and your part matters.' },
  { chapter: 12, verse: 13, verseId: '12.13', sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च। निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥', english: 'One who is free from malice toward all beings, friendly and compassionate, free from attachment and ego, balanced in pleasure and pain, and forgiving.', transliteration: 'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca', modernInsight: 'True strength lies in compassion and equanimity, not in force.', personalInterpretation: 'The qualities described here are not passive — they are the marks of a soul that has chosen love over fear. Practice one today.' },
  { chapter: 18, verse: 66, verseId: '18.66', sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥', english: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions; do not fear.', transliteration: 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja', modernInsight: 'Sometimes the bravest act is to let go and trust.', personalInterpretation: 'This is Krishna\'s ultimate promise: when all paths seem tangled, surrender to the divine within. You are held, you are safe, you are free.' },
  { chapter: 2, verse: 14, verseId: '2.14', sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः। आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥', english: 'The contact of the senses with their objects gives rise to feelings of heat and cold, pleasure and pain. They are impermanent — endure them bravely.', transliteration: 'mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ', modernInsight: 'Every feeling passes. This too shall pass.', personalInterpretation: 'Pleasure and pain are visitors, not residents. When you understand their temporary nature, you can meet them with equanimity and grace.' },
]

/** Fallback composition when API is unavailable */
function getFallbackComposition(mood: SadhanaMood) {
  const isHeavy = mood === 'heavy' || mood === 'wounded'
  const isEnergetic = mood === 'radiant' || mood === 'grateful'
  const dayOfWeek = new Date().getDay()
  const verse = FALLBACK_VERSES[dayOfWeek]

  return {
    greeting: isHeavy
      ? 'Even in difficulty, the soul finds its way to light. Let us walk together today.'
      : 'The divine light within you shines brightly. Let us honor it with practice.',
    breathingPattern: isHeavy
      ? { name: 'Calming Breath', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, cycles: 4, description: 'Soothing 4-7-8 pattern to calm the nervous system' }
      : isEnergetic
        ? { name: 'Energizing Breath', inhale: 4, holdIn: 2, exhale: 4, holdOut: 2, cycles: 6, description: 'Quick pattern to channel your radiant energy' }
        : { name: 'Box Breathing', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, cycles: 5, description: 'Balanced pattern for centered awareness' },
    verse,
    reflectionPrompt: {
      prompt: 'What outcome are you holding too tightly today?',
      guidingQuestion: 'Can you find peace in the action itself, regardless of the result?',
    },
    dharmaIntention: {
      suggestion: 'Perform one act of kindness today without expecting anything in return.',
      category: 'Nishkama Karma',
    },
    durationEstimateMinutes: 8,
    timeOfDay: new Date().getHours() < 12 ? 'morning' as const : new Date().getHours() < 17 ? 'afternoon' as const : 'evening' as const,
  }
}
