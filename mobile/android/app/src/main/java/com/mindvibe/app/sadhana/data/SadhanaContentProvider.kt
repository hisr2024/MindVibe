package com.mindvibe.app.sadhana.data

import com.mindvibe.app.sadhana.model.BreathingPattern
import com.mindvibe.app.sadhana.model.DharmaIntention
import com.mindvibe.app.sadhana.model.ReflectionPrompt
import com.mindvibe.app.sadhana.model.SadhanaComposition
import com.mindvibe.app.sadhana.model.SadhanaMood
import com.mindvibe.app.sadhana.model.SadhanaVerse
import com.mindvibe.app.sadhana.model.TimeOfDay

/**
 * Offline, deterministic Nitya Sadhana content.
 *
 * Why offline-first: the practice must begin within seconds, even on poor
 * networks, on an airplane, or during a 4am sadhana before the backend is
 * reachable. When [SadhanaRepository] later gains a remote source, this
 * provider remains the fallback so the experience is never blocked on I/O.
 *
 * The composition is deterministic per (mood, timeOfDay) so a seeker can
 * return to the same verse throughout a sitting if they pause and resume.
 */
object SadhanaContentProvider {

    fun compose(mood: SadhanaMood, timeOfDay: TimeOfDay): SadhanaComposition {
        val pattern = breathingPatternFor(mood)
        val verse = verseFor(mood)
        val reflection = reflectionFor(mood, verse)
        val intention = intentionFor(mood, timeOfDay)
        val greeting = "${timeOfDay.greetingEn}"

        val totalMinutes =
            ((pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut) * pattern.cycles / 60) + 6

        return SadhanaComposition(
            greeting = greeting,
            breathingPattern = pattern,
            verse = verse,
            reflectionPrompt = reflection,
            dharmaIntention = intention,
            durationEstimateMinutes = totalMinutes.coerceAtLeast(7),
            timeOfDay = timeOfDay,
        )
    }

    private fun breathingPatternFor(mood: SadhanaMood): BreathingPattern = when (mood) {
        SadhanaMood.Radiant -> BreathingPattern(
            name = "Energizing Breath (4-2-4-2)",
            inhale = 4, holdIn = 2, exhale = 4, holdOut = 2, cycles = 6,
            description = "An invigorating 4-2-4-2 pattern that brightens your energy. " +
                "Inhale for 4 counts, hold briefly for 2, exhale for 4 counts, and pause " +
                "for 2. This rhythm amplifies your natural radiance.",
        )
        SadhanaMood.Peaceful -> BreathingPattern(
            name = "Sama Vritti (4-4-4-4)",
            inhale = 4, holdIn = 4, exhale = 4, holdOut = 4, cycles = 6,
            description = "Equal-ratio breath to deepen the calm you already carry. Each " +
                "phase is the same length — a moving meditation that keeps the mind " +
                "resting in balance.",
        )
        SadhanaMood.Grateful -> BreathingPattern(
            name = "Heart Bloom (4-7-8-0)",
            inhale = 4, holdIn = 7, exhale = 8, holdOut = 0, cycles = 5,
            description = "A 4-7-8 rhythm to soften the heart and let gratitude bloom. " +
                "Inhale for 4, hold for 7, exhale for 8. Feel thankfulness settle into " +
                "every cell.",
        )
        SadhanaMood.Seeking -> BreathingPattern(
            name = "Nadi Shodhana (5-2-5-2)",
            inhale = 5, holdIn = 2, exhale = 5, holdOut = 2, cycles = 6,
            description = "A balancing breath for the seeker. Steady inhale of 5, brief " +
                "pause, steady exhale of 5. Clarity arises when prana flows evenly.",
        )
        SadhanaMood.Heavy -> BreathingPattern(
            name = "Grounding Breath (6-2-8-0)",
            inhale = 6, holdIn = 2, exhale = 8, holdOut = 0, cycles = 5,
            description = "A long-exhale pattern to release what weighs on you. Inhale " +
                "slowly for 6, hold 2, release fully for 8. Let the earth take what you " +
                "can no longer carry.",
        )
        SadhanaMood.Wounded -> BreathingPattern(
            name = "Tender Breath (4-4-6-2)",
            inhale = 4, holdIn = 4, exhale = 6, holdOut = 2, cycles = 5,
            description = "A gentle, longer-exhale breath to soothe a tender heart. " +
                "Breathe as if you are holding yourself — with kindness, without hurry.",
        )
    }

