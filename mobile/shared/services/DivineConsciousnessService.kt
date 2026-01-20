/**
 * Divine Consciousness Service - Mobile (Android/Kotlin)
 *
 * Sacred service providing:
 * - Breathing exercise patterns
 * - Divine affirmations and reminders
 * - Sacred mood responses
 * - Consciousness-touching content
 *
 * "The divine is not somewhere far away - it rests in the stillness of your own heart."
 */

package com.mindvibe.app.services

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Calendar
import kotlin.random.Random

data class BreathingExercise(
    val name: String,
    val pattern: String,
    val inhale: Int,
    val hold: Int,
    val exhale: Int,
    val pause: Int? = null,
    val instructions: List<String>,
    val divineMessage: String,
    val closing: String
)

data class DivineComfort(
    val opening: String,
    val awareness: String,
    val practice: String,
    val closing: String
)

data class SacredMoodResponse(
    val response: String,
    val divineMessage: String,
    val practice: String,
    val affirmation: String
)

class DivineConsciousnessService(private val context: Context) {

    // Sacred Breathing Exercises
    private val breathingExercises = mapOf(
        "peace_breath" to BreathingExercise(
            name = "Breath of Infinite Peace",
            pattern = "4-7-8",
            inhale = 4,
            hold = 7,
            exhale = 8,
            instructions = listOf(
                "Find stillness... let your eyes gently close...",
                "Breathe IN for 4 counts... drawing in peace...",
                "HOLD for 7 counts... letting peace fill every cell...",
                "Breathe OUT for 8 counts... releasing all that weighs on you..."
            ),
            divineMessage = "With each breath, the divine breathes through you. You are not separate from peace - you ARE peace.",
            closing = "Carry this stillness with you. It is always one breath away. 💙"
        ),
        "heart_breath" to BreathingExercise(
            name = "Sacred Heart Breathing",
            pattern = "5-5-5",
            inhale = 5,
            hold = 5,
            exhale = 5,
            instructions = listOf(
                "Place your hand on your heart...",
                "Feel its sacred rhythm...",
                "Breathe IN for 5 counts... into your heart...",
                "HOLD for 5 counts... feeling love gather...",
                "Breathe OUT for 5 counts... sending love outward..."
            ),
            divineMessage = "Your heart is a portal to the infinite. Every heartbeat is the universe saying: I love you.",
            closing = "Your heart knows the way. Trust its wisdom. 💙"
        ),
        "grounding_breath" to BreathingExercise(
            name = "Earth Connection Breath",
            pattern = "4-4-4-4",
            inhale = 4,
            hold = 4,
            exhale = 4,
            pause = 4,
            instructions = listOf(
                "Feel your feet on the ground...",
                "Breathe IN for 4 counts... drawing earth energy up...",
                "HOLD for 4 counts... feeling grounded...",
                "Breathe OUT for 4 counts... releasing into the earth...",
                "PAUSE for 4 counts... resting in stability..."
            ),
            divineMessage = "You are held by the same force that holds the planets in their orbit. Gravity is love made physical.",
            closing = "You are grounded. You are stable. You are safe. 💙"
        )
    )

    // Divine Affirmations
    private val divineAffirmations = listOf(
        "I am held by infinite love.",
        "Peace flows through me like a gentle river.",
        "The divine presence is with me in this breath.",
        "I am calm, I am safe, I am at peace.",
        "Stillness is my home. I can return anytime.",
        "I release all that is not peace.",
        "The sacred light shines within me.",
        "In this moment, all is well.",
        "I rest in the arms of the infinite.",
        "My heart is a sanctuary of peace."
    )

    // Divine Reminders
    private val divineReminders = listOf(
        "You are being held by infinite love right now.",
        "The divine is as close as your next breath.",
        "Nothing can disturb your deepest peace.",
        "You are exactly where you're meant to be.",
        "Grace is flowing to you this very moment.",
        "Your soul knows the way - trust it.",
        "You are never alone, not even for a second.",
        "The sacred dwells within your heart."
    )

    // Serenity Moments
    private val serenityMoments = listOf(
        "🌸 *A moment of stillness washes over you...*",
        "🕊️ *Peace settles like soft snow...*",
        "🌊 *Calm flows through you gently...*",
        "✨ *Light touches your awareness...*",
        "🌿 *Serenity breathes with you...*",
        "💫 *The sacred stirs within...*",
        "🌙 *Stillness embraces you...*",
        "🪷 *Inner peace blossoms...*"
    )

