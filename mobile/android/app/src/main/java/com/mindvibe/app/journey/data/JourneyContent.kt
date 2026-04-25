package com.mindvibe.app.journey.data

import com.mindvibe.app.journey.model.Difficulty
import com.mindvibe.app.journey.model.DayStep
import com.mindvibe.app.journey.model.GitaVerse
import com.mindvibe.app.journey.model.HomeStats
import com.mindvibe.app.journey.model.Journey
import com.mindvibe.app.journey.model.MicroPractice
import com.mindvibe.app.journey.model.SakhaReflection
import com.mindvibe.app.journey.model.Vice
import com.mindvibe.app.journey.model.WeeklyStatus
import com.mindvibe.app.journey.model.WeeklyTeaching
import com.mindvibe.app.journey.model.WisdomTeaching
import com.mindvibe.app.journey.model.WorldScenario

/**
 * Hard-coded content mirroring the reference screenshots so the Android
 * app can run fully offline and be reviewed / shipped as an AAB without
 * needing the backend online. Swap this out for a repository that pulls
 * from the real kiaanverse API when wiring the production build.
 */
object JourneyContent {

    // ----- Verses -----------------------------------------------------------

    private val BG_16_4 = GitaVerse(
        citation = "BG 16.4",
        devanagari = "दम्भो दर्पोऽभिमानश्च क्रोधः…",
        transliteration = "dambho darpo'bhimānaś ca krodhaḥ pāruṣyam…",
        fullDevanagari = "दम्भो दर्पोऽभिमानश्च क्रोधः पारुष्यमेव च\nअज्ञानं चाभिजातस्य पार्थ सम्पदमासुरीम्",
        fullTransliteration = "dambho darpo 'bhimānaś ca krodhaḥ pāruṣyam eva ca\najñānaṁ cābhijātasya pārtha sampadam āsurīm",
        translation = "Hypocrisy, arrogance, self-conceit, anger, harshness and ignorance — these, O Pārtha, are the marks of one born with the demoniac qualities.",
    )
    private val BG_2_63 = GitaVerse(
        citation = "BG 2.63",
        devanagari = "क्रोधाद्भवति संमोहः…",
        transliteration = "krodhād bhavati sammohaḥ",
        fullDevanagari = "क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति",
        fullTransliteration = "krodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ\nsmṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati",
        translation = "From anger comes delusion; from delusion, confused memory; from confused memory, the ruin of reason; from the ruin of reason, one is utterly lost.",
    )
    private val BG_14_17 = GitaVerse(
        citation = "BG 14.17",
        devanagari = "लोभः प्रवृत्तिरारम्भः कर्मणाम…",
        transliteration = "lobhaḥ pravṛttir ārambhaḥ karmaṇām…",
        fullDevanagari = "लोभः प्रवृत्तिरारम्भः कर्मणामशमः स्पृहा\nरजस्येतानि जायन्ते विवृद्धे भरतर्षभ",
        fullTransliteration = "lobhaḥ pravṛttir ārambhaḥ karmaṇām aśamaḥ spṛhā\nrajasy etāni jāyante vivṛddhe bharatarṣabha",
        translation = "Greed, ceaseless activity, the undertaking of works, restlessness and craving — these arise when the mode of passion grows, O best of the Bharatas.",
    )
    private val BG_3_37 = GitaVerse(
        citation = "BG 3.37",
        devanagari = "काम एष क्रोध एष…",
        transliteration = "kāma eṣa krodha eṣa rajo-guṇa…",
        fullDevanagari = "काम एष क्रोध एष रजोगुणसमुद्भवः\nमहाशनो महापाप्मा विद्ध्येनमिह वैरिणम्",
        fullTransliteration = "kāma eṣa krodha eṣa rajo-guṇa-samudbhavaḥ\nmahāśano mahā-pāpmā viddhy enam iha vairiṇam",
        translation = "It is desire, it is wrath, born of the mode of passion, all-devouring and most sinful — know this to be the enemy here in this world.",
    )
    private val BG_12_13 = GitaVerse(
        citation = "BG 12.13",
        devanagari = "अद्वेष्टा सर्वभूतानां मैत्रः करुण ए…",
        transliteration = "adveṣṭā sarva-bhūtānāṁ maitraḥ…",
        fullDevanagari = "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च\nनिर्ममो निरहंकारः समदुःखसुखः क्षमी",
        fullTransliteration = "adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī",
        translation = "He who hates no being, who is friendly and compassionate to all, free from possessiveness and ego, even-minded in pain and pleasure — he is dear to Me.",
    )
    private val BG_18_66 = GitaVerse(
        citation = "BG 18.66",
        devanagari = "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
        transliteration = "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja",
        fullDevanagari = "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः",
        fullTransliteration = "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja\nahaṁ tvā sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ",
        translation = "Abandon all varieties of dharma and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
    )

