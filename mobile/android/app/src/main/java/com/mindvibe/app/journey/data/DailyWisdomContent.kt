package com.mindvibe.app.journey.data

import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Daily Wisdom — verse-of-the-day rotation.
 *
 * Direct port of utils/voice/dailyWisdom.ts on the web. The list is the
 * authoritative source of truth, and the index is deterministic per
 * calendar day (UTC-naive, matching web). Same verse for everyone on the
 * same day so a household using both web + Android sees the same teaching.
 *
 * No backend endpoint is needed for this — the web uses the same local
 * rotation. A future task can swap to a server-curated feed without
 * changing the consumers (the screen already takes a [DailyVerse]).
 */
data class DailyVerse(
    val chapter: Int,
    val verse: Int,
    val sanskrit: String,
    val translation: String,
    val kiaanReflection: String,
    val contemplation: String,
) {
    val citation: String get() = "BG $chapter.$verse"
}

object DailyWisdomContent {

    private val verses: List<DailyVerse> = listOf(
        DailyVerse(2, 47,
            "Karmanye vadhikaraste ma phaleshu kadachana",
            "You have the right to work, but never to the fruit of work.",
            "This is the verse that changes everything, friend. Stop gripping the outcome and pour yourself into the action. Freedom lives here.",
            "What outcome are you gripping today that you could release?"),
        DailyVerse(2, 14,
            "Matra-sparshas tu kaunteya shitoshna-sukha-duhkha-dah",
            "The contact of senses with their objects produces fleeting sensations of pleasure and pain. Endure them patiently.",
            "Every feeling passes. The pain you feel right now? Temporary. The joy? Also temporary. But YOU — the one watching it all — eternal.",
            "What fleeting sensation has been dominating your mind lately?"),
        DailyVerse(2, 48,
            "Yogasthah kuru karmani sangam tyaktva dhananjaya",
            "Perform your duty steadily in yoga, abandoning attachment, and being even-minded in success and failure.",
            "Equanimity is the superpower nobody talks about. When you can stay centered whether you win or lose, you become unstoppable.",
            "How would today change if you released attachment to results?"),
        DailyVerse(3, 35,
            "Shreyan sva-dharmo vigunah para-dharmat sv-anushthitat",
            "Better is one's own dharma, though imperfect, than the dharma of another well performed.",
            "Stop comparing yourself to others. Your unique path is perfect for YOU. Even if it looks messy, it's YOUR mess, and it leads somewhere beautiful.",
            "Whose life have you been comparing yourself to? What would YOUR path look like?"),
        DailyVerse(4, 7,
            "Yada yada hi dharmasya glanir bhavati bharata",
            "Whenever there is a decline of righteousness and rise of unrighteousness, I manifest Myself.",
            "When everything seems to be falling apart, the divine is about to show up. Trust the chaos. Something beautiful is being born.",
            "Where in your life might chaos be preparing the ground for something new?"),
        DailyVerse(4, 38,
            "Na hi jnanena sadrisham pavitram iha vidyate",
            "Indeed, there is nothing as purifying as knowledge in this world.",
            "Knowledge isn't just information — it's transformation. Every insight you gain purifies your understanding and brings you closer to truth.",
            "What truth have you been avoiding that could set you free?"),
        DailyVerse(5, 22,
            "Ye hi samsparsha-ja bhoga duhkha-yonaya eva te",
            "Pleasures born of sense contact are sources of suffering, for they have a beginning and an end.",
            "That thing you think will make you happy? It's temporary. Real joy comes from within. Don't build your entire happiness on things that disappear.",
            "What temporary pleasure have you been treating as permanent happiness?"),
        DailyVerse(6, 5,
            "Uddhared atmanatmanam natmanam avasadayet",
            "Elevate yourself through the power of your own mind, and do not degrade yourself.",
            "You are your own best friend AND your own worst enemy. The same mind that tears you down has the power to lift you up. Choose wisely.",
            "What negative self-talk will you replace with encouragement today?"),
        DailyVerse(6, 6,
            "Bandhur atmatmanas tasya yenatmaivatmana jitah",
            "For one who has conquered the mind, the mind is the best of friends. For one who has not, the mind remains the greatest enemy.",
            "Your mind is not the enemy. It just needs to be trained, like a puppy. With patience and practice, it becomes your most powerful ally.",
            "When does your mind feel like a friend, and when like an enemy?"),
        DailyVerse(6, 35,
            "Asanshayam maha-baho mano durnigraham chalam",
            "The mind is certainly restless and difficult to control, but it can be restrained through practice and detachment.",
            "Even Krishna acknowledged that the mind is hard to control. So stop beating yourself up when you can't focus. Just practice — gently, again and again.",
            "What small practice can you do today to train your mind?"),
        DailyVerse(9, 22,
            "Ananyas chintayanto mam ye janah paryupasate",
            "To those who worship Me with love, I carry what they lack and preserve what they have.",
            "When you walk with devotion, the divine walks with you. You are never alone. Never.",
            "What do you need carried today? Give it to the divine."),
        DailyVerse(9, 29,
            "Samo ham sarva-bhuteshu na me dveshyo sti na priyah",
            "I am equally present in all beings. No one is dear or hateful to Me.",
            "The divine doesn't play favorites. Everyone — every single being — has equal access to grace. Including you. Especially you, right now.",
            "Who have you been judging that deserves your compassion instead?"),
        DailyVerse(11, 33,
            "Tasmat tvam uttishtha yasho labhasva",
            "Therefore, arise and attain glory.",
            "This is your wake-up call. Whatever you've been putting off, whatever dream you've been sitting on — get up. The universe is waiting for you.",
            "What have you been putting off that your soul is calling you to do?"),
        DailyVerse(12, 13,
            "Adveshta sarva-bhutanam maitrah karuna eva cha",
            "One who bears no hatred toward any being, who is friendly and compassionate — such a devotee is very dear to Me.",
            "Compassion is the highest yoga. When you can look at someone who hurt you and wish them well — that's when you know you're growing.",
            "Can you send a silent blessing to someone who has caused you pain?"),
        DailyVerse(18, 66,
            "Sarva-dharman parityajya mam ekam sharanam vraja",
            "Abandon all varieties of dharma and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
            "The final verse, the ultimate teaching: let go. Surrender doesn't mean giving up. It means trusting that something greater than your plans is at work. Trust it.",
            "What would total surrender look like in your life right now?"),
        DailyVerse(2, 22,
            "Vasamsi jirnani yatha vihaya",
            "As a person puts on new garments, giving up old ones, the soul accepts new bodies, giving up old ones.",
            "Change is not death — it's renewal. Every ending is just you putting on a new garment. What feels like loss is actually transformation.",
            "What old garment are you ready to shed?"),
        DailyVerse(2, 62,
            "Dhyayato vishayan pumsah sangas teshupajayate",
            "While contemplating sense objects, attachment develops, and from attachment desire arises.",
            "Be careful what you feed your mind. Whatever you think about constantly becomes your reality. Choose your thoughts like you choose your food.",
            "What thoughts have you been feeding that don't serve you?"),
        DailyVerse(3, 21,
            "Yad yad acharati shreshthah tat tad evetaro janah",
            "Whatever action a great person performs, common people follow.",
            "You're leading by example whether you realize it or not. Someone is watching how you handle this challenge. Make it count.",
            "Who might be inspired by how you handle today's challenges?"),
        DailyVerse(4, 18,
            "Karmany akarma yah pashyed akarmani cha karma yah",
            "One who sees inaction in action and action in inaction is truly wise.",
            "Sometimes the bravest action is to do nothing. And sometimes what looks like nothing is actually the deepest work. Wisdom knows the difference.",
            "Is there a situation where doing nothing might be the wisest action?"),
        DailyVerse(6, 17,
            "Yuktahara-viharasya yukta-cheshtasya karmasu",
            "One who is balanced in eating, sleeping, recreation, and work can mitigate all sorrows through yoga.",
            "Balance, friend. Not extreme discipline, not total indulgence. The middle path. Are you eating well? Sleeping enough? That IS spiritual practice.",
            "Which area of your life needs more balance today?"),
        DailyVerse(7, 19,
            "Bahunam janmanam ante jnanavan mam prapadyate",
            "After many births, the wise soul surrenders unto Me, knowing that everything is divine.",
            "Your journey of seeking is beautiful. Every question, every doubt, every search has been leading you here. You're exactly where you need to be.",
            "What has your spiritual journey taught you so far?"),
        DailyVerse(10, 20,
            "Aham atma gudakesha sarva-bhutashaya-sthitah",
            "I am the Self seated in the hearts of all creatures. I am the beginning, the middle, and the end of all beings.",
            "The divine isn't far away in some heaven. It's IN you. Right now. In this breath. In this heartbeat. You carry the infinite within you.",
            "Can you feel the divine presence within you right now?"),
        DailyVerse(13, 28,
            "Samam pashyan hi sarvatra samavasthitam ishvaram",
            "One who sees the divine equally present everywhere does not degrade the self.",
            "When you see God in everyone — the kind and the cruel, the beautiful and the broken — you stop hurting yourself and others. That's real vision.",
            "Can you practice seeing the divine in every person you meet today?"),
        DailyVerse(15, 15,
            "Sarvasya chaham hridi sannivishto",
            "I am seated in the hearts of all. From Me come memory, knowledge, and their removal.",
            "Every time you forget something, every time you remember — that's the divine at play. Even forgetting has purpose. Trust the process.",
            "What wisdom has recently surfaced from deep within you?"),
        DailyVerse(18, 48,
            "Saha-jam karma kaunteya sa-dosham api na tyajet",
            "One should not abandon one's natural work, even if it has some defects.",
            "Your work doesn't have to be perfect. Done imperfectly with love beats undone perfectly any day. Start where you are. With what you have.",
            "What imperfect action can you take today rather than waiting for perfection?"),
    )

    /** Deterministic verse for [date] (default today). Same verse for everyone. */
    fun forDate(date: LocalDate = LocalDate.now()): DailyVerse {
        val startOfYear = LocalDate.of(date.year, 1, 1)
        val dayOfYear = ChronoUnit.DAYS.between(startOfYear, date).toInt()
        val idx = ((dayOfYear % verses.size) + verses.size) % verses.size
        return verses[idx]
    }

    /** Last 7 days of teachings, ending today. Used for the week-archive row. */
    fun lastSevenDays(today: LocalDate = LocalDate.now()): List<Pair<LocalDate, DailyVerse>> =
        (6 downTo 0).map { offset ->
            val d = today.minusDays(offset.toLong())
            d to forDate(d)
        }
}
