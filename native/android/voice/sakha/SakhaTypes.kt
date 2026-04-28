/**
 * Sakha Voice — Shared Types
 *
 * Data classes, enums, and configuration for the Sakha Voice mode pipeline.
 * Sakha (सखा) is the friend/charioteer voice persona defined in
 * sakha.voice.openai.md — distinct from the generic KIAAN voice manager.
 *
 * Voice mode = mic → STT → backend Sakha SSE → pause-aware Sarvam TTS playback.
 */

package com.mindvibe.kiaan.voice.sakha

import java.util.Locale

// ============================================================================
// Engine Selection
// ============================================================================

/**
 * Which Sakha engine should the backend route to. Mirrors the <engine> tag
 * from the Sakha system prompt.
 */
enum class SakhaEngine(val wire: String) {
    GUIDANCE("GUIDANCE"),    // Wisdom-forward — verses front and centre
    FRIEND("FRIEND"),        // Empathetic, witnessing
    ASSISTANT("ASSISTANT"),  // Tool use, navigation
    VOICE_GUIDE("VOICE_GUIDE"); // Acknowledgment when handing off to a tool

    companion object {
        fun fromWire(value: String?): SakhaEngine = when (value?.uppercase()) {
            "GUIDANCE" -> GUIDANCE
            "ASSISTANT" -> ASSISTANT
            "VOICE_GUIDE" -> VOICE_GUIDE
            else -> FRIEND
        }
    }
}

/**
 * Mood label that drives tone selection. The 10 moods from the Sakha persona.
 */
enum class SakhaMood(val wire: String) {
    ANXIOUS("anxious"),
    SAD("sad"),
    ANGRY("angry"),
    LONELY("lonely"),
    CONFUSED("confused"),
    GRIEVING("grieving"),
    JOYFUL("joyful"),
    SEEKING("seeking"),
    GUILTY("guilty"),
    NUMB("numb"),
    NEUTRAL("neutral");

    companion object {
        fun fromWire(value: String?): SakhaMood = entries.firstOrNull {
            it.wire.equals(value, ignoreCase = true)
        } ?: NEUTRAL
    }
}

enum class SakhaMoodTrend(val wire: String) {
    STABLE("stable"),
    RISING("rising"),
    FALLING("falling"),
    MASKED("masked");

    companion object {
        fun fromWire(value: String?): SakhaMoodTrend = entries.firstOrNull {
            it.wire.equals(value, ignoreCase = true)
        } ?: STABLE
    }
}

/**
 * Languages Sakha can speak. The wire format matches Sarvam TTS language codes
 * where applicable; STT uses BCP-47 via [sttLocale].
 */
enum class SakhaLanguage(val wire: String, val sttLocale: Locale) {
    ENGLISH("en", Locale.US),
    HINDI("hi", Locale("hi", "IN")),
    HINGLISH("hinglish", Locale("hi", "IN")),
    TAMIL("ta", Locale("ta", "IN")),
    TELUGU("te", Locale("te", "IN")),
    BENGALI("bn", Locale("bn", "IN")),
    MARATHI("mr", Locale("mr", "IN")),
    SANSKRIT("sa", Locale("hi", "IN")); // STT falls back to Hindi for Sanskrit

    companion object {
        fun fromWire(value: String?): SakhaLanguage = entries.firstOrNull {
            it.wire.equals(value, ignoreCase = true)
        } ?: ENGLISH
    }
}

// ============================================================================
// State Machine
// ============================================================================

/**
 * Sakha Voice mode state machine. A single top-level state captures
 * "where the user is in the breathing of a turn".
 */