    // ----- SAKHA reflections ------------------------------------------------

    private fun sakhaFor(vice: Vice, day: Int): SakhaReflection = SakhaReflection(
        body = when (vice) {
            Vice.Kama -> "Even silent practice is heard. You have taken Day $day on the path against Kama. The Gita reminds: \"It is desire, it is wrath, born of the mode of passion, all-devouring and most sinful — know this to be the enemy here in this world.\" Carry this stillness into your day. Return tomorrow for the next teaching."
            Vice.Krodha -> "Even silent practice is heard. You have taken Day $day on the path against Krodha. The Gita reminds: \"From anger comes delusion; from delusion, confused memory; from confused memory, the ruin of reason.\" Carry this stillness into your day. Return tomorrow for the next teaching."
            Vice.Lobha -> "Even silent practice is heard. You have taken Day $day on the path against Lobha. The Gita reminds: \"Greed, ceaseless activity, the undertaking of works, restlessness and craving — these arise when the mode of passion grows, O best of the Bharatas.\" Carry this stillness into your day. Return tomorrow for the next teaching."
            Vice.Moha -> "Even silent practice is heard. You have taken Day $day on the path against Moha. The Gita reminds: \"Delusion arises from passion; through delusion the world is bewildered.\" Carry this stillness into your day. Return tomorrow for the next teaching."
            Vice.Mada -> "Even silent practice is heard. You have taken Day $day on the path against Mada. The Gita reminds: \"Hypocrisy, arrogance, self-conceit, anger, harshness and ignorance — these, O Pārtha, are the marks of one born with the demoniac qualities.\" Carry this stillness into your day. Return tomorrow for the next teaching."
            Vice.Matsarya -> "Even silent practice is heard. You have taken Day $day on the path against Matsarya. The Gita reminds: \"He who hates no being, who is friendly and compassionate to all — he is dear to Me.\" Carry this stillness into your day. Return tomorrow for the next teaching."
        },
    )

    // ----- DayStep builders -------------------------------------------------

    private fun buildDays(
        vice: Vice,
        entries: List<Triple<String, String, String>>, // title, teachingBody, practice
        worldScenarios: List<WorldScenario>,
        reflectionPrompts: List<String>,
        totalDays: Int,
    ): List<DayStep> {
        return (1..totalDays).map { day ->
            val (title, teachingBody, practice) = entries[(day - 1) % entries.size]
            val scenario = worldScenarios[(day - 1) % worldScenarios.size]
            val prompt = reflectionPrompts[(day - 1) % reflectionPrompts.size]
            DayStep(
                dayIndex = day,
                title = title,
                teaching = teachingBody.take(90),
                teachingBody = teachingBody,
                worldScenario = scenario,
                reflectionPrompt = prompt,
                practice = practice,
                practiceMinutes = 10,
                sakhaOnComplete = sakhaFor(vice, day),
            )
        }
    }

    // ----- Journey: The Humble Warrior (Mada / Pride, 14d) ------------------

