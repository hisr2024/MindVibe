/**
 * Karma Reset Wisdom API Route
 * Generates personalized Gita wisdom based on karma context and reflections.
 * Uses AI with structured prompt, falls back to static wisdom per category.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyHeaders, BACKEND_URL, forwardCookies } from '@/lib/proxy-utils'

/** Fallback Gita verses by category for when AI is unavailable */
const FALLBACK_WISDOM: Record<string, {
  dharmicMirror: string
  primaryShloka: {
    sanskrit: string
    transliteration: string
    english: string
    chapter: number
    verse: number
    chapterName: string
  }
  dharmicCounsel: string
  karmicInsight: string
  actionDharma: { concept: string; meaning: string; practice: string; gitaRef: string }[]
  affirmation: string
}> = {
  action: {
    dharmicMirror: 'What I see in you is not guilt but awareness. You acted, and now you are here examining that action. This very examination is the beginning of wisdom. The fact that you question your action means the Atman within you is awake.',
    primaryShloka: {
      sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo \'stv akarmaṇi',
      english: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, and never be attached to inaction.',
      chapter: 2,
      verse: 47,
      chapterName: 'Sānkhya Yoga',
    },
    dharmicCounsel: 'Krishna speaks directly to the heart of action in this verse. Your action carried weight because you cared about its outcome. But dharmic action is action performed with full presence and zero attachment to result. The teaching hidden in your karma is this: the quality of your action matters infinitely more than what it produces.',
    karmicInsight: 'The fire that burned here is also the fire that illuminates. Your discomfort with this action is proof that your dharmic compass is working.',
    actionDharma: [
      { concept: 'Ahimsa', meaning: 'Non-harm', practice: 'Before your next action today, pause for one breath and ask: does this serve or harm?', gitaRef: 'BG 16.2' },
      { concept: 'Svadhyaya', meaning: 'Self-study', practice: 'Write three sentences about what drove your action — without justification.', gitaRef: 'BG 4.28' },
      { concept: 'Ishvara Pranidhana', meaning: 'Surrender', practice: 'Release the outcome of that action. Say aloud: the fruit is not mine to hold.', gitaRef: 'BG 18.66' },
    ],
    affirmation: 'I carry forward: the right to act with awareness, the freedom to release the fruit.',
  },
  speech: {
    dharmicMirror: 'What I see in you is awareness that words carry karma. You spoke, and the vibration of those words still lives in you. This sensitivity to speech is itself a form of tapas — the sacred discipline of consciousness.',
    primaryShloka: {
      sanskrit: 'अनुद्वेगकरं वाक्यं सत्यं प्रियहितं च यत्।\nस्वाध्यायाभ्यसनं चैव वाङ्मयं तप उच्यते॥',
      transliteration: 'anudvega-karaṁ vākyaṁ satyaṁ priya-hitaṁ ca yat\nsvādhyāyābhyasanaṁ caiva vāṅ-mayaṁ tapa ucyate',
      english: 'Speech that causes no agitation, that is truthful, pleasing, and beneficial, and the regular recitation of sacred texts — this is called the austerity of speech.',
      chapter: 17,
      verse: 15,
      chapterName: 'Śraddhā-traya Vibhāga Yoga',
    },
    dharmicCounsel: 'The Gita defines sattvic speech with four qualities: it causes no agitation, it is truthful, it is pleasing, and it is beneficial. When speech lacks even one of these qualities, it creates karmic residue. Your awareness of this is the first step toward speech that heals rather than harms.',
    karmicInsight: 'Every word you regret is a teacher showing you the gap between what you said and what your heart truly meant.',
    actionDharma: [
      { concept: 'Mauna', meaning: 'Sacred silence', practice: 'Practice 30 minutes of intentional silence today — let the stillness teach you.', gitaRef: 'BG 17.16' },
      { concept: 'Satya', meaning: 'Truth', practice: 'Speak one truth today that you have been holding back — gently, without blame.', gitaRef: 'BG 17.15' },
      { concept: 'Karuna', meaning: 'Compassion', practice: 'Replace one criticism today (of self or other) with a compassionate observation.', gitaRef: 'BG 12.13' },
    ],
    affirmation: 'Today I know: my words are sacred instruments. I choose to speak only what heals.',
  },
  thought: {
    dharmicMirror: 'What I see in you is a mind that has become aware of its own patterns. This is rare and precious. Most minds run on autopilot, never questioning the stories they tell. You are here because you saw the pattern — and chose to examine it.',
    primaryShloka: {
      sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
      transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
      english: 'Let one lift oneself by one\'s own Self; let one not degrade oneself. For the Self alone is the friend of the self, and the Self alone is the enemy of the self.',
      chapter: 6,
      verse: 5,
      chapterName: 'Dhyāna Yoga',
    },
    dharmicCounsel: 'Krishna teaches that the mind can be your greatest ally or your most persistent adversary. The thought pattern you bring here is not who you are — it is a wave on the surface of the ocean that is your consciousness. The ocean is untouched by the wave. Your Atman is untouched by this thought.',
    karmicInsight: 'The very mind that created this pattern is the same mind that recognized it. Trust the part of you that sees clearly.',
    actionDharma: [
      { concept: 'Dhyana', meaning: 'Meditation', practice: 'Sit for 5 minutes today and watch your thoughts without following them.', gitaRef: 'BG 6.25' },
      { concept: 'Viveka', meaning: 'Discernment', practice: 'When the thought pattern arises, name it aloud: "This is the pattern, not the truth."', gitaRef: 'BG 2.14' },
      { concept: 'Abhyasa', meaning: 'Practice', practice: 'Replace the thought with one conscious breath. Repeat each time it returns.', gitaRef: 'BG 6.35' },
    ],
    affirmation: 'From this moment: I am the witness of my thoughts, not their prisoner.',
  },
  reaction: {
    dharmicMirror: 'What I see in you is courage to examine a moment where awareness slipped. Reaction is the collapse of the space between stimulus and choice. That you are here restoring that space is itself an act of yoga.',
    primaryShloka: {
      sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते॥',
      transliteration: 'duḥkheṣv anudvigna-manāḥ sukheṣu vigata-spṛhaḥ\nvīta-rāga-bhaya-krodhaḥ sthita-dhīr munir ucyate',
      english: 'One whose mind is undisturbed by sorrow, who does not crave pleasure, who is free from attachment, fear, and anger — such a person is called a sage of steady wisdom.',
      chapter: 2,
      verse: 56,
      chapterName: 'Sānkhya Yoga',
    },
    dharmicCounsel: 'The sthitaprajna — the person of steady wisdom — is not someone who never feels. They feel deeply. But between the feeling and the response, there is a sacred space. Krishna calls this samatva — equanimity. Your work now is to widen that space, breath by breath.',
    karmicInsight: 'Your reaction showed you exactly where your growth edge is. This is not failure — it is a precise map of where your practice needs to go.',
    actionDharma: [
      { concept: 'Kshama', meaning: 'Patience', practice: 'When triggered today, count to 5 before responding. Let the pause do its work.', gitaRef: 'BG 16.3' },
      { concept: 'Samatva', meaning: 'Equanimity', practice: 'Accept one situation today exactly as it is, without trying to change it.', gitaRef: 'BG 2.48' },
      { concept: 'Pratyahara', meaning: 'Sense withdrawal', practice: 'Close your eyes for 10 breaths when you feel the reaction building.', gitaRef: 'BG 2.58' },
    ],
    affirmation: 'I carry forward: the pause between feeling and action. In that pause lives my freedom.',
  },
  avoidance: {
    dharmicMirror: 'What I see in you is honesty about where you have turned away. Avoidance is the mind\'s way of protecting you from what feels too large to face. But you are here now, facing it. This takes the courage of Arjuna standing on the battlefield.',
    primaryShloka: {
      sanskrit: 'स्वधर्ममपि चावेक्ष्य न विकम्पितुमर्हसि।\nधर्म्याद्धि युद्धाच्छ्रेयोऽन्यत्क्षत्रियस्य न विद्यते॥',
      transliteration: 'sva-dharmam api cāvekṣya na vikampitum arhasi\ndharmyāddhi yuddhāc chreyo \'nyat kṣatriyasya na vidyate',
      english: 'Considering your own dharma, you should not waver. For a warrior, there is nothing more ennobling than a righteous duty.',
      chapter: 2,
      verse: 31,
      chapterName: 'Sānkhya Yoga',
    },
    dharmicCounsel: 'Krishna\'s message to Arjuna about svadharma applies directly to what you bring here. Your avoidance is Arjuna laying down his bow. But Krishna does not shame Arjuna — he shows him the larger picture. Your dharma is calling. The discomfort of avoidance is your soul\'s signal that something awaits your attention.',
    karmicInsight: 'What you have been avoiding is not the obstacle — it is the path. The discomfort you feel is the birth pain of growth.',
    actionDharma: [
      { concept: 'Svadharma', meaning: 'Personal duty', practice: 'Take one concrete step today toward what you have been avoiding. Just one.', gitaRef: 'BG 3.35' },
      { concept: 'Tapas', meaning: 'Discipline', practice: 'Sit with the discomfort of avoidance for 5 minutes without distracting yourself.', gitaRef: 'BG 17.14' },
      { concept: 'Shraddha', meaning: 'Faith', practice: 'Write down: "I trust that I can face this" — and read it aloud to yourself.', gitaRef: 'BG 17.3' },
    ],
    affirmation: 'Today I know: my dharma waits where my avoidance has been standing guard.',
  },
  intention: {
    dharmicMirror: 'What I see in you is a seeker examining the root of action itself. You are not merely looking at what you did — you are looking at why. This is the deepest form of karma yoga: examining the seed before judging the fruit.',
    primaryShloka: {
      sanskrit: 'यज्ञार्थात्कर्मणोऽन्यत्र लोकोऽयं कर्मबन्धनः।\nतदर्थं कर्म कौन्तेय मुक्तसङ्गः समाचर॥',
      transliteration: 'yajñārthāt karmaṇo \'nyatra loko \'yaṁ karma-bandhanaḥ\ntad-arthaṁ karma kaunteya mukta-saṅgaḥ samācara',
      english: 'Work done as a sacrifice to the Supreme frees one from bondage. Therefore, O Arjuna, perform your duty free from attachment.',
      chapter: 3,
      verse: 9,
      chapterName: 'Karma Yoga',
    },
    dharmicCounsel: 'Krishna teaches that all action either binds or liberates, depending on intention. Action performed as yajna — as sacred offering — liberates. Action performed for personal gain binds. The question is not whether your intention was perfect, but whether you can purify it going forward.',
    karmicInsight: 'The fact that you question your intention means you are already moving from unconscious action to conscious offering.',
    actionDharma: [
      { concept: 'Nishkama Karma', meaning: 'Desireless action', practice: 'Do one thing today purely as an offering, expecting nothing in return.', gitaRef: 'BG 2.47' },
      { concept: 'Atma Vichara', meaning: 'Self-inquiry', practice: 'Before your next decision, ask: "Is this arising from the Atman or from the ego?"', gitaRef: 'BG 6.5' },
      { concept: 'Seva', meaning: 'Service', practice: 'Perform one act of service today where no one will know it was you.', gitaRef: 'BG 3.19' },
    ],
    affirmation: 'From this moment: I act as an offering. The intention is the prayer; the action is the ritual.',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, reflections } = body

    if (!context?.category || !reflections) {
      return NextResponse.json(
        { detail: 'Missing required fields: context, reflections' },
        { status: 400 }
      )
    }

    // Try backend AI generation
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/karma-reset/wisdom`, {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify({ context, reflections }),
        signal: AbortSignal.timeout(20000),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return forwardCookies(
          backendResponse,
          NextResponse.json(data)
        )
      }
    } catch {
      // Backend unavailable — fall through to fallback
    }

    // Fallback to static wisdom
    const category = context.category as string
    const wisdom = FALLBACK_WISDOM[category] || FALLBACK_WISDOM.action

    return NextResponse.json(wisdom)
  } catch (error) {
    console.error('[Karma Reset Wisdom] Error:', error)
    return NextResponse.json(
      { detail: 'Unable to generate wisdom' },
      { status: 500 }
    )
  }
}