    private fun verseFor(mood: SadhanaMood): SadhanaVerse = when (mood) {
        SadhanaMood.Grateful, SadhanaMood.Radiant -> SadhanaVerse(
            chapter = 3,
            verse = 35,
            chapterName = "Karma Yoga",
            sanskrit = "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।\n" +
                "स्वधर्मे निधनं श्रेयः परधर्मो भयावहः॥",
            transliteration = "śhreyān swa-dharmo viguṇaḥ para-dharmāt sv-anuṣhṭhitāt\n" +
                "swa-dharme nidhanaṁ śhreyaḥ para-dharmo bhayāvahaḥ",
            english = "Your path is your own. Stop comparing it to someone else's journey.",
            modernInsight = "Better to walk your own dharma imperfectly than to mimic " +
                "another's flawlessly. Your path is sacred because it is yours.",
            kiaanInsight = "As you wake up feeling grateful, remember that your journey " +
                "is uniquely yours. Embrace the path you are on, and let go of the urge " +
                "to compare it with others, for each step you take is a valuable part of " +
                "your own story.",
        )
        SadhanaMood.Peaceful -> SadhanaVerse(
            chapter = 2,
            verse = 48,
            chapterName = "Sankhya Yoga",
            sanskrit = "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\n" +
                "सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
            transliteration = "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya\n" +
                "siddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga uchyate",
            english = "Rest in yoga and act. Release attachment. Equanimity in success and " +
                "failure — that is yoga.",
            modernInsight = "Stillness is not the absence of action. It is the ground " +
                "from which wise action arises.",
            kiaanInsight = "The calm you feel right now is not a lucky mood — it is your " +
                "true nature remembering itself. Let every action today spring from this " +
                "quiet center, and the results will tend to themselves.",
        )
        SadhanaMood.Seeking -> SadhanaVerse(
            chapter = 4,
            verse = 34,
            chapterName = "Jnana Karma Sanyasa Yoga",
            sanskrit = "तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया।\n" +
                "उपदेक्ष्यन्ति ते ज्ञानं ज्ञानिनस्तत्त्वदर्शिनः॥",
            transliteration = "tad viddhi praṇipātena paripraśhnena sevayā\n" +
                "upadekṣhyanti te jñānaṁ jñāninas tattva-darśhinaḥ",
            english = "Approach the wise with humility, honest questions, and service — " +
                "and the truth will be revealed.",
            modernInsight = "Seeking is sacred. The very hunger in you today is the first " +
                "step of the answer.",
            kiaanInsight = "Your restlessness is not a flaw — it is the soul pressing at " +
                "the door. Keep asking, keep listening. Truth reveals itself to those who " +
                "refuse to grow numb.",
        )
        SadhanaMood.Heavy -> SadhanaVerse(
            chapter = 6,
            verse = 5,
            chapterName = "Dhyana Yoga",
            sanskrit = "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\n" +
                "आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
            transliteration = "uddhared ātmanātmānaṁ nātmānam avasādayet\n" +
                "ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ",
            english = "Lift yourself by yourself; do not let yourself sink. You are your " +
                "own friend and your own foe.",
            modernInsight = "The weight is real. The kindness you owe yourself right now " +
                "is even more real.",
            kiaanInsight = "You are carrying something heavy, and you showed up anyway. " +
                "That is the friendship of the Self. One breath, one kind choice — that " +
                "is how the soul lifts itself home.",
        )
        SadhanaMood.Wounded -> SadhanaVerse(
            chapter = 18,
            verse = 66,
            chapterName = "Moksha Sanyasa Yoga",
            sanskrit = "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\n" +
                "अहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
            transliteration = "sarva-dharmān parityajya mām ekaṁ śharaṇaṁ vraja\n" +
                "ahaṁ tvāṁ sarva-pāpebhyo mokṣhayiṣhyāmi mā śhuchaḥ",
            english = "Let everything go and simply take refuge. You will be held. Do not " +
                "grieve.",
            modernInsight = "Surrender is not defeat. Sometimes the bravest prayer is: " +
                "'I cannot carry this alone.'",
            kiaanInsight = "Your wound is not the end of your story. Let it rest in " +
                "something larger than yourself — breath, presence, the Divine you choose " +
                "to trust. You are allowed to be held.",
        )
    }