    private val humbleWarriorDays: List<DayStep> = buildDays(
        vice = Vice.Mada,
        entries = listOf(
            Triple(
                "The Opening of the Crown",
                "Today we soften the crown — the place where pride lives above us.",
                "Notice one moment today where you needed to be \"above\" another. Let the crown bow.",
            ),
            Triple(
                "The Shield of Pride",
                "Today we observe how ego defends its sense of superiority or specialness.",
                "Today, ask for help with something. Notice the discomfort and stay with it.",
            ),
            Triple(
                "The Roots of Arrogance",
                "Where does the \"I know\" voice arise in our daily interactions?",
                "In one conversation today, speak only to understand, not to win.",
            ),
            Triple(
                "The Mirror of Humility",
                "Pride cannot survive honest self-seeing. Today we look gently.",
                "Write three things you got wrong this week. Share one.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Always needing to be right in discussions with partner",
                description = "Every conversation becomes a competition. Being right becomes more important than being connected.",
                reframe = "In your next disagreement, genuinely try to understand before being understood. Say: 'Help me see this from your view.'",
            ),
            WorldScenario(
                scenario = "Refusing to ask for directions or help at work",
                description = "Pride says you should already know. Silence becomes isolation; isolation becomes stuckness.",
                reframe = "Ask one person for help today with something you've been wrestling with alone.",
            ),
        ),
        reflectionPrompts = listOf(
            "Where did ego show up today? What would happen if you let go of being right?",
            "Who did you quietly compare yourself to today — and what did that cost you?",
            "What would asking for help have unlocked today?",
        ),
        totalDays = 14,
    )

    // ----- Journey: The Open Hand (Lobha / Greed, 14d) ----------------------

    private val openHandDays: List<DayStep> = buildDays(
        vice = Vice.Lobha,
        entries = listOf(
            Triple(
                "The First Loosening",
                "Today we meet the hand that grips — and let a single finger release.",
                "Give one small thing away today without keeping score.",
            ),
            Triple(
                "The Hunger for More",
                "Today we observe the mind's tendency to accumulate and hold.",
                "Notice each moment you reach for more of something you already have enough of.",
            ),
            Triple(
                "Why Enough is Never Enough",
                "Explore what insecurity or fear drives the need for more.",
                "List 10 things you're grateful for. Give something away today without keeping score.",
            ),
            Triple(
                "The Generosity Experiment",
                "Generosity is the antidote — not to poverty, but to the fear of poverty.",
                "Give time, attention, or resources to someone today with no expectation of return.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Accumulating possessions that clutter your living space",
                description = "The 'just in case' mentality leads to hoarding, making your space cramped and your mind cluttered.",
                reframe = "Practice the one-in-one-out rule. Before buying, ask: 'Do I need this, or do I want the feeling of acquiring it?'",
            ),
            WorldScenario(
                scenario = "Endless scrolling, endless wanting",
                description = "Every swipe plants a new seed of lack — a new thing to buy, become, or compare to.",
                reframe = "Put the phone down. Look at what you already have for five full minutes.",
            ),
        ),
        reflectionPrompts = listOf(
            "What felt like 'not enough' today? What would truly satisfy you?",
            "What did you grip today that was never really yours?",
            "Where could generosity heal what accumulation cannot?",
        ),
        totalDays = 14,
    )

    // ----- Journey: Complete Inner Transformation (Kama / Desire, 30d) ------

    private val innerTransformationDays: List<DayStep> = buildDays(
        vice = Vice.Kama,
        entries = listOf(
            Triple(
                "Meeting the Seeker",
                "Desire points to what is unmet. Today we listen instead of chase.",
                "Sit quietly. When a craving arises, ask: 'What am I really longing for?'",
            ),
            Triple(
                "The First Restraint",
                "The space between stimulus and response is where freedom lives.",
                "Delay one desire by 10 minutes today. Watch what it does.",
            ),
            Triple(
                "Recognizing Desire's Pull",
                "Today we recognize how desire arises in the mind without judgment.",
                "Name three desires that ran you today — kindly, without shame.",
            ),
            Triple(
                "The Deeper Hunger",
                "Beneath every craving is a longing for peace. Touch it directly.",
                "Before reaching for the next craving, take ten breaths.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Endless scrolling, compulsive shopping, relationship obsession",
                description = "Desire disguises itself as urgency. The screen keeps promising what the heart already has.",
                reframe = "When the pull arises, name it: 'This is Kama.' Then place a hand on your chest and breathe.",
            ),
        ),
        reflectionPrompts = listOf(
            "What pulled at you today? Did you chase it — or watch it?",
            "If the craving vanished, what would remain?",
            "Where did desire borrow your peace today?",
        ),
        totalDays = 30,
    )

