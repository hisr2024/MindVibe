/**
 * Ardha Reframe API Route
 * Proxies reframing requests to the backend Ardha service
 * Handles CORS, error fallbacks, and response formatting
 *
 * Supports three analysis modes:
 * - standard: Quick 4-section reframe
 * - deep_dive: Comprehensive problem analysis with root cause exploration
 * - quantum_dive: Multi-dimensional analysis across all life aspects
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Valid analysis modes
type AnalysisMode = 'standard' | 'deep_dive' | 'quantum_dive'

// Fallback responses for each mode
const FALLBACK_RESPONSES: Record<AnalysisMode, {
  status: string
  reframe_guidance: Record<string, string>
  gita_verses_used: number
  analysis_mode: string
  _offline: boolean
}> = {
  standard: {
    status: 'success',
    reframe_guidance: {
      recognition: "I hear you. This thought is heavy, and it makes sense that it's getting to you.",
      deep_insight: "Here's the thing: thoughts feel like facts, especially the painful ones. But they're not. They're just your mind trying to make sense of things.",
      reframe: "You're not your thoughts - you're the one noticing them. Like clouds passing through a big sky, this thought will pass. The sky is always okay.",
      small_action_step: "Right now, take one slow breath. Then ask yourself: what would you say to a friend who told you they had this same thought?",
    },
    gita_verses_used: 0,
    analysis_mode: 'standard',
    _offline: true,
  },
  deep_dive: {
    status: 'success',
    reframe_guidance: {
      acknowledgment: "I hear you completely. What you're experiencing is real and valid. The weight you're carrying deserves to be acknowledged.",
      root_cause_analysis: "Beneath the surface thought, there's often something deeper: core beliefs, unmet needs, old wounds being touched. The mind evolved for survival, not truth - it broadcasts worst-case scenarios. But thoughts are mental modifications, not facts.",
      multi_perspective: "Your current view is valid, but what might a wise elder see? What would your healed future self say? What if there were evidence contradicting the harsh interpretation? Most suffering comes from seeing only one perspective.",
      comprehensive_reframe: "You are not this thought - you are the awareness that notices it. \"Sakshi bhava\" - witness consciousness. The very fact that you can observe this thought proves you are separate from it. You are the vast sky; this thought is a passing cloud.",
      solution_pathways: "PRACTICE: When this thought arises, say \"I notice I'm having the thought that...\" Take three slow breaths. Ask what you'd say to a friend with this same thought. You deserve that same gentleness.",
      empowering_closure: "You are already whole. This challenge does not diminish your essential nature. Like an anvil struck countless times, your true self remains unchanged. The clouds will pass. The sky remains.",
    },
    gita_verses_used: 0,
    analysis_mode: 'deep_dive',
    _offline: true,
  },
  quantum_dive: {
    status: 'success',
    reframe_guidance: {
      sacred_witnessing: "I bow to the depth of what you're bringing forward. This situation deserves to be truly seen and honored. The fact that you're willing to explore this so deeply shows remarkable self-awareness and courage.",
      five_dimensional_analysis: "This challenge touches multiple dimensions of your life. EMOTIONAL: What feelings lie beneath - fear, grief, longing? COGNITIVE: What thought patterns repeat? RELATIONAL: How are you treating yourself through this? PHYSICAL: Where does this live in your body? SPIRITUAL: What might life be teaching you through this experience?",
      root_pattern_archaeology: "This moment connects to deeper patterns. \"Samskara\" - the impressions that shape our reactions - formed long ago. When did you first learn to respond this way? The pattern once protected you. Now it may be ready to be released.",
      quantum_reframing: "THE QUANTUM SHIFT: From \"I am this problem\" to \"I am the awareness witnessing this challenge.\" Your essence - \"atman\" - remains untouched by any circumstance. What if this thought were a cloud, and you were the vast sky?",
      transformation_blueprint: "PRACTICE: When this arises, say: \"I notice I am having the thought that... I am the awareness noticing this thought. In this awareness, I am already at peace.\" Morning: Set intention to respond from wisdom. Evening: Reflect on one moment you responded from your new understanding.",
      life_purpose_integration: "Every challenge, fully integrated, becomes a source of wisdom. \"Tapas\" - the fire of difficulty - is forging you into something stronger. You are not here to escape this challenge but to be transformed by engaging with it fully. You are held. You are whole.",
    },
    gita_verses_used: 0,
    analysis_mode: 'quantum_dive',
    _offline: true,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { negative_thought, analysis_mode: requestedMode } = body

    if (!negative_thought || typeof negative_thought !== 'string') {
      return NextResponse.json(
        { error: 'negative_thought is required' },
        { status: 400 }
      )
    }

    // Validate and sanitize analysis mode
    const validModes: AnalysisMode[] = ['standard', 'deep_dive', 'quantum_dive']
    const analysisMode: AnalysisMode = validModes.includes(requestedMode)
      ? requestedMode
      : 'standard'

    // Sanitize input
    const sanitizedThought = negative_thought
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    try {
      // Call the backend Ardha endpoint with analysis mode
      const response = await fetch(`${BACKEND_URL}/api/ardha/reframe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          negative_thought: sanitizedThought,
          analysis_mode: analysisMode,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          status: data.status || 'success',
          reframe_guidance: data.reframe_guidance,
          gita_verses_used: data.gita_verses_used || 0,
          raw_text: data.raw_text,
          model: data.model,
          provider: data.provider || 'ardha',
          analysis_mode: data.analysis_mode || analysisMode,
        })
      }

      // Log the error for debugging
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Ardha API] Backend returned ${response.status}: ${errorText}`)

      // If rate limited, return appropriate error
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Too many requests. Please wait a moment and try again.',
            status: 'error',
          },
          { status: 429 }
        )
      }

      // For other errors, fall through to fallback
    } catch (backendError) {
      console.warn('[Ardha API] Backend connection failed:', backendError)
    }

    // Use fallback response when backend is unavailable (mode-specific)
    return NextResponse.json(FALLBACK_RESPONSES[analysisMode])
  } catch (error) {
    console.error('[Ardha API] Error:', error)

    // Always return a helpful response (default to standard mode)
    return NextResponse.json(FALLBACK_RESPONSES.standard)
  }
}

// Health check for the Ardha endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ardha-reframe',
    timestamp: new Date().toISOString(),
  })
}
