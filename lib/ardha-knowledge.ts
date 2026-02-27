/**
 * ARDHA Knowledge Base — Frontend TypeScript
 *
 * Atma-Reframing through Dharma and Higher Awareness
 *
 * Provides the complete ARDHA 5-pillar framework for frontend display,
 * including Gita verse references, compliance tests, and pillar descriptions.
 *
 * Strict Gita Compliance:
 * - All verse references from the authenticated 701-verse corpus
 * - No invented or paraphrased verses
 * - Every pillar grounded in specific BG chapter:verse citations
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface ArdhaVerse {
  reference: string
  english: string
  principle: string
  reframeGuidance: string
  mentalHealthTags: string[]
}

export interface ArdhaPillar {
  code: string
  name: string
  sanskritName: string
  coreTeaching: string
  description: string
  diagnosticQuestions: string[]
  reframeTemplate: string
  complianceTest: string
  keyVerses: ArdhaVerse[]
  icon: string
}

export interface ArdhaComplianceTest {
  test: string
  pillar: string
  failIndicator: string
  correction: string
}

export interface ArdhaAnalysis {
  primary_emotion: string
  detected_emotions: string[]
  pillars: {
    code: string
    name: string
    sanskrit_name: string
    compliance_test: string
  }[]
  crisis_detected: boolean
}

export interface ArdhaCompliance {
  overall_compliant: boolean
  score: number
  max_score: number
  tests: {
    test: string
    pillar: string
    passed: boolean
  }[]
}

export interface ArdhaResult {
  response: string
  sections: Record<string, string>
  requestedAt: string
  sources?: { file: string; reference: string }[]
  depth?: DepthMode
  ardha_analysis?: ArdhaAnalysis
  compliance?: ArdhaCompliance
}

export type DepthMode = 'quick' | 'deep' | 'quantum'

// ─── ARDHA Pillars ──────────────────────────────────────────────────────

export const ARDHA_PILLARS: ArdhaPillar[] = [
  {
    code: 'A',
    name: 'Atma Distinction',
    sanskritName: 'Atma Viveka',
    icon: 'A',
    coreTeaching:
      'Before correcting thoughts, correct identity. You are the witnessing consciousness, not the mind, intellect, or ego. The Self remains untouched by the fluctuations of the instrument.',
    description:
      'Separate the witnessing Self (Atma) from the experiencing instrument (mind-body-ego). The mind experiences frustration, the intellect evaluates skill, the ego claims ownership — but the Self remains untouched.',
    diagnosticQuestions: [
      'Am I identifying with the role rather than the Self?',
      'Is the ego claiming ownership of this experience?',
      'Can I observe this thought without becoming it?',
      'Am I confusing a temporary state with my permanent nature?',
    ],
    reframeTemplate:
      'Not — "I am failing." But — "A limitation is appearing in this instrument." This dissolves ego-identification and restores witness awareness.',
    complianceTest: 'Is identity detached from role?',
    keyVerses: [
      {
        reference: 'BG 2.16',
        english:
          'The unreal has no existence, and the real never ceases to be. The truth about both has been realized by the seers of Truth.',
        principle: 'The Self (sat) is permanent; mental states (asat) are impermanent.',
        reframeGuidance:
          'This thought/feeling is asat (impermanent). Your true nature (sat) is untouched.',
        mentalHealthTags: ['identity_clarity', 'self_knowledge', 'impermanence'],
      },
      {
        reference: 'BG 2.20',
        english:
          'The soul is never born, nor does it ever die. It is unborn, eternal, ever-existing, and primeval.',
        principle: 'Your essential nature is beyond birth, death, and change.',
        reframeGuidance:
          'Your core Self is not defined by this experience. Roles change, but the witness remains constant.',
        mentalHealthTags: ['resilience', 'self_knowledge', 'identity_clarity'],
      },
      {
        reference: 'BG 2.13',
        english:
          'Just as the soul passes through childhood, youth, and old age in this body, so too does it pass into another body.',
        principle: 'Phases and states change; the Self witnessing them does not.',
        reframeGuidance:
          'This phase of struggle is a transition, not a definition. The witness remains steady.',
        mentalHealthTags: ['impermanence', 'acceptance', 'self_awareness'],
      },
    ],
  },
  {
    code: 'R',
    name: 'Raga-Dvesha Diagnosis',
    sanskritName: 'Raga-Dvesha Pariksha',
    icon: 'R',
    coreTeaching:
      'Disturbance arises from attachment (raga) and aversion (dvesha). From attachment springs desire; from desire, frustration. The issue is not skill deficiency — it is fruit-attachment. Detach first. Improve second.',
    description:
      'Scan for the hidden attachment or aversion driving the disturbance. What result are you attached to? What recognition are you craving? What fear of loss is driving agitation?',
    diagnosticQuestions: [
      'What result am I attached to?',
      'What recognition am I craving?',
      'What fear of loss is driving this agitation?',
      'Is this disturbance arising from raga (desire) or dvesha (aversion)?',
    ],
    reframeTemplate:
      'The issue is not the external situation. The issue is the attachment/aversion operating underneath. Identify the raga or dvesha, then release the grip.',
    complianceTest: 'Is action performed without craving?',
    keyVerses: [
      {
        reference: 'BG 2.62',
        english:
          'While contemplating the objects of the senses, a person develops attachment. From attachment, desire is born. From desire, anger arises.',
        principle: 'The chain: contemplation -> attachment -> desire -> anger.',
        reframeGuidance:
          'Trace your disturbance backwards. Break the chain at contemplation.',
        mentalHealthTags: ['anger_management', 'attachment_release', 'self_awareness'],
      },
      {
        reference: 'BG 2.63',
        english:
          'From anger arises delusion; from delusion, bewilderment of memory; from loss of memory, the destruction of intelligence.',
        principle: 'The cascade: anger -> delusion -> memory loss -> destruction.',
        reframeGuidance:
          'If angry or confused, trace it back to the original attachment. Awareness of this chain breaks it.',
        mentalHealthTags: ['impulse_control', 'cognitive_clarity', 'emotional_regulation'],
      },
      {
        reference: 'BG 3.37',
        english:
          'It is desire alone, born of contact with the mode of passion, that later transforms into anger. Know this as the all-devouring enemy.',
        principle: 'Desire (kama) is the root enemy that transforms into anger.',
        reframeGuidance:
          'The real enemy is not the person or situation — it is the desire underneath. Name it.',
        mentalHealthTags: ['anger_management', 'self_discipline', 'discernment'],
      },
    ],
  },
  {
    code: 'D',
    name: 'Dharma Alignment',
    sanskritName: 'Dharma Nishtha',
    icon: 'D',
    coreTeaching:
      'Your duty is not to guarantee success, secure praise, or outperform everyone. Your duty is to act sincerely, refine skill diligently, and perform your role without negligence. You have control over action alone, never its fruits.',
    description:
      'Align your action with dharma. Stop trying to control outcomes. Focus entirely on the quality of your effort. Action purified of attachment becomes Yoga.',
    diagnosticQuestions: [
      'What is my actual duty in this situation?',
      'Am I trying to control the outcome instead of the effort?',
      'Am I performing my dharma or someone else\'s?',
      'Is my action driven by duty or by anxiety about results?',
    ],
    reframeTemplate:
      'Your dharma is sincere effort, not guaranteed results. Perform your role with full attention and skill. Release the outcome.',
    complianceTest: 'Is outcome mentally released?',
    keyVerses: [
      {
        reference: 'BG 2.47',
        english:
          'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
        principle: 'You control action alone, never its fruits. This is Karma Yoga.',
        reframeGuidance:
          'Focus on what you can control: quality of effort. Release what you cannot: the specific outcome.',
        mentalHealthTags: ['stress_reduction', 'letting_go', 'action', 'duty'],
      },
      {
        reference: 'BG 3.35',
        english:
          'It is far better to discharge one\'s prescribed duty, even faultily, than another\'s duty perfectly.',
        principle: 'Honor your unique path. Comparison breeds suffering.',
        reframeGuidance:
          'Stop comparing your path to others. Imperfect YOUR duty is superior to perfect imitation.',
        mentalHealthTags: ['self_acceptance', 'identity_clarity', 'purpose_and_meaning'],
      },
      {
        reference: 'BG 3.8',
        english:
          'Perform your prescribed duty, for action is better than inaction.',
        principle: 'Action is always superior to inaction.',
        reframeGuidance:
          'Even imperfect action is better than paralysis. Move forward with whatever capacity you have.',
        mentalHealthTags: ['motivation', 'action', 'resilience'],
      },
    ],
  },
  {
    code: 'H',
    name: 'Hrdaya Samatvam',
    sanskritName: 'Hrdaya Samatvam',
    icon: 'H',
    coreTeaching:
      'Equal vision in gain and loss, success and failure, praise and criticism. Equanimity is higher than achievement. Without samatvam, action binds. With samatvam, action liberates.',
    description:
      'Before acting, affirm: If improvement comes, I remain steady. If delay comes, I remain steady. If criticism comes, I remain steady. Equanimity is not indifference — it is stability of heart.',
    diagnosticQuestions: [
      'Am I disturbed because the outcome didn\'t match my expectation?',
      'Can I remain equally steady in praise and criticism?',
      'Is my inner stability dependent on external validation?',
      'Am I swinging between elation and despair based on results?',
    ],
    reframeTemplate:
      'If improvement comes, I remain steady. If delay comes, I remain steady. If criticism comes, I remain steady.',
    complianceTest: 'Is equanimity maintained?',
    keyVerses: [
      {
        reference: 'BG 2.48',
        english:
          'Perform action being steadfast in Yoga, abandoning attachment and balanced in success and failure. Equanimity is called Yoga.',
        principle: 'Samatvam (equanimity) IS Yoga. This is the definition.',
        reframeGuidance:
          'Yoga is not a posture — it is equanimity in action. Balance regardless of outcome.',
        mentalHealthTags: ['equanimity', 'balance', 'inner_peace', 'action'],
      },
      {
        reference: 'BG 2.38',
        english:
          'Treating alike pleasure and pain, gain and loss, victory and defeat, engage in battle.',
        principle: 'Equal vision in all dualities is the prerequisite for right action.',
        reframeGuidance:
          'Before you act, establish inner balance. Treat success and failure as equally informative.',
        mentalHealthTags: ['equanimity', 'emotional_regulation', 'resilience'],
      },
      {
        reference: 'BG 2.56',
        english:
          'One whose mind is not disturbed by misery, who does not crave pleasure, free from attachment, fear, and anger — such a person is called a sage of steady wisdom.',
        principle: 'Sthitaprajna: the person of steady wisdom is undisturbed.',
        reframeGuidance:
          'The ideal is not to never feel pain, but to not be disturbed by it. Pain is information.',
        mentalHealthTags: ['emotional_regulation', 'equanimity', 'wisdom'],
      },
    ],
  },
  {
    code: 'A2',
    name: 'Arpana',
    sanskritName: 'Ishvara Arpana',
    icon: 'A',
    coreTeaching:
      'Offer the action. Mentally dedicate: "This effort is not for ego. It is an offering." Release the result to the larger order. When action is offered, anxiety decreases, ego softens, fear loses force. Surrender completes Karma Yoga.',
    description:
      'The final step: offer your action and its results to the larger order. This is not passive resignation — it is active surrender. You do your best, then release the outcome.',
    diagnosticQuestions: [
      'Am I holding onto the result with a clenched fist?',
      'Can I offer this action as a dedication rather than a demand?',
      'Is my ego the primary beneficiary of this action?',
      'Can I trust the larger order with what I cannot control?',
    ],
    reframeTemplate:
      'This effort is not for ego. It is an offering. I have done my part with sincerity. The result belongs to the larger order. I release it now.',
    complianceTest: 'Is action offered beyond ego?',
    keyVerses: [
      {
        reference: 'BG 18.66',
        english:
          'Abandon all varieties of dharma and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
        principle: 'Ultimate surrender: let go of all anxiety. Trust in the larger order.',
        reframeGuidance:
          'Complete surrender. You have done everything you can. Now release. Trust the larger order.',
        mentalHealthTags: ['surrender', 'letting_go', 'faith', 'anxiety_management'],
      },
      {
        reference: 'BG 9.27',
        english:
          'Whatever you do, whatever you eat, whatever you offer — do it as an offering to Me.',
        principle: 'Every action becomes sacred when offered.',
        reframeGuidance:
          'Transform ordinary action into sacred offering. This removes the burden of personal ownership.',
        mentalHealthTags: ['purpose_and_meaning', 'devotion', 'letting_go'],
      },
      {
        reference: 'BG 18.57',
        english:
          'Mentally renouncing all actions in Me, having Me as the highest goal, resorting to the yoga of discrimination, fix your mind on Me always.',
        principle: 'Mental renunciation of results while maintaining focus.',
        reframeGuidance:
          'Fully engaged in action while mentally renouncing results. Full effort, zero ownership.',
        mentalHealthTags: ['letting_go', 'focus', 'detachment', 'mindfulness'],
      },
    ],
  },
]

// ─── ARDHA Section Headings ─────────────────────────────────────────────

export const ARDHA_SECTION_HEADINGS = [
  'Atma Distinction',
  'Raga-Dvesha Scan',
  'Dharma Alignment',
  'Hrdaya Samatvam',
  'Arpana',
  'Gita Verse',
  'Compliance Check',
]

// ─── ARDHA Compliance Tests ─────────────────────────────────────────────

export const ARDHA_COMPLIANCE_TESTS: ArdhaComplianceTest[] = [
  {
    test: 'Is identity detached from role?',
    pillar: 'A',
    failIndicator: 'User still identifies self with the problem/role.',
    correction: 'Apply Atma Distinction: separate Self from instrument.',
  },
  {
    test: 'Is action performed without craving?',
    pillar: 'R',
    failIndicator: 'User is still driven by raga or dvesha.',
    correction: 'Apply Raga-Dvesha Diagnosis: name the attachment.',
  },
  {
    test: 'Is outcome mentally released?',
    pillar: 'D',
    failIndicator: 'User is still fixated on a specific outcome.',
    correction: 'Apply Dharma Alignment: focus on effort, release outcome.',
  },
  {
    test: 'Is equanimity maintained?',
    pillar: 'H',
    failIndicator: "User's emotional state depends on external results.",
    correction: 'Apply Hrdaya Samatvam: affirm steadiness in all outcomes.',
  },
  {
    test: 'Is action offered beyond ego?',
    pillar: 'A2',
    failIndicator: "User's action is ego-driven, not offered.",
    correction: 'Apply Arpana: dedicate action as offering.',
  },
]

// ─── Structural Differences from CBT ────────────────────────────────────

export const ARDHA_VS_CBT = {
  cbt: {
    approach: 'Correct distorted thinking',
    ego: 'Strengthens functional ego',
    goal: 'Mental health',
  },
  ardha: {
    approach: 'Correct mistaken identity',
    ego: 'Loosens ego-identification',
    goal: 'Inner freedom through right action',
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────

export function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[-–]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '')
}

export function parseArdhaSections(response: string): Record<string, string> {
  const sections: Record<string, string> = {}
  let currentHeading: string | null = null

  response.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    const headingMatch = ARDHA_SECTION_HEADINGS.find(
      (heading) => trimmed.toLowerCase().startsWith(heading.toLowerCase()),
    )

    if (headingMatch) {
      currentHeading = headingMatch
      sections[slugifyHeading(headingMatch)] = ''
    } else if (currentHeading) {
      const key = slugifyHeading(currentHeading)
      sections[key] = sections[key] ? `${sections[key]} ${trimmed}` : trimmed
    }
  })

  return sections
}