    // ----- Journey: Cooling the Fire (Krodha / Anger, 14d) ------------------

    private val coolingFireDays = buildDays(
        vice = Vice.Krodha,
        entries = listOf(
            Triple(
                "The Slow Exhale",
                "Anger is a fast teacher. Today we meet it slowly.",
                "Each time irritation rises, take one long, full exhale before speaking.",
            ),
            Triple(
                "The Pause",
                "The ten-second pause is a prayer. It remembers who you are.",
                "Count ten before responding to anything that sparks heat today.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Road rage, social media outrage, reactive arguments, the ten-second regret",
                description = "Anger feels righteous in the moment, corrosive in the hour, and small by nightfall.",
                reframe = "Before replying, ask: 'Will this matter tomorrow? Would I send this to someone I love?'",
            ),
        ),
        reflectionPrompts = listOf(
            "What lit the fuse today? What was underneath the anger?",
            "Did the heat protect you — or burn you?",
        ),
        totalDays = 14,
    )

    // ----- Journey: Taming Desire (Kama / Desire, 21d) ----------------------

    private val tamingDesireDays = buildDays(
        vice = Vice.Kama,
        entries = listOf(
            Triple(
                "The Watcher Within",
                "To tame desire, first see it clearly. Not to fight — to witness.",
                "Keep a quiet tally today of each time a craving arises. No judgment.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Notifications, sales, screens — the constant tug",
                description = "Modern desire isn't a roar, it's a thousand whispers. Each one small; together, deafening.",
                reframe = "Silence one tug today. Notice the peace that rushes in.",
            ),
        ),
        reflectionPrompts = listOf(
            "If the pull has no object, what remains?",
        ),
        totalDays = 21,
    )

    // ----- Journey: The Patient Heart (Krodha / Anger, 7d) ------------------

    private val patientHeartDays = buildDays(
        vice = Vice.Krodha,
        entries = listOf(
            Triple(
                "The First Calm",
                "Quick relief begins with a single unhurried breath.",
                "Three times today, stop for 30 seconds and breathe.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Road rage, social media outrage, reactive arguments, the ten-second regret",
                description = "A quick but powerful 7-day journey for those seeking immediate relief.",
                reframe = "The next spark — meet it with a breath instead of a word.",
            ),
        ),
        reflectionPrompts = listOf(
            "What would patience have saved today?",
        ),
        totalDays = 7,
    )

    // ----- Journey: Beyond Craving (Kama / Desire, 21d) ---------------------

    private val beyondCravingDays = buildDays(
        vice = Vice.Kama,
        entries = listOf(
            Triple(
                "The Root of Craving",
                "Beyond the object of desire lives a deeper hunger — for presence itself.",
                "Sit with one craving for five minutes without acting on it. Just breathe.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Endless scrolling, compulsive shopping, relationship obsession",
                description = "A deeper 21-day exploration into the nature of desire.",
                reframe = "Turn toward the hunger beneath. Let it teach you what it really wants.",
            ),
        ),
        reflectionPrompts = listOf(
            "What is the longing underneath the longing?",
        ),
        totalDays = 21,
    )

    // ----- Journey: Compassion Over Comparison (Matsarya / Envy, 7d) --------

    private val compassionOverComparisonDays = buildDays(
        vice = Vice.Matsarya,
        entries = listOf(
            Triple(
                "Another's Joy, My Joy",
                "When another rises, a narrow heart contracts. Today we practice widening.",
                "When you feel the sting of another's success, silently wish them more.",
            ),
        ),
        worldScenarios = listOf(
            WorldScenario(
                scenario = "Social media comparison, jealousy of colleagues, resentment when others are celebrated",
                description = "A focused 7-day journey for quick relief from the pain of envy.",
                reframe = "Before the next scroll, bless three people for what they have.",
            ),
        ),
        reflectionPrompts = listOf(
            "Whose joy felt like your loss today?",
        ),
        totalDays = 7,
    )

