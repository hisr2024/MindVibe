/**
 * Karma Reset KIAAN Generate API Route
 * Proxies karma reset requests to the backend KIAAN service
 * Handles CORS, error fallbacks, retry logic, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(status: number): boolean {
  return status === 502 || status === 503 || status === 504
}

// All valid repair/path types: 10 new karmic paths + 3 legacy types
const ALL_VALID_PATH_KEYS = [
  // 10 Gita-grounded karmic paths
  'kshama', 'satya', 'shanti', 'atma_kshama', 'seva',
  'ahimsa', 'daya', 'tyaga', 'tapas', 'shraddha',
  // 3 legacy repair types (backward compatibility)
  'apology', 'clarification', 'calm_followup',
  // Legacy variation
  'self-forgive',
]

/** Static karmic path data for fallback when backend is unavailable */
const FALLBACK_KARMIC_PATHS: Record<string, {
  key: string
  name: string
  sanskrit_name: string
  description: string
  gita_principle: string
  karmic_teaching: string
  guna_analysis: string
  themes: string[]
}> = {
  kshama: {
    key: 'kshama',
    name: 'Kshama \u2014 The Path of Forgiveness',
    sanskrit_name: '\u0915\u094D\u0937\u092E\u093E',
    description: 'Sincere acknowledgment and heartfelt apology grounded in BG 16.3',
    gita_principle: 'Forgiveness (kshama) is a divine quality (BG 16.3)',
    karmic_teaching: 'True kshama arises when we see the other person as atman \u2014 the same divine consciousness wearing a different form. Forgiveness is not weakness; it is the supreme strength of one established in the Self.',
    guna_analysis: 'The harmful action was driven by rajas (agitation) or tamas (ignorance). Through kshama, we cultivate sattva \u2014 the quality of clarity, peace, and divine nature.',
    themes: ['forgiveness', 'apology', 'reconciliation', 'divine qualities'],
  },
  satya: {
    key: 'satya',
    name: 'Satya \u2014 The Path of Truth',
    sanskrit_name: '\u0938\u0924\u094D\u092F',
    description: 'Gentle clarification with compassionate speech grounded in BG 17.15',
    gita_principle: 'Speech that is truthful, pleasing, and beneficial is tapas of speech (BG 17.15)',
    karmic_teaching: 'Satya is not merely stating facts but speaking truth with compassion. The Gita teaches that true speech is that which causes no agitation, is truthful, pleasing, and beneficial.',
    guna_analysis: 'Miscommunication arises from rajasic haste or tamasic avoidance. Sattvic communication brings clarity through gentle, truthful speech.',
    themes: ['truth', 'clarification', 'gentle speech', 'compassion'],
  },
  shanti: {
    key: 'shanti',
    name: 'Shanti \u2014 The Path of Peace',
    sanskrit_name: '\u0936\u093E\u0928\u094D\u0924\u093F',
    description: 'Restoring calm through equanimity grounded in BG 2.66',
    gita_principle: 'There is no wisdom for the unsteady, no peace for the restless (BG 2.66)',
    karmic_teaching: 'Shanti is the natural state of the atman. When we act from agitation, we create disharmony. The Gita teaches that lasting peace comes through equanimity \u2014 samatva \u2014 remaining balanced in success and failure.',
    guna_analysis: 'Disturbance is the nature of rajas. Through shanti, we return to sattva \u2014 the natural equilibrium of the witnessing Self.',
    themes: ['peace', 'equanimity', 'calm', 'balance'],
  },
  atma_kshama: {
    key: 'atma_kshama',
    name: 'Atma Kshama \u2014 The Path of Self-Forgiveness',
    sanskrit_name: '\u0906\u0924\u094D\u092E \u0915\u094D\u0937\u092E\u093E',
    description: 'Releasing self-blame through witness consciousness grounded in BG 6.5',
    gita_principle: 'Let one lift oneself by one\'s own Self (BG 6.5)',
    karmic_teaching: 'Self-forgiveness begins with understanding that the true Self \u2014 the atman \u2014 is never stained by action. When you identify with the body-mind, you suffer. When you identify with the witness, you see that mistakes are instruments of growth.',
    guna_analysis: 'Self-blame is tamasic \u2014 it leads to paralysis and despair. Through atma kshama, we transform tamas into the clarity of sattva.',
    themes: ['self-forgiveness', 'self-compassion', 'witness consciousness', 'inner strength'],
  },
  seva: {
    key: 'seva',
    name: 'Seva \u2014 The Path of Selfless Amends',
    sanskrit_name: '\u0938\u0947\u0935\u093E',
    description: 'Making amends through nishkama karma grounded in BG 3.19',
    gita_principle: 'Perform your duty without attachment to results (BG 3.19)',
    karmic_teaching: 'Seva transforms selfish action into sacred offering. When you make amends as nishkama karma \u2014 without attachment to whether they accept or forgive \u2014 the action itself becomes purifying.',
    guna_analysis: 'Selfish action is rajasic. Through seva, we transform it into sattvic action \u2014 performed as sacred duty without ego or expectation.',
    themes: ['selfless service', 'amends', 'nishkama karma', 'sacred duty'],
  },
  ahimsa: {
    key: 'ahimsa',
    name: 'Ahimsa \u2014 The Path of Non-Harm',
    sanskrit_name: '\u0905\u0939\u093F\u0902\u0938\u093E',
    description: 'Gentle repair through compassion grounded in BG 16.2',
    gita_principle: 'Non-violence, truthfulness, absence of anger (BG 16.2)',
    karmic_teaching: 'Ahimsa extends beyond physical non-violence to speech and thought. The Gita lists it among the divine qualities. True repair begins when we commit to causing no further harm in word, deed, or intention.',
    guna_analysis: 'Harm arises from rajasic anger or tamasic cruelty. Through ahimsa, we cultivate the sattvic quality of universal compassion.',
    themes: ['non-violence', 'compassion', 'gentle repair', 'divine qualities'],
  },
  daya: {
    key: 'daya',
    name: 'Daya \u2014 The Path of Compassion',
    sanskrit_name: '\u0926\u092F\u093E',
    description: 'Empathetic reconnection through universal vision grounded in BG 6.29',
    gita_principle: 'One who sees the Self in all beings (BG 6.29)',
    karmic_teaching: 'Daya arises naturally when we see the divine in every being. The Gita teaches that one who sees the same Self everywhere \u2014 the same joy, the same sorrow \u2014 is the highest yogi.',
    guna_analysis: 'Disconnection from others is a product of avidya (ignorance) and tamas. Through daya, we restore the sattvic vision of universal oneness.',
    themes: ['compassion', 'empathy', 'universal vision', 'connection'],
  },
  tyaga: {
    key: 'tyaga',
    name: 'Tyaga \u2014 The Path of Letting Go',
    sanskrit_name: '\u0924\u094D\u092F\u093E\u0917',
    description: 'Releasing attachment to outcomes through surrender grounded in BG 18.66',
    gita_principle: 'Abandon all dharmas and take refuge in Me alone (BG 18.66)',
    karmic_teaching: 'Tyaga is not giving up action, but giving up attachment to results. When you have done your best to repair, release the outcome. The Gita teaches complete surrender \u2014 not as weakness, but as the highest form of strength.',
    guna_analysis: 'Attachment to outcomes is rajasic. Through tyaga, we release the grip of ego and find freedom in sattvic surrender.',
    themes: ['letting go', 'surrender', 'non-attachment', 'freedom'],
  },
  tapas: {
    key: 'tapas',
    name: 'Tapas \u2014 The Path of Committed Transformation',
    sanskrit_name: '\u0924\u092A\u0938\u094D',
    description: 'Deep behavioral change through austerity grounded in BG 17.14',
    gita_principle: 'Worship of the devas, the teacher, the wise; purity, straightforwardness, celibacy, non-violence \u2014 this is bodily austerity (BG 17.14)',
    karmic_teaching: 'Tapas transforms the instrument of action itself. It is the commitment to sustained change \u2014 not a one-time apology, but a restructuring of habits, reactions, and patterns through disciplined spiritual practice.',
    guna_analysis: 'Repeated harmful patterns are tamasic inertia. Through tapas \u2014 sustained, dedicated effort \u2014 we burn away impurities and establish new sattvic patterns.',
    themes: ['transformation', 'commitment', 'austerity', 'discipline'],
  },
  shraddha: {
    key: 'shraddha',
    name: 'Shraddha \u2014 The Path of Trust Rebuilding',
    sanskrit_name: '\u0936\u094D\u0930\u0926\u094D\u0927\u093E',
    description: 'Consistent, faith-based action over time grounded in BG 17.3',
    gita_principle: 'The faith of each is in accordance with one\'s nature (BG 17.3)',
    karmic_teaching: 'Shraddha is faith made visible through consistent action. Trust, once broken, is rebuilt not through words but through demonstrated commitment over time. The Gita teaches that our faith shapes our nature \u2014 by committing to trustworthy action, we transform ourselves.',
    guna_analysis: 'Trust-breaking arises from rajasic self-interest or tamasic negligence. Through shraddha, we cultivate sattvic faith \u2014 steady, consistent, and aligned with dharma.',
    themes: ['trust', 'faith', 'consistency', 'rebuilding'],
  },
}