enum class SakhaVoiceState {
    UNINITIALIZED,
    IDLE,                 // Ready to be activated
    LISTENING,            // Mic open, capturing user speech
    TRANSCRIBING,         // STT finalizing transcript
    REQUESTING,           // SSE request open, waiting for first frame
    SPEAKING,             // TTS playback in progress
    PAUSING,              // Honouring a <pause:*> marker
    INTERRUPTED,          // User barged in mid-Sakha-utterance
    ERROR,
    SHUTDOWN
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Sakha Voice configuration. Sensible defaults match the persona spec —
 * change only when you know what you are doing.
 */
data class SakhaVoiceConfig(
    /** User-facing language. Drives STT locale and TTS voice routing. */
    val language: SakhaLanguage = SakhaLanguage.ENGLISH,

    /** Backend base URL, e.g. "https://api.kiaanverse.com" — no trailing slash. */
    val backendBaseUrl: String,

    /** Optional bearer token resolver. Called once per request. */
    val authTokenProvider: suspend () -> String? = { null },

    /** Path prefix to the voice-companion routes. Defaults to MindVibe layout. */
    val voiceCompanionPathPrefix: String = "/api/voice-companion",

    /** Sarvam-style voice id for the persona body voice. */
    val sakhaVoiceId: String = "sarvam-aura",

    /** Voice id used when speaking Sanskrit verses (slower, reverent). */
    val sanskritVoiceId: String = "sarvam-meera",

    /** Default engine if backend does not route. */
    val defaultEngine: SakhaEngine = SakhaEngine.FRIEND,

    /**
     * Allow the user to interrupt Sakha mid-utterance by speaking again
     * ("barge-in"). Disabled in low-power mode.
     */
    val allowBargeIn: Boolean = true,

    /** Silence (ms) after which the mic auto-closes. */
    val silenceTimeoutMs: Long = 1800L,

    /** Hard cap on a single utterance from Sakha. Defends UX in degraded modes. */
    val maxResponseSpokenMs: Long = 45_000L,

    /** Connect / read timeout for the SSE request. */
    val requestTimeoutMs: Long = 12_000L,

    /** How many times to retry the SSE request on transient failure. */
    val maxRequestRetries: Int = 2,

    /** Run the persona guard on every chunk before TTS hand-off. */
    val enablePersonaGuard: Boolean = true,

    /**
     * If true, the manager will speak a soft template ("रहो… let us breathe
     * together for a moment") instead of staying silent on FILTER_FAIL.
     */
    val speakOnFilterFail: Boolean = true,

    /** Verbose logcat. Off in release builds. */
    val debugMode: Boolean = false,
)

// ============================================================================
// Telemetry / Metrics
// ============================================================================

/**
 * Per-turn metrics. Surface these to your observability stack but never log
 * the user's transcript.
 */
data class SakhaTurnMetrics(
    val sessionId: String?,
    val engine: SakhaEngine,
    val mood: SakhaMood,
    val moodIntensity: Int,
    val language: SakhaLanguage,
    val transcriptChars: Int,
    val responseChars: Int,
    val sttDurationMs: Long,
    val firstByteMs: Long,
    val firstAudioMs: Long,
    val totalSpokenMs: Long,
    val pauseCount: Int,
    val verseCited: String?,
    val filterFail: Boolean,
    val personaGuardTriggered: Boolean,
    val barged: Boolean,
)

// ============================================================================
// Listener
// ============================================================================

/**
 * UI-facing listener. All callbacks fire on the main thread.
 *
 * - [onStateChanged] is the canonical signal for animating the mandala.
 * - [onPartialTranscript] is best-effort; do not block on it.
 * - [onSakhaText] streams full SSE token chunks (post-pause-marker stripping)
 *   so the UI can render a transcript while audio plays.
 * - [onPause] fires every time the player honours a <pause:*> marker.
 * - [onError] errors are non-fatal unless the state ends in [SakhaVoiceState.ERROR].
 */
interface SakhaVoiceListener {
    fun onStateChanged(state: SakhaVoiceState, previousState: SakhaVoiceState) {}
    fun onPartialTranscript(text: String) {}
    fun onFinalTranscript(text: String) {}
    fun onEngineSelected(engine: SakhaEngine, mood: SakhaMood, intensity: Int) {}
    fun onSakhaText(textDelta: String, isFinal: Boolean) {}
    fun onSpokenSegment(text: String, isSanskrit: Boolean) {}
    fun onPause(durationMs: Long) {}
    fun onVerseCited(reference: String, sanskrit: String?) {}
    fun onFilterFail() {}
    fun onTurnComplete(metrics: SakhaTurnMetrics) {}
    fun onError(error: SakhaVoiceError) {}
}

// ============================================================================
// Errors
// ============================================================================

sealed class SakhaVoiceError(message: String) : Exception(message) {
    object PermissionDenied : SakhaVoiceError("RECORD_AUDIO permission not granted")
    object MicrophoneUnavailable : SakhaVoiceError("Microphone not available")
    object SpeechRecognitionUnavailable : SakhaVoiceError("Speech recognition not available")
    data class NetworkError(val cause: String) : SakhaVoiceError("Network error: $cause")
    data class HttpError(val status: Int, val detail: String) : SakhaVoiceError("HTTP $status: $detail")
    object AuthRequired : SakhaVoiceError("Authentication required")
    object QuotaExceeded : SakhaVoiceError("Daily quota exceeded")
    object FilterFail : SakhaVoiceError("Sakha could not connect retrieved verses to the prompt")
    data class TtsError(val detail: String) : SakhaVoiceError("TTS error: $detail")
    data class Unknown(val detail: String) : SakhaVoiceError(detail)

    val isRecoverable: Boolean
        get() = when (this) {
            is PermissionDenied,
            is MicrophoneUnavailable,
            is SpeechRecognitionUnavailable,
            is AuthRequired,
            is QuotaExceeded -> false
            else -> true
        }
}

// ============================================================================
// Verse recitation
// ============================================================================

/**
 * One spoken segment of a Bhagavad Gita verse recitation. The
 * [language] determines TTS routing in [SakhaTtsPlayer]:
 *
 *   - SANSKRIT             → sanskritVoiceId (slower, reverent prosody)
 *   - any other            → sakhaVoiceId   (the persona body voice)
 *
 * The [SakhaLanguage] enum already covers en / hi / hinglish / ta / te /
 * bn / mr / sa, and the TTS player resolves voice id by language without
 * further branching, so adding Kannada / Gujarati / Malayalam / Punjabi
 * later only requires an enum entry plus a TTS voice id mapping — never
 * a reader change.
 */
data class VerseSegment(
    val language: SakhaLanguage,
    val text: String,
)

/**
 * A request to recite a verse in N languages. The reader replays the
 * segments in the order supplied, so callers choose the study order:
 * Sanskrit → Hindi → English (the canonical Gita order, most users)
 * or English → Sanskrit (first-time listeners who want meaning first).
 *
 * Inserted between every two consecutive segments is a soft pause
 * (default 700ms) so the listener can absorb each language before the
 * next begins. The first and last segment have no extra leading /
 * trailing pause — the player's natural prosody closes the recitation.
 */
data class VerseRecitation(
    val chapter: Int,
    val verse: Int,
    val segments: List<VerseSegment>,
    val betweenSegmentsPauseMs: Long = 700L,
) {
    val citation: String get() = "BG $chapter.$verse"

    init {
        require(chapter in 1..18) { "BG chapter must be 1..18, was $chapter" }
        require(verse in 1..78) { "BG verse must be 1..78, was $verse" }
        require(segments.isNotEmpty()) { "VerseRecitation requires at least one segment" }
        require(betweenSegmentsPauseMs >= 0) {
            "betweenSegmentsPauseMs must be non-negative, was $betweenSegmentsPauseMs"
        }
    }
}