    // ----- Journey catalog --------------------------------------------------

    val journeys: List<Journey> = listOf(
        Journey(
            id = "complete-inner-transformation",
            vice = Vice.Kama,
            title = "Complete Inner Transformation",
            subtitle = "A 30-day transformation from self-centered living to service-oriented living.",
            durationDays = 30,
            difficulty = Difficulty.Challenging,
            todayThisLooksLike = "Endless scrolling, compulsive shopping, relationship obsession, the constant pull toward what isn't yours.",
            anchorVerse = BG_3_37,
            conqueredBy = "Nishkama Karma — selfless action",
            currentDay = 3,
            steps = innerTransformationDays,
        ),
        Journey(
            id = "humble-warrior",
            vice = Vice.Mada,
            title = "The Humble Warrior",
            subtitle = "A 14-day practice of dissolving ego through sacred humility.",
            durationDays = 14,
            difficulty = Difficulty.Easy,
            todayThisLooksLike = "Arrogance, inability to accept feedback, needing to be right, the silent war for status.",
            anchorVerse = BG_16_4,
            conqueredBy = "Namrata — genuine humility",
            currentDay = 2,
            steps = humbleWarriorDays,
        ),
        Journey(
            id = "open-hand",
            vice = Vice.Lobha,
            title = "The Open Hand",
            subtitle = "A 14-day practice of releasing the grip and trusting enough.",
            durationDays = 14,
            difficulty = Difficulty.Easy,
            todayThisLooksLike = "Hoarding, compulsive buying, keeping score in relationships, scarcity thinking.",
            anchorVerse = BG_14_17,
            conqueredBy = "Dana — generous giving",
            currentDay = 3,
            steps = openHandDays,
        ),
        Journey(
            id = "cooling-the-fire",
            vice = Vice.Krodha,
            title = "Cooling the Fire",
            subtitle = "A 14-day practice to transform anger into clarity through Gita wisdom.",
            durationDays = 14,
            difficulty = Difficulty.Easy,
            todayThisLooksLike = "Road rage, social media outrage, reactive arguments, the ten-second regret.",
            anchorVerse = BG_2_63,
            conqueredBy = "Viveka — the pause of discernment",
            currentDay = 0,
            steps = coolingFireDays,
        ),
        Journey(
            id = "taming-desire",
            vice = Vice.Kama,
            title = "Taming Desire",
            subtitle = "A 21-day transformation of the pull that never stops.",
            durationDays = 21,
            difficulty = Difficulty.Moderate,
            todayThisLooksLike = "Endless scrolling, compulsive shopping, relationship obsession.",
            anchorVerse = BG_3_37,
            conqueredBy = "Nishkama Karma — selfless action",
            currentDay = 0,
            steps = tamingDesireDays,
        ),
        Journey(
            id = "patient-heart",
            vice = Vice.Krodha,
            title = "The Patient Heart - 7 Days to Calm",
            subtitle = "A quick but powerful 7-day journey for those seeking immediate relief.",
            durationDays = 7,
            difficulty = Difficulty.Easy,
            todayThisLooksLike = "Road rage, social media outrage, reactive arguments, the ten-second regret.",
            anchorVerse = BG_2_63,
            conqueredBy = "Viveka — the pause of discernment",
            currentDay = 0,
            steps = patientHeartDays,
        ),
        Journey(
            id = "beyond-craving",
            vice = Vice.Kama,
            title = "Beyond Craving - The Path to Inner Peace",
            subtitle = "A deeper 21-day exploration into the nature of desire. Discover how to meet longing without being owned by it.",
            durationDays = 21,
            difficulty = Difficulty.Challenging,
            todayThisLooksLike = "Endless scrolling, compulsive shopping, relationship obsession.",
            anchorVerse = BG_3_37,
            conqueredBy = "Nishkama Karma — selfless action",
            currentDay = 0,
            steps = beyondCravingDays,
        ),
        Journey(
            id = "compassion-over-comparison",
            vice = Vice.Matsarya,
            title = "Compassion Over Comparison",
            subtitle = "A focused 7-day journey for quick relief from the pain of envy. Build the muscle of mudita.",
            durationDays = 7,
            difficulty = Difficulty.Easy,
            todayThisLooksLike = "Social media comparison, jealousy of colleagues, resentment when others are celebrated.",
            anchorVerse = BG_12_13,
            conqueredBy = "Mudita — sympathetic joy",
            currentDay = 0,
            steps = compassionOverComparisonDays,
        ),
    )