/** Legacy path key to karmic path key mapping */
const LEGACY_TO_KARMIC: Record<string, string> = {
  apology: 'kshama',
  clarification: 'satya',
  calm_followup: 'shanti',
  'self-forgive': 'atma_kshama',
}

/** 7-phase definitions for fallback */
const FALLBACK_PHASES = [
  { phase: 1, name: 'Sthiti Pariksha', sanskrit_name: '\u0938\u094D\u0925\u093F\u0924\u093F \u092A\u0930\u0940\u0915\u094D\u0937\u093E', english_name: 'Witness Awareness', icon: 'eye' },
  { phase: 2, name: 'Karma Darshan', sanskrit_name: '\u0915\u0930\u094D\u092E \u0926\u0930\u094D\u0936\u0928', english_name: 'Karmic Insight', icon: 'sparkles' },
  { phase: 3, name: 'Pranayama Shuddhi', sanskrit_name: '\u092A\u094D\u0930\u093E\u0923\u093E\u092F\u093E\u092E \u0936\u0941\u0926\u094D\u0927\u093F', english_name: 'Sacred Breath', icon: 'wind' },
  { phase: 4, name: 'Pashchataap', sanskrit_name: '\u092A\u0936\u094D\u091A\u093E\u0924\u093E\u092A', english_name: 'Deep Acknowledgment', icon: 'droplets' },
  { phase: 5, name: 'Prayaschitta', sanskrit_name: '\u092A\u094D\u0930\u093E\u092F\u0936\u094D\u091A\u093F\u0924\u094D\u0924', english_name: 'Sacred Repair', icon: 'heart' },
  { phase: 6, name: 'Sankalpa', sanskrit_name: '\u0938\u0902\u0915\u0932\u094D\u092A', english_name: 'Sacred Intention', icon: 'flame' },
  { phase: 7, name: 'Gita Darshan', sanskrit_name: '\u0917\u0940\u0924\u093E \u0926\u0930\u094D\u0936\u0928', english_name: 'Wisdom Integration', icon: 'book_open' },
]