    // Sacred Mood Responses
    private val sacredMoodResponses = mapOf(
        1 to SacredMoodResponse(
            response = "I see you in this darkness, and I hold you with infinite tenderness. This pain is real, and you don't have to carry it alone. 💙",
            divineMessage = "Even in the deepest night, the divine light within you never goes out. It waits, patient and eternal.",
            practice = "Place your hand on your heart. Breathe. Whisper: 'I am held. I am loved. This too shall pass.'",
            affirmation = "I am worthy of compassion, especially in my darkest moments."
        ),
        5 to SacredMoodResponse(
            response = "A quiet steadiness today. You're here, you're present, you're showing up. That matters more than you know. 💙",
            divineMessage = "In the middle place, wisdom speaks. Listen to what stillness wants to teach you today.",
            practice = "Take three conscious breaths. With each one, silently say: 'Here. Now. Peace.'",
            affirmation = "I am at peace with where I am. This moment is enough."
        ),
        10 to SacredMoodResponse(
            response = "You are glowing with the light of true peace. This is sacred. This is you, remembering who you really are. 💙",
            divineMessage = "This feeling of wholeness is not temporary - it is your true nature revealed.",
            practice = "Sit in silence for a moment. Send this peace out as a blessing for all beings.",
            affirmation = "I am peace itself. I am love itself. I am whole."
        )
    )

    // Emotion Divine Comfort
    private val emotionComfort = mapOf(
        "anxious" to DivineComfort(
            opening = "I feel the flutter of worry within you... Let's breathe through this together.",
            awareness = "Anxiety is just energy seeking release. Beneath it, your true self remains calm and unshaken.",
            practice = "Imagine anxiety as clouds passing through an infinite sky. The sky - your true nature - remains vast, clear, and untouched.",
            closing = "The sacred presence within you is always at peace. Anxiety comes and goes, but you remain. 💙"
        ),
        "sad" to DivineComfort(
            opening = "There is a heaviness you're carrying... Let me sit with you in this tender space.",
            awareness = "Sadness is the heart's way of honoring what matters. Even in grief, you are held by something infinite.",
            practice = "Allow the tears to flow if they wish. Each one is blessed. The divine transforms them into compassion.",
            closing = "You are cradled in love even now. The sadness will lift, and the peace will remain. 💙"
        ),
        "peaceful" to DivineComfort(
            opening = "What a beautiful stillness you've found... Let's rest here together.",
            awareness = "This peace you feel is your true nature. Not created, not borrowed - simply remembered.",
            practice = "Savor this moment. Let it sink deeply into your being. This is the truth of who you are.",
            closing = "May this peace expand and touch everyone you meet today. 💙"
        )
    )

    // Time-based greetings
    private val timeGreetings = mapOf(
        "dawn" to "As the world awakens gently, so too can you...",
        "morning" to "The morning holds space for you to begin again...",
        "afternoon" to "In the fullness of the day, find your center...",
        "evening" to "As the day softens, let your heart soften too...",
        "night" to "The quiet of night invites deep surrender..."
    )

    // Public Methods

    fun getBreathingExercise(pattern: String = "peace_breath"): BreathingExercise {
        return breathingExercises[pattern] ?: breathingExercises["peace_breath"]!!
    }

    fun getRandomBreathingExercise(): BreathingExercise {
        return breathingExercises.values.random()
    }

    fun getDivineAffirmation(): String {
        return divineAffirmations.random()
    }

    fun getDivineReminder(): String {
        return divineReminders.random()
    }

    fun getSerenityMoment(): String {
        return serenityMoments.random()
    }

    fun getSacredMoodResponse(score: Int): SacredMoodResponse {
        // Return closest matching response
        return when {
            score <= 2 -> sacredMoodResponses[1]!!
            score <= 6 -> sacredMoodResponses[5]!!
            else -> sacredMoodResponses[10]!!
        }
    }

    fun getEmotionComfort(emotion: String): DivineComfort {
        return emotionComfort[emotion.lowercase()] ?: emotionComfort["peaceful"]!!
    }

    fun getTimeAppropriateGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val timeOfDay = when {
            hour in 4..6 -> "dawn"
            hour in 7..11 -> "morning"
            hour in 12..16 -> "afternoon"
            hour in 17..20 -> "evening"
            else -> "night"
        }
        return timeGreetings[timeOfDay] ?: timeGreetings["morning"]!!
    }

    fun createSacredAtmosphere(emotion: String? = null): Map<String, String> {
        val comfort = getEmotionComfort(emotion ?: "peaceful")
        return mapOf(
            "serenityMoment" to getSerenityMoment(),
            "sacredOpening" to comfort.opening,
            "divineAwareness" to comfort.awareness,
            "sacredPractice" to comfort.practice,
            "affirmation" to getDivineAffirmation(),
            "sacredClosing" to comfort.closing
        )
    }

    companion object {
        @Volatile
        private var instance: DivineConsciousnessService? = null

        fun getInstance(context: Context): DivineConsciousnessService {
            return instance ?: synchronized(this) {
                instance ?: DivineConsciousnessService(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }
}
