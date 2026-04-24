package com.mindvibe.app.emotionalreset.data

import com.mindvibe.app.emotionalreset.model.BreathPattern
import com.mindvibe.app.emotionalreset.model.EmotionalResetComposition
import com.mindvibe.app.emotionalreset.model.FeelingState
import com.mindvibe.app.emotionalreset.model.Shloka
import com.mindvibe.app.emotionalreset.model.WitnessResponse

/**
 * Offline wisdom library for the Emotional Reset flow. Every feeling maps
 * deterministically to a Bhagavad Gita shloka + witness + reflection +
 * affirmation so the practice works in airplane mode and on first-run.
 *
 * When the KIAAN backend goes live the repository will prefer the network
 * path; this provider remains the trusted fallback.
 */
internal object EmotionalResetContentProvider {

    fun compose(feeling: FeelingState, intensity: Int): EmotionalResetComposition {
        val witness = witnessFor(feeling)
        val breath = breathFor(intensity)
        return EmotionalResetComposition(
            feeling = feeling,
            intensity = intensity.coerceIn(1, 5),
            witness = witness,
            breath = breath,
            transitionLabel = "${feeling.label} → Peace",
        )
    }

    fun breathFor(intensity: Int): BreathPattern = when {
        intensity <= 2 -> BreathPattern(inhale = 4, holdIn = 4, exhale = 4, holdOut = 1, rounds = 4)
        intensity <= 4 -> BreathPattern(inhale = 4, holdIn = 7, exhale = 8, holdOut = 1, rounds = 4)
        else -> BreathPattern(inhale = 2, holdIn = 4, exhale = 6, holdOut = 1, rounds = 4)
    }