/** Build a complete fallback response with karmic_path and deep_guidance */
function buildFallbackResponse(repairType: string) {
  // Resolve to karmic path key (handle legacy types)
  const pathKey = LEGACY_TO_KARMIC[repairType] || repairType
  const karmicPath = FALLBACK_KARMIC_PATHS[pathKey] || FALLBACK_KARMIC_PATHS.kshama

  // Build 7-phase fallback guidance
  const phases = FALLBACK_PHASES.map((phaseDef) => ({
    ...phaseDef,
    guidance: getStaticPhaseGuidance(phaseDef.phase, karmicPath),
  }))

  return {
    karmic_path: karmicPath,
    deep_guidance: {
      phases,
      sadhana: [
        'Begin each morning with 5 minutes of pranayama (conscious breathing) to center yourself.',
        'Read one verse from the Bhagavad Gita daily and reflect on its application to your situation.',
        'Practice witness consciousness: observe your reactions without identifying with them.',
        'Before sleep, review the day and acknowledge one moment where you chose dharma over impulse.',
      ],
      core_verse: {
        chapter: 6,
        verse: 5,
        sanskrit: '\u0909\u0926\u094D\u0927\u0930\u0947\u0926\u093E\u0924\u094D\u092E\u0928\u093E\u0924\u094D\u092E\u093E\u0928\u0902 \u0928\u093E\u0924\u094D\u092E\u093E\u0928\u092E\u0935\u0938\u093E\u0926\u092F\u0947\u0924\u094D',
        transliteration: 'uddhared atmanatmanam natmanam avasadayet',
        english: 'Let one lift oneself by one\'s own Self; let not one degrade oneself; for the Self alone is the friend of the self, and the Self alone is the enemy of the self.',
        hindi: '\u0905\u092A\u0928\u0947 \u0906\u092A\u0915\u094B \u0909\u0926\u094D\u0927\u093E\u0930 \u0915\u0930\u094B, \u0905\u092A\u0928\u0947 \u0906\u092A\u0915\u094B \u0928\u0940\u091A\u0947 \u0928 \u0917\u093F\u0930\u093E\u0913\u0964',
      },
      supporting_verses: [
        { chapter: 2, verse: 47, key_teaching: 'You have a right to action alone, never to its fruits' },
        { chapter: 18, verse: 66, key_teaching: 'Surrender all dharmas and take refuge in Me alone' },
      ],
    },
    reset_guidance: {
      breathingLine: "Take seven slow breaths. The Gita teaches that pranayama purifies the mind and creates space for wisdom.",
      rippleSummary: "A karmic ripple has touched your life. Every action creates consequence, and every consequence is an opportunity for transformation.",
      repairAction: "Reflect deeply with honesty and compassion. As Lord Krishna teaches: 'Elevate yourself through the power of your mind.'",
      forwardIntention: "Walk forward with sacred intention. Transformation is a sustained commitment to dharmic living.",
    },
    kiaan_metadata: {
      verses_used: 3,
      verses: [],
      validation_passed: true,
      validation_score: 0.7,
      five_pillar_score: 0.7,
      compliance_level: '7/10',
      pillars_met: 3,
      gita_terms_found: ['dharma', 'karma', 'atman', 'pranayama'],
      wisdom_context: 'Static Gita wisdom fallback',
    },
    meta: {
      request_id: 'fallback',
      processing_time_ms: 0,
      model_used: 'fallback',
      kiaan_enhanced: false,
      deep_reset_version: '2.0',
      phases_count: 7,
      karmic_paths_available: 10,
    },
  }
}