    private fun reflectionFor(mood: SadhanaMood, verse: SadhanaVerse): ReflectionPrompt =
        when (mood) {
            SadhanaMood.Grateful, SadhanaMood.Radiant -> ReflectionPrompt(
                prompt = "Take a moment to appreciate the steps you've taken on your journey. " +
                    "How has your path shaped who you are today?",
                guidingQuestion = "In what ways can you celebrate your individuality without " +
                    "falling into the trap of comparison?",
            )
            SadhanaMood.Peaceful -> ReflectionPrompt(
                prompt = "Where in your life is this stillness already quietly at work?",
                guidingQuestion = "What one small action today can arise from this peace " +
                    "rather than from urgency?",
            )
            SadhanaMood.Seeking -> ReflectionPrompt(
                prompt = "What question is your soul circling right now?",
                guidingQuestion = "Where could humility or service open the next door for you?",
            )
            SadhanaMood.Heavy -> ReflectionPrompt(
                prompt = "Name the weight — just one honest sentence.",
                guidingQuestion = "What would it feel like to be a friend to yourself today?",
            )
            SadhanaMood.Wounded -> ReflectionPrompt(
                prompt = "What part of you needs the most tenderness today?",
                guidingQuestion = "Who or what can safely hold this with you — even if only " +
                    "for a breath?",
            )
        }

    private fun intentionFor(mood: SadhanaMood, timeOfDay: TimeOfDay): DharmaIntention {
        val slot = timeOfDay.name.lowercase()
        return when (mood) {
            SadhanaMood.Grateful -> DharmaIntention(
                suggestion = "Today, write down three things that you are grateful for in " +
                    "your own life journey. Reflect on how they contribute to your unique " +
                    "path.",
                category = "Gratitude",
            )
            SadhanaMood.Radiant -> DharmaIntention(
                suggestion = "Today, let your light serve one person without expecting " +
                    "anything back. Notice how radiance grows when it is given away.",
                category = "Seva",
            )
            SadhanaMood.Peaceful -> DharmaIntention(
                suggestion = "Before every task today, pause for one conscious breath. Let " +
                    "each action begin in stillness.",
                category = "Presence",
            )
            SadhanaMood.Seeking -> DharmaIntention(
                suggestion = "Ask one honest question today — of a teacher, a friend, or " +
                    "your own journal. Sit with the answer without rushing to conclude.",
                category = "Jijnasa",
            )
            SadhanaMood.Heavy -> DharmaIntention(
                suggestion = "Choose one small, kind act toward yourself today. Rest when " +
                    "needed. Drink water. Go slowly.",
                category = "Self-compassion",
            )
            SadhanaMood.Wounded -> DharmaIntention(
                suggestion = "Today, let yourself be held — by breath, by a trusted person, " +
                    "by the Divine name you love. You do not have to carry this alone.",
                category = "Sharanagati",
            )
        }.let { base ->
            // Append the slot so UI can show "For today, morning"
            base.copy(category = "${base.category}|$slot")
        }
    }
}
