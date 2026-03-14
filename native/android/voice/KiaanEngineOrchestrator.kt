/**
 * KIAAN Engine Orchestrator - Android Native Three-Engine Pipeline
 *
 * Runs Guidance, Friend, and Navigation engines in parallel using coroutines.
 * Produces instant local responses (<100ms) then optionally enhances via backend.
 *
 * Engines:
 * 1. Friend Engine — mood detection + empathetic response (keyword-based)
 * 2. Guidance Engine — Gita verse matching + wisdom (from cached verse corpus)
 * 3. Navigation Engine — intent classification + tool suggestion
 *
 * Power-aware: ultra-low = Friend only; balanced/performance = all 3.
 * Thermal-aware: auto-switches to ultra-low on THERMAL_STATUS_SEVERE+.
 */

package com.mindvibe.kiaan.voice

import android.content.Context
import android.os.Build
import android.os.PowerManager
import kotlinx.coroutines.*

// ============================================================================
// Types
// ============================================================================

enum class PowerMode(val value: String) {
    ULTRA_LOW("ultra-low"),
    BALANCED("balanced"),
    PERFORMANCE("performance")
}

data class EngineResult(
    val friendResponse: String,
    val detectedMood: String,
    val moodIntensity: Double,
    val verseRef: String?,
    val wisdomText: String?,
    val intent: String,
    val toolSuggestion: String?,
    val localResponse: String,
    val needsEnhancement: Boolean,
    val processingTimeMs: Double,
    val powerMode: PowerMode
)

data class CachedVerse(
    val ref: String,
    val chapter: Int,
    val verse: Int,
    val sanskrit: String,
    val translation: String,
    val theme: String,
    val emotions: List<String>,
    val modernInsight: String
)

// ============================================================================
// Main Orchestrator
// ============================================================================

class KiaanEngineOrchestrator private constructor(private val context: Context) {