/** Get static guidance text for a given phase */
function getStaticPhaseGuidance(phase: number, karmicPath: typeof FALLBACK_KARMIC_PATHS['kshama']): string {
  switch (phase) {
    case 1:
      return 'Close your eyes. Step back from the situation and become the witness \u2014 the sakshi. You are not the anger, not the guilt, not the situation. You are the eternal awareness observing all of this. The Gita teaches: the Supreme Self in the body is the witness, the consenter, the sustainer.'
    case 2:
      return `Now see the karmic pattern clearly. ${karmicPath.guna_analysis} Understanding which quality of nature drove your action is the first step to transformation.`
    case 3:
      return 'Take seven deep breaths using the 4-7-8 pattern: inhale for 4 counts, hold for 7, exhale for 8. With each breath, release the agitated energy. The Gita teaches that sacred breath purification calms the storm within and creates the inner clarity needed for genuine repair.'
    case 4:
      return 'Acknowledge the full impact of your action. Not with guilt \u2014 which is tamasic and leads to paralysis \u2014 but with dharmic clarity. See the ripple you caused. Feel it. Name it honestly. This is the courage of truthful self-assessment that the Gita praises.'
    case 5:
      return `Now perform the sacred repair. ${karmicPath.karmic_teaching.slice(0, 200)} Remember: your right is to the action alone, never to its fruits. Perform this repair because it is dharma.`
    case 6:
      return 'Set your sankalpa \u2014 your sacred intention for transformation. This is not a wish but a dharmic commitment. The Gita teaches: let one lift oneself by one\'s own Self. Commit to the daily sadhana that will sustain this transformation.'
    case 7:
      return `Receive this wisdom from the Gita, spoken directly to your situation. ${karmicPath.gita_principle}. Let this teaching settle into your heart. It has guided seekers for thousands of years, and it guides you now.`
    default:
      return 'Continue your journey with awareness and compassion.'
  }
}