    fun journey(id: String): Journey = journeys.first { it.id == id }

    // ----- Today tab --------------------------------------------------------

    val homeStats = HomeStats(
        active = 4,
        activeMax = 5,
        completed = 0,
        streak = 0,
        totalDays = 6,
    )

    /** Today's practice list — one active step per active journey. */
    val todaysPractice: List<TodayPracticeItem>
        get() = journeys.filter { it.isActive }.take(4).map { j ->
            val day = j.steps.getOrNull(j.currentDay - 1) ?: j.steps.first()
            TodayPracticeItem(
                journeyId = j.id,
                vice = j.vice,
                dayIndex = j.currentDay,
                title = "Day ${j.currentDay}: ${day.title}",
                teaching = day.teaching,
            )
        }

    val microPractice = MicroPractice(
        label = "Releasing what is held",
        principle = "Vairagya (Non-attachment)",
        body = "Choose one expectation you are holding today and consciously set it down.",
        accent = androidx.compose.ui.graphics.Color(0xFFE7811F),
    )

    /** Seven-tile day-streak row: completed (amber), today (outlined), upcoming. */
    data class StreakTile(val label: String, val completed: Boolean, val isToday: Boolean)

    val weekStreak: List<StreakTile> = listOf(
        StreakTile("M", completed = false, isToday = false),
        StreakTile("T", completed = true, isToday = false),
        StreakTile("W", completed = true, isToday = false),
        StreakTile("T", completed = true, isToday = false),
        StreakTile("F", completed = true, isToday = false),
        StreakTile("S", completed = true, isToday = false),
        StreakTile("S", completed = false, isToday = true),
    )

    val recommended: List<Journey>
        get() = journeys.filter { !it.isActive }.take(4)

    // ----- Wisdom tab -------------------------------------------------------

    val wisdomTeaching = WisdomTeaching(
        verse = BG_18_66,
        translation = "Abandon all varieties of dharma and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
        reflection = "The final verse, the ultimate teaching: let go. Surrender doesn't mean giving up. It means trusting that something greater than your plans is at work. Trust it.",
        sitWithQuestion = "What would total surrender look like in your life right now?",
    )

    val weeklyTeachings: List<WeeklyTeaching> = listOf(
        WeeklyTeaching("Sat", 18, WeeklyStatus.Past),
        WeeklyTeaching("Sun", 19, WeeklyStatus.Past),
        WeeklyTeaching("Mon", 20, WeeklyStatus.Past),
        WeeklyTeaching("Tue", 21, WeeklyStatus.Past),
        WeeklyTeaching("Wed", 22, WeeklyStatus.Past),
        WeeklyTeaching("Thu", 23, WeeklyStatus.Past),
        WeeklyTeaching("Fri", 24, WeeklyStatus.Today),
    )

    // Footer mantra shown on multiple screens
    const val FOOTER_SHLOKA_DEVANAGARI = "अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते"
    const val FOOTER_SHLOKA_TRANSLATION =
        "\"Through practice and detachment, the restless mind can be mastered.\" — BG 6.35"
}

/** Convenience row model for the Today-tab practice list. */
data class TodayPracticeItem(
    val journeyId: String,
    val vice: Vice,
    val dayIndex: Int,
    val title: String,
    val teaching: String,
)