    companion object {
        @Volatile
        private var instance: KiaanEngineOrchestrator? = null

        fun getInstance(context: Context): KiaanEngineOrchestrator {
            return instance ?: synchronized(this) {
                instance ?: KiaanEngineOrchestrator(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }

    private val verseCache: MutableList<CachedVerse> = mutableListOf()
    private var turnCount: Int = 0
    private val recentVerseRefs: MutableList<String> = mutableListOf()
    private var lastMood: String = "neutral"

    init {
        loadVerseCache()
    }

    // ========================================================================
    // Public API
    // ========================================================================

    /**
     * Process user input through all three engines. Target: <100ms.
     */
    suspend fun orchestrate(
        userInput: String,
        language: String = "en"
    ): EngineResult = withContext(Dispatchers.Default) {
        val startTime = System.nanoTime()
        val powerMode = detectPowerMode()
        turnCount++

        val input = userInput.lowercase().trim()

        // Ultra-low power: Friend Engine only
        if (powerMode == PowerMode.ULTRA_LOW) {
            val (mood, intensity) = detectMood(input)
            val friendResponse = generateFriendResponse(input, mood, language)
            val elapsed = (System.nanoTime() - startTime) / 1_000_000.0

            return@withContext EngineResult(
                friendResponse = friendResponse,
                detectedMood = mood,
                moodIntensity = intensity,
                verseRef = null,
                wisdomText = null,
                intent = "query",
                toolSuggestion = null,
                localResponse = friendResponse,
                needsEnhancement = false,
                processingTimeMs = elapsed,
                powerMode = powerMode
            )
        }

        // Balanced/Performance: All 3 engines in parallel via coroutines
        val friendDeferred = async {
            val (mood, intensity) = detectMood(input)
            Triple(generateFriendResponse(input, mood, language), mood, intensity)
        }

        val navigationDeferred = async {
            classifyIntent(input)
        }

        val (friendResponse, mood, intensity) = friendDeferred.await()
        val (intent, toolSuggestion) = navigationDeferred.await()

        // Engine 2: Guidance (depends on mood from Engine 1)
        var verseRef: String? = null
        var wisdomText: String? = null

        if (shouldOfferGuidance(mood)) {
            val matched = matchVerse(mood)
            verseRef = matched?.ref
            if (matched != null) {
                wisdomText = "${matched.translation}\n— Bhagavad Gita ${matched.ref}\n${matched.modernInsight}"
            }
        }

        // Merge responses
        val parts = mutableListOf(friendResponse)
        wisdomText?.let { parts.add(it) }
        if (intent == "navigate" && toolSuggestion != null) {
            parts.add("Would you like me to open $toolSuggestion?")
        }
        val localResponse = parts.joinToString("\n\n")
        val needsEnhancement = shouldEnhance(mood, intent)

        lastMood = mood
        verseRef?.let {
            recentVerseRefs.add(it)
            if (recentVerseRefs.size > 10) recentVerseRefs.removeFirst()
        }

        val elapsed = (System.nanoTime() - startTime) / 1_000_000.0

        EngineResult(
            friendResponse = friendResponse,
            detectedMood = mood,
            moodIntensity = intensity,
            verseRef = verseRef,
            wisdomText = wisdomText,
            intent = intent,
            toolSuggestion = toolSuggestion,
            localResponse = localResponse,
            needsEnhancement = needsEnhancement,
            processingTimeMs = elapsed,
            powerMode = powerMode
        )
    }

    // ========================================================================
    // Friend Engine
    // ========================================================================

    private val moodKeywords = mapOf(
        "angry" to listOf("angry", "furious", "rage", "mad", "frustrated", "annoyed", "irritated", "hate"),
        "sad" to listOf("sad", "depressed", "lonely", "hopeless", "grief", "crying", "miserable", "heartbroken"),
        "anxious" to listOf("anxious", "worried", "nervous", "scared", "panic", "fear", "stressed", "overwhelmed"),
        "confused" to listOf("confused", "lost", "uncertain", "doubt", "don't know", "unsure", "stuck"),
        "jealous" to listOf("jealous", "envious", "envy", "compare", "why them", "unfair"),
        "guilty" to listOf("guilty", "shame", "regret", "sorry", "fault", "blame", "wrong"),
        "peaceful" to listOf("peaceful", "calm", "grateful", "thankful", "happy", "joy", "blessed", "content"),
        "seeking" to listOf("meaning", "purpose", "dharma", "path", "direction", "goal", "destiny")
    )

    private fun detectMood(input: String): Pair<String, Double> {
        var bestMood = "neutral"
        var bestScore = 0

        for ((mood, keywords) in moodKeywords) {
            val score = keywords.count { input.contains(it) }
            if (score > bestScore) {
                bestScore = score
                bestMood = mood
            }
        }

        val intensity = if (bestScore > 0) minOf(bestScore / 3.0, 1.0) else 0.3
        return Pair(bestMood, intensity)
    }

    private fun generateFriendResponse(input: String, mood: String, language: String): String {
        return when (mood) {
            "angry" -> "I can feel that frustration. It's completely valid to feel this way. Take a breath — I'm here."
            "sad" -> "I hear you, and I want you to know that your feelings matter. You don't have to carry this alone."
            "anxious" -> "That sounds really overwhelming. Let's take this one step at a time. You're safe right now."
            "confused" -> "It's okay not to have all the answers right now. Sometimes clarity comes when we stop forcing it."
            "jealous" -> "Comparison can be so painful. Your journey is uniquely yours — and it has its own beauty."
            "guilty" -> "Everyone makes mistakes. What matters is that you're reflecting on it — that takes real courage."
            "peaceful" -> "That's beautiful. Hold onto that feeling — you've earned this moment of peace."
            "seeking" -> "Seeking purpose is itself a sign of growth. Let's explore what feels meaningful to you."
            else -> "I'm here with you. Tell me what's on your mind — no filters needed."
        }
    }

    // ========================================================================
    // Navigation Engine
    // ========================================================================

    private val navigationKeywords = mapOf(
        "journal" to "journal",
        "write" to "journal",
        "meditate" to "meditation",
        "meditation" to "meditation",
        "breathe" to "breathing",
        "breathing" to "breathing",
        "mantra" to "mantra",
        "chapter" to "gita_navigator",
        "verse" to "gita_navigator",
        "settings" to "settings",
        "profile" to "profile"
    )

    private fun classifyIntent(input: String): Pair<String, String?> {
        for ((keyword, tool) in navigationKeywords) {
            if (input.contains(keyword)) {
                return Pair("navigate", tool)
            }
        }
        return Pair("query", null)
    }

    // ========================================================================
    // Guidance Engine
    // ========================================================================

    private fun shouldOfferGuidance(mood: String): Boolean {
        if (turnCount < 3) return false
        val guidanceMoods = setOf("angry", "sad", "anxious", "confused", "jealous", "guilty", "seeking")
        return mood in guidanceMoods
    }

    private fun matchVerse(mood: String): CachedVerse? {
        val candidates = verseCache.filter { verse ->
            mood in verse.emotions && verse.ref !in recentVerseRefs
        }
        return candidates.randomOrNull() ?: verseCache.firstOrNull { mood in it.emotions }
    }

    // ========================================================================
    // Enhancement Decision
    // ========================================================================

    private fun shouldEnhance(mood: String, intent: String): Boolean {
        if (intent == "navigate") return false
        val deepMoods = setOf("sad", "anxious", "guilty", "seeking")
        return mood in deepMoods || turnCount <= 2
    }

    // ========================================================================
    // Power Management
    // ========================================================================

    private fun detectPowerMode(): PowerMode {
        // Check thermal state (Android 10+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val thermalStatus = powerManager?.currentThermalStatus ?: PowerManager.THERMAL_STATUS_NONE
            if (thermalStatus >= PowerManager.THERMAL_STATUS_SEVERE) {
                return PowerMode.ULTRA_LOW
            }
        }

        // Check battery saver mode
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        if (powerManager?.isPowerSaveMode == true) {
            return PowerMode.ULTRA_LOW
        }

        return PowerMode.BALANCED
    }

    // ========================================================================
    // Verse Cache
    // ========================================================================

    private fun loadVerseCache() {
        verseCache.addAll(listOf(
            CachedVerse("2.47", 2, 47,
                "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
                "You have the right to action alone, never to its fruits.",
                "Detachment", listOf("anxious", "stressed", "seeking"),
                "Focus on what you can control — your effort — not outcomes."),
            CachedVerse("2.14", 2, 14,
                "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः",
                "Sensory experiences are temporary — they come and go.",
                "Impermanence", listOf("sad", "anxious", "angry"),
                "This feeling is real, but it's temporary. It will pass."),
            CachedVerse("6.5", 6, 5,
                "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्",
                "Elevate yourself through your own effort. You are your own friend and enemy.",
                "Self-mastery", listOf("confused", "sad", "guilty"),
                "You have the power to lift yourself. Start with one small step."),
            CachedVerse("6.35", 6, 35,
                "असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
                "The mind is restless, but it can be trained through practice and detachment.",
                "Mind training", listOf("anxious", "confused", "angry"),
                "A restless mind is normal. Meditation and consistent practice tame it."),
            CachedVerse("9.26", 9, 26,
                "पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति",
                "Whoever offers even a leaf with devotion — I accept that offering of love.",
                "Self-worth", listOf("guilty", "sad", "seeking"),
                "Your small sincere efforts are enough. You don't need to be perfect."),
            CachedVerse("9.30", 9, 30,
                "अपि चेत्सुदुराचारो भजते मामनन्यभाक्",
                "Even the most imperfect person who turns with sincerity shall be regarded as righteous.",
                "Redemption", listOf("guilty", "sad", "confused"),
                "Your past doesn't define you. The decision to change is what matters."),
            CachedVerse("2.62", 2, 62,
                "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते",
                "Dwelling on sense objects creates attachment, which leads to desire and anger.",
                "Chain of destruction", listOf("angry", "jealous"),
                "When anger rises, notice what attachment is behind it."),
            CachedVerse("3.37", 3, 37,
                "काम एष क्रोध एष रजोगुणसमुद्भवः",
                "It is desire and anger, born of passion, that consume and corrupt.",
                "Anger source", listOf("angry", "jealous", "guilty"),
                "Anger often masks a deeper desire or hurt. Look beneath the surface."),
            CachedVerse("18.47", 18, 47,
                "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्",
                "Better your own dharma imperfectly than another's dharma perfectly.",
                "Authenticity", listOf("jealous", "confused", "seeking"),
                "Stop comparing your path to others. Your unique journey is valid."),
            CachedVerse("18.66", 18, 66,
                "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
                "Surrender unto me alone. I shall deliver you. Do not fear.",
                "Surrender", listOf("anxious", "sad", "seeking"),
                "Sometimes letting go of control is the bravest act. Trust the process."),
            CachedVerse("12.13", 12, 13,
                "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
                "One who hates no being, who is friendly and compassionate to all.",
                "Compassion", listOf("angry", "jealous"),
                "Compassion starts with yourself. Extend the kindness you give others inward."),
            CachedVerse("5.21", 5, 21,
                "बाह्यस्पर्शेष्वसक्तात्मा विन्दत्यात्मनि यत्सुखम्",
                "One whose self is unattached to external contacts finds happiness within.",
                "Inner peace", listOf("peaceful", "seeking"),
                "True joy isn't found in external things. It's already within you.")
        ))
    }
}