interface KarmaResetRequest {
  situation: string
  feeling?: string
  repair_type: string
}

export async function POST(request: NextRequest) {
  try {
    const body: KarmaResetRequest = await request.json()
    const { situation, feeling, repair_type } = body

    // Validate input
    if (!situation || typeof situation !== 'string') {
      return NextResponse.json(
        { error: 'situation is required', detail: 'Please describe the situation' },
        { status: 400 }
      )
    }

    // feeling is optional - default to empty string if not provided
    const feelingValue = (feeling && typeof feeling === 'string') ? feeling : ''

    if (!repair_type || !ALL_VALID_PATH_KEYS.includes(repair_type)) {
      return NextResponse.json(
        { error: 'invalid repair_type', detail: `repair_type must be one of: ${ALL_VALID_PATH_KEYS.join(', ')}` },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedSituation = situation.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000)
    const sanitizedFeeling = feelingValue.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 500)

    // Build headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    })

    // Forward auth headers
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }

    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader)
    }

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
        await sleep(backoffMs)
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for AI

        const response = await fetch(`${BACKEND_URL}/api/karma-reset/kiaan/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            situation: sanitizedSituation,
            feeling: sanitizedFeeling,
            repair_type,
          }),
          signal: controller.signal,
          cache: 'no-store',
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            karmic_path: data.karmic_path,
            deep_guidance: data.deep_guidance,
            reset_guidance: data.reset_guidance,
            kiaan_metadata: data.kiaan_metadata || {
              provider: data.provider || 'kiaan',
              model: data.model || 'unknown',
              fallback: false
            },
            meta: data.meta,
          })
        }

        // Check for retryable errors
        if (isRetryableError(response.status) && attempt < MAX_RETRIES) {
          console.warn(`[karma-reset/generate] Retryable error ${response.status}, will retry...`)
          continue
        }

        // Log non-retryable errors
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[karma-reset/generate] Backend returned ${response.status}: ${errorText}`)

        // Rate limiting
        if (response.status === 429) {
          return NextResponse.json(
            {
              error: 'rate_limited',
              message: 'Too many requests. Please wait a moment and try again.',
            },
            { status: 429 }
          )
        }

        // Auth errors - don't use fallback
        if (response.status === 401) {
          return NextResponse.json(
            {
              error: 'authentication_required',
              message: 'Please log in to use Karma Reset',
            },
            { status: 401 }
          )
        }

      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`[karma-reset/generate] Request timeout on attempt ${attempt + 1}`)
            if (attempt < MAX_RETRIES) continue
          } else {
            console.warn(`[karma-reset/generate] Network error on attempt ${attempt + 1}:`, error.message)
            if (attempt < MAX_RETRIES) continue
          }
        }
      }
    }

    // All retries failed - use complete fallback response with karmic_path + deep_guidance
    console.warn('[karma-reset/generate] All retries exhausted, using fallback response')
    return NextResponse.json({
      ...buildFallbackResponse(repair_type),
      _offline: true,
    })

  } catch (error) {
    console.error('[karma-reset/generate] Error:', error)

    // Return complete fallback response
    return NextResponse.json({
      ...buildFallbackResponse('kshama'),
      _offline: true,
      _error: 'An unexpected error occurred'
    })
  }
}