    /**
     * Each mapping uses a verse that genuinely speaks to the feeling — e.g.
     * BG 2.14 on the transience of feeling for grief/sadness, BG 6.5 on
     * self-uplift for exhaustion, BG 18.58 on surrender for anxiety.
     */
    @Suppress("LongMethod")
    private fun witnessFor(feeling: FeelingState): WitnessResponse = when (feeling) {
        FeelingState.Grief -> WitnessResponse(
            witness = "Dear one, I see the weight you carry. Grief is love with nowhere to go — and that love is sacred.",
            shloka = Shloka(
                sanskrit = "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
                transliteration = "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ",
                translation = "The contacts of the senses — cold and heat, joy and sorrow — come and go; they are impermanent. Endure them, Arjuna.",
                reference = "Bhagavad Gita 2.14",
            ),
            reflection = "The wave of grief will crest and fall. You are the ocean beneath — vast, unchanging, whole.",
            affirmation = "I let grief move through me; the Atman within remains untouched.",
        )

        FeelingState.Fear -> WitnessResponse(
            witness = "I see the tremor in you. Fear is the mind's way of reaching for the unknown — it is not who you are.",
            shloka = Shloka(
                sanskrit = "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
                transliteration = "yadā yadā hi dharmasya glānir bhavati bhārata",
                translation = "Whenever dharma declines, I manifest Myself. You are never alone in the dark.",
                reference = "Bhagavad Gita 4.7",
            ),
            reflection = "Fear points to what you love. Let it be a teacher, not a jailer.",
            affirmation = "I am held. The same force that turns the stars walks with me.",
        )

        FeelingState.Anger -> WitnessResponse(
            witness = "I feel the fire in your chest. Anger is dharma pressing against a wrong — honor it, do not be ruled by it.",
            shloka = Shloka(
                sanskrit = "क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥",
                transliteration = "krodhād bhavati sammohaḥ",
                translation = "From anger comes delusion; from delusion, loss of memory; from loss of memory, the ruin of discrimination.",
                reference = "Bhagavad Gita 2.63",
            ),
            reflection = "Let the fire burn clean — not at another, but through what no longer serves.",
            affirmation = "I transmute anger into sacred action.",
        )

        FeelingState.Confusion -> WitnessResponse(
            witness = "Dear one, the fog you feel is the threshold of deeper seeing. Stay with it — clarity is forming.",
            shloka = Shloka(
                sanskrit = "कार्पण्यदोषोपहतस्वभावः पृच्छामि त्वां धर्मसम्मूढचेताः।\nयच्छ्रेयः स्यान्निश्चितं ब्रूहि तन्मे शिष्यस्तेऽहं शाधि मां त्वां प्रपन्नम्॥",
                transliteration = "kārpaṇya-doṣopahata-svabhāvaḥ",
                translation = "My very being is overcome by weakness; my mind confused about duty. Tell me decisively what is best — I take refuge in You.",
                reference = "Bhagavad Gita 2.7",
            ),
            reflection = "Arjuna too stood in confusion on the battlefield. He did not force an answer — he asked, and he listened.",
            affirmation = "I rest in not-knowing. The path will reveal itself step by step.",
        )

        FeelingState.Loneliness -> WitnessResponse(
            witness = "I sit with you in this quiet. You are not alone — the same breath in you is in all that lives.",
            shloka = Shloka(
                sanskrit = "ईश्वरः सर्वभूतानां हृद्देशेऽर्जुन तिष्ठति।\nभ्रामयन्सर्वभूतानि यन्त्रारूढानि मायया॥",
                transliteration = "īśvaraḥ sarva-bhūtānāṁ hṛd-deśe 'rjuna tiṣṭhati",
                translation = "The Lord dwells in the hearts of all beings, Arjuna.",
                reference = "Bhagavad Gita 18.61",
            ),
            reflection = "Aloneness is the womb of meeting the Self. In the stillness, you are never unwitnessed.",
            affirmation = "I am companioned by the Atman; I am never truly alone.",
        )

        FeelingState.Anxiety -> WitnessResponse(
            witness = "Your mind is racing ahead of your heart. Come back — to this breath, to this moment, to this body.",
            shloka = Shloka(
                sanskrit = "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्ष्यिष्यामि मा शुचः॥",
                transliteration = "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja",
                translation = "Abandon all forms of striving and take refuge in Me alone. Do not grieve.",
                reference = "Bhagavad Gita 18.66",
            ),
            reflection = "Anxiety is the future crashing into the now. Let the breath slow time.",
            affirmation = "I surrender what I cannot control. I trust the unfolding.",
        )

        FeelingState.Shame -> WitnessResponse(
            witness = "Come closer — you are not your worst moment. The Atman cannot be stained, only hidden for a while.",
            shloka = Shloka(
                sanskrit = "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः।\nन चैनं क्लेदयन्त्यापो न शोषयति मारुतः॥",
                transliteration = "nainaṁ chindanti śastrāṇi",
                translation = "Weapons cannot cleave it, fire cannot burn it, water cannot wet it, wind cannot wither it.",
                reference = "Bhagavad Gita 2.23",
            ),
            reflection = "What is essential in you is untouched by any act. Shame points to values — let it teach, not imprison.",
            affirmation = "I am worthy of my own compassion. I begin again.",
        )

        FeelingState.Exhaustion -> WitnessResponse(
            witness = "Rest is sacred. A temple keeps silent hours — so must a seeker.",
            shloka = Shloka(
                sanskrit = "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
                transliteration = "uddhared ātmanātmānam",
                translation = "Lift yourself by your own Self; do not degrade yourself. The Self alone is the friend of the self.",
                reference = "Bhagavad Gita 6.5",
            ),
            reflection = "Before you do more, become less busy inside. Stillness is the first medicine.",
            affirmation = "I honor my rest as prayer.",
        )

        FeelingState.Overwhelm -> WitnessResponse(
            witness = "Too much is here at once. Let us take one breath. Then the next. That is enough.",
            shloka = Shloka(
                sanskrit = "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
                transliteration = "yoga-sthaḥ kuru karmāṇi",
                translation = "Perform your duty anchored in yoga, abandoning attachment. Equanimity is called yoga.",
                reference = "Bhagavad Gita 2.48",
            ),
            reflection = "You are not asked to lift the mountain — only to take the next step.",
            affirmation = "I meet this moment with equanimity.",
        )

        FeelingState.Guilt -> WitnessResponse(
            witness = "Your conscience is alive — that is holy. Guilt is the door to repair, not to ruin.",
            shloka = Shloka(
                sanskrit = "अपि चेदसि पापेभ्यः सर्वेभ्यः पापकृत्तमः।\nसर्वं ज्ञानप्लवेनैव वृजिनं सन्तरिष्यसि॥",
                transliteration = "api ced asi pāpebhyaḥ sarvebhyaḥ",
                translation = "Even if you are the worst of sinners, the boat of wisdom will carry you across all evil.",
                reference = "Bhagavad Gita 4.36",
            ),
            reflection = "Make amends where you can; release what you cannot. The Self does not keep a ledger.",
            affirmation = "I forgive myself as I would forgive a beloved.",
        )

        FeelingState.Sadness -> WitnessResponse(
            witness = "Let the tears come if they must. Sadness is love remembering itself.",
            shloka = Shloka(
                sanskrit = "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥",
                transliteration = "na jāyate mriyate vā kadācin",
                translation = "The Self is never born, nor does it ever die. Unborn, eternal, ancient — it is not slain when the body is slain.",
                reference = "Bhagavad Gita 2.20",
            ),
            reflection = "Nothing real is ever lost. What you loved is woven into who you are.",
            affirmation = "I grieve. I am grieved. I am held.",
        )

        FeelingState.Doubt -> WitnessResponse(
            witness = "Doubt is a teacher in disguise. Let it refine you, not paralyze you.",
            shloka = Shloka(
                sanskrit = "अज्ञश्चाश्रद्दधानश्च संशयात्मा विनश्यति।\nनायं लोकोऽस्ति न परो न सुखं संशयात्मनः॥",
                transliteration = "ajñaś cāśraddadhānaś ca",
                translation = "The ignorant, the faithless, and the doubting soul is lost. Neither this world nor the next — no joy comes to the one in doubt.",
                reference = "Bhagavad Gita 4.40",
            ),
            reflection = "Faith is not certainty; it is the willingness to take one more step toward the light.",
            affirmation = "I take one faithful step into the unknown.",
        )
    }
}
