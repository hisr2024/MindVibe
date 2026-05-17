"""
Modern Examples Database - Real-Life Scenarios for Six Enemies.

This module provides a curated database of modern examples that connect
the Six Enemies (Shadripu) to everyday situations, along with relevant
Gita verses and practical wisdom.

Usage:
    from backend.services.journey_engine import ModernExamplesDB

    db = ModernExamplesDB()

    # Get examples for anger
    examples = db.get_examples("krodha", category="workplace")

    # Get random example
    example = db.get_random_example("lobha")
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from enum import Enum
from typing import Any


# =============================================================================
# TYPES
# =============================================================================


class ExampleCategory(str, Enum):
    """Categories of modern examples."""
    WORKPLACE = "workplace"
    RELATIONSHIPS = "relationships"
    FAMILY = "family"
    SOCIAL_MEDIA = "social_media"
    FINANCE = "finance"
    HEALTH = "health"
    PERSONAL_GROWTH = "personal_growth"
    DAILY_LIFE = "daily_life"


@dataclass
class EnemyExample:
    """A modern example for an inner enemy.

    Two complementary practice fields:
      * ``practical_antidote`` — secular, immediately actionable in any
        worldview (cognitive reframing, breath, journaling, boundaries).
      * ``sanatan_practice``  — Sanatan / yogic counterpart drawn from
        the Gita's own toolkit (japa, dana, vairagya, seva, mantra,
        mudita meditation, swadhyaya, etc.). Optional for backwards
        compatibility with the original 24-row corpus.

    ``generation`` lets us surface Gen-Z-specific scenarios when the
    user's onboarding signal calls for them (default ``"general"``).
    """
    enemy: str
    category: str
    scenario: str
    how_enemy_manifests: str
    gita_verse_ref: dict[str, int]
    gita_wisdom: str
    practical_antidote: str
    reflection_question: str
    sanatan_practice: str = ""
    generation: str = "general"

    def to_dict(self) -> dict[str, Any]:
        return {
            "enemy": self.enemy,
            "category": self.category,
            "scenario": self.scenario,
            "how_enemy_manifests": self.how_enemy_manifests,
            "gita_verse_ref": self.gita_verse_ref,
            "gita_wisdom": self.gita_wisdom,
            "practical_antidote": self.practical_antidote,
            "reflection_question": self.reflection_question,
            "sanatan_practice": self.sanatan_practice,
            "generation": self.generation,
        }


# =============================================================================
# EXAMPLES DATABASE
# =============================================================================


# Pre-defined modern examples for each enemy
EXAMPLES_DATA: list[dict] = [
    # =========================================================================
    # KAMA (Desire / Lust)
    # =========================================================================
    {
        "enemy": "kama",
        "category": "social_media",
        "scenario": "Endless scrolling through social media, chasing the next dopamine hit",
        "how_enemy_manifests": "The constant desire for stimulation and validation leads to hours lost in mindless scrolling, leaving you drained and unfulfilled.",
        "gita_verse_ref": {"chapter": 3, "verse": 37},
        "gita_wisdom": "Krishna identifies desire (kama) as the all-devouring enemy of wisdom. Like fire that is never satisfied by fuel, digital desires only grow with each indulgence.",
        "practical_antidote": "Set specific times for social media. When urge arises, take 3 breaths and ask: 'Will this truly satisfy me, or feed more craving?'",
        "reflection_question": "What deeper need am I trying to fulfill through constant scrolling?",
    },
    {
        "enemy": "kama",
        "category": "workplace",
        "scenario": "Obsessing over a promotion or recognition at work",
        "how_enemy_manifests": "The intense craving for career advancement leads to anxiety, comparison with colleagues, and loss of present-moment effectiveness.",
        "gita_verse_ref": {"chapter": 2, "verse": 47},
        "gita_wisdom": "You have the right to action alone, never to its fruits. When we work with attachment to results, we become slaves to desire.",
        "practical_antidote": "Focus on excellence in your current work. Each morning, set intention: 'I will give my best today without obsessing over outcomes.'",
        "reflection_question": "If I never got the promotion, would my work still have meaning?",
    },
    {
        "enemy": "kama",
        "category": "relationships",
        "scenario": "Constantly seeking a 'perfect' romantic partner",
        "how_enemy_manifests": "Unrealistic expectations and perpetual searching prevent deep connection and appreciation of what's present.",
        "gita_verse_ref": {"chapter": 5, "verse": 22},
        "gita_wisdom": "Pleasures born of sense contact are sources of suffering. They have a beginning and end, and the wise do not find happiness in them.",
        "practical_antidote": "Practice contentment meditation. List 5 qualities you appreciate in your current relationships rather than what's missing.",
        "reflection_question": "Am I seeking a partner to complete me, or to share a complete life?",
    },
    {
        "enemy": "kama",
        "category": "finance",
        "scenario": "Impulsive online shopping to fill emotional voids",
        "how_enemy_manifests": "The temporary high of purchasing gives way to guilt and clutter, while the underlying dissatisfaction remains unaddressed.",
        "gita_verse_ref": {"chapter": 3, "verse": 43},
        "gita_wisdom": "By knowing desire as the enemy, discipline the mind through wisdom. Master the self by the Self.",
        "practical_antidote": "Implement a 48-hour rule for non-essential purchases. During waiting period, journal: 'What am I really seeking?'",
        "reflection_question": "What would my life look like if I felt truly content with what I have?",
    },
    # =========================================================================
    # KRODHA (Anger)
    # =========================================================================
    {
        "enemy": "krodha",
        "category": "workplace",
        "scenario": "Receiving critical feedback from a manager or colleague",
        "how_enemy_manifests": "Immediate defensive anger blocks the ability to receive valuable input. You shut down, argue, or silently seethe.",
        "gita_verse_ref": {"chapter": 2, "verse": 63},
        "gita_wisdom": "From anger comes delusion; from delusion, loss of memory; from loss of memory, destruction of intelligence; and from that, one perishes.",
        "practical_antidote": "Before responding, take 3 deep breaths. Thank the person for feedback. Process privately before reacting.",
        "reflection_question": "What valuable truth might this feedback contain that my anger is hiding from me?",
    },
    {
        "enemy": "krodha",
        "category": "daily_life",
        "scenario": "Road rage during daily commute",
        "how_enemy_manifests": "Another driver's mistake triggers disproportionate rage, affecting your mood for hours and potentially leading to dangerous behavior.",
        "gita_verse_ref": {"chapter": 16, "verse": 21},
        "gita_wisdom": "Desire, anger, and greed are the three gates to hell, leading to the destruction of the self. Therefore, abandon these three.",
        "practical_antidote": "Use red lights as mindfulness bells. When cut off, say: 'They may be having a difficult day. May they be safe.'",
        "reflection_question": "Is this situation worth sacrificing my peace of mind?",
    },
    {
        "enemy": "krodha",
        "category": "family",
        "scenario": "Arguments with parents or in-laws over lifestyle choices",
        "how_enemy_manifests": "Recurring conflicts trigger deep-seated frustration. Each interaction becomes a battlefield where peace is the first casualty.",
        "gita_verse_ref": {"chapter": 2, "verse": 56},
        "gita_wisdom": "One who is unaffected by sorrow and joy, free from attachment, fear, and anger—such a person is called a sage of steady wisdom.",
        "practical_antidote": "Before family gatherings, set internal boundaries. Respond with curiosity instead of defensiveness: 'Help me understand your perspective.'",
        "reflection_question": "What would it take for me to disagree with love instead of anger?",
    },
    {
        "enemy": "krodha",
        "category": "social_media",
        "scenario": "Getting triggered by online comments or political posts",
        "how_enemy_manifests": "Hours spent in heated exchanges that change no one's mind, leaving you drained and more entrenched in anger.",
        "gita_verse_ref": {"chapter": 5, "verse": 26},
        "gita_wisdom": "Those who have conquered their mind, freed from desire and anger, and engaged in self-realization, find peace everywhere.",
        "practical_antidote": "Unfollow triggering accounts. When urge to argue arises, ask: 'Will this conversation bring light or just more heat?'",
        "reflection_question": "What wound in me is being touched by this person's words?",
    },
    # =========================================================================
    # LOBHA (Greed)
    # =========================================================================
    {
        "enemy": "lobha",
        "category": "finance",
        "scenario": "Constantly checking investment portfolios and crypto prices",
        "how_enemy_manifests": "The obsession with 'more' creates anxiety during downturns and fleeting joy during gains—never lasting satisfaction.",
        "gita_verse_ref": {"chapter": 14, "verse": 17},
        "gita_wisdom": "From sattva arises knowledge; from rajas, greed; and from tamas come negligence, delusion, and ignorance.",
        "practical_antidote": "Define 'enough' for yourself. Check investments weekly, not hourly. Practice gratitude for what you have before tracking what you might gain.",
        "reflection_question": "What amount would truly be 'enough'? Have I ever felt satisfied when reaching a financial goal?",
    },
    {
        "enemy": "lobha",
        "category": "workplace",
        "scenario": "Taking on more projects than you can handle for career advancement",
        "how_enemy_manifests": "The desire for more recognition leads to overcommitment, burnout, and diminished quality in all areas.",
        "gita_verse_ref": {"chapter": 16, "verse": 12},
        "gita_wisdom": "Bound by hundreds of desires, enslaved by lust and anger, they strive to amass wealth by unjust means for sense gratification.",
        "practical_antidote": "Before accepting new commitments, ask: 'Will this serve my wellbeing or just my ego?' Practice saying no gracefully.",
        "reflection_question": "Am I collecting achievements to fill an inner emptiness?",
    },
    {
        "enemy": "lobha",
        "category": "daily_life",
        "scenario": "Accumulating possessions that clutter your living space",
        "how_enemy_manifests": "The 'just in case' mentality leads to hoarding, making your space cramped and your mind cluttered.",
        "gita_verse_ref": {"chapter": 12, "verse": 16},
        "gita_wisdom": "One who has no attachment, is pure, capable, neutral, free from anxiety, and renounces all selfish undertakings—such a devotee is dear to Me.",
        "practical_antidote": "Practice the one-in-one-out rule. Before buying, ask: 'Do I need this, or do I want the feeling of acquiring it?'",
        "reflection_question": "What am I afraid of losing that makes me hold onto so much?",
    },
    {
        "enemy": "lobha",
        "category": "relationships",
        "scenario": "Keeping score of favors in friendships",
        "how_enemy_manifests": "Transactional thinking in relationships—'I did this for them, so they should do this for me'—poisons genuine connection.",
        "gita_verse_ref": {"chapter": 17, "verse": 20},
        "gita_wisdom": "That gift which is given without expectation of return, at the proper time and place, to a worthy person—that is considered sattvic giving.",
        "practical_antidote": "Give without keeping mental accounts. This week, do something kind with zero expectation of reciprocation.",
        "reflection_question": "Can I give freely without needing anything in return?",
    },
    # =========================================================================
    # MOHA (Attachment / Delusion)
    # =========================================================================
    {
        "enemy": "moha",
        "category": "relationships",
        "scenario": "Holding onto a relationship that no longer serves either person",
        "how_enemy_manifests": "Fear of change and attachment to who the person once was prevents both from growing. Comfort is mistaken for love.",
        "gita_verse_ref": {"chapter": 2, "verse": 52},
        "gita_wisdom": "When your intellect crosses beyond the dense forest of delusion, you will become indifferent to all that has been heard and all that is to be heard.",
        "practical_antidote": "Honestly assess the relationship without fear. Ask: 'Am I staying out of love or out of fear of being alone?'",
        "reflection_question": "If I truly loved this person, would I want them to be in this relationship?",
    },
    {
        "enemy": "moha",
        "category": "workplace",
        "scenario": "Staying in a job you hate because of 'stability'",
        "how_enemy_manifests": "The delusion of security prevents taking risks that could lead to fulfillment. Years pass in comfortable misery.",
        "gita_verse_ref": {"chapter": 7, "verse": 27},
        "gita_wisdom": "By the delusion of opposites arising from desire and aversion, all beings are subject to illusion at birth.",
        "practical_antidote": "Define what security really means to you. Is it money, or is it living authentically? Start a side project aligned with your purpose.",
        "reflection_question": "What would I pursue if I knew I couldn't fail?",
    },
    {
        "enemy": "moha",
        "category": "family",
        "scenario": "Excessive attachment to children's success",
        "how_enemy_manifests": "Living vicariously through children, pushing them toward your unfulfilled dreams rather than supporting their authentic path.",
        "gita_verse_ref": {"chapter": 18, "verse": 73},
        "gita_wisdom": "Arjuna said: My delusion is destroyed. By Your grace, my memory is restored. I am firm, free from doubt, and will act according to Your word.",
        "practical_antidote": "Reflect on your own unlived dreams. Separate your aspirations from your child's. Support their unique journey.",
        "reflection_question": "Whose dreams am I projecting onto my children?",
    },
    {
        "enemy": "moha",
        "category": "personal_growth",
        "scenario": "Clinging to an outdated self-image",
        "how_enemy_manifests": "Identifying with who you were—the athlete, the achiever, the victim—prevents embracing who you're becoming.",
        "gita_verse_ref": {"chapter": 13, "verse": 31},
        "gita_wisdom": "When one perceives the diversity of existence as rooted in One, and spreading forth from that One, then one attains Brahman.",
        "practical_antidote": "Write a letter from your future self, free from old identities. What does that person want you to know?",
        "reflection_question": "What identity am I holding onto that no longer fits?",
    },
    # =========================================================================
    # MADA (Pride / Ego / Arrogance)
    # =========================================================================
    {
        "enemy": "mada",
        "category": "workplace",
        "scenario": "Difficulty accepting help or admitting you don't know something",
        "how_enemy_manifests": "Pride prevents learning and collaboration. You struggle alone rather than appearing 'weak' by asking for help.",
        "gita_verse_ref": {"chapter": 16, "verse": 4},
        "gita_wisdom": "Arrogance, pride, anger, harshness, and ignorance—these qualities belong to those born with demonic nature.",
        "practical_antidote": "This week, deliberately ask for help on something. Notice how it feels. Observe that vulnerability often strengthens connection.",
        "reflection_question": "What am I protecting by not asking for help?",
    },
    {
        "enemy": "mada",
        "category": "relationships",
        "scenario": "Always needing to be right in discussions with partner",
        "how_enemy_manifests": "Every conversation becomes a competition. Being right becomes more important than being connected.",
        "gita_verse_ref": {"chapter": 18, "verse": 26},
        "gita_wisdom": "One who is free from attachment and ego, endowed with determination and enthusiasm, unchanged in success and failure—such a person is called sattvic.",
        "practical_antidote": "In your next disagreement, genuinely try to understand before being understood. Say: 'Help me see this from your view.'",
        "reflection_question": "Would I rather be right, or would I rather be close?",
    },
    {
        "enemy": "mada",
        "category": "social_media",
        "scenario": "Curating a perfect online image that differs from reality",
        "how_enemy_manifests": "Energy spent maintaining a false image creates disconnection from the authentic self and from genuine relationships.",
        "gita_verse_ref": {"chapter": 3, "verse": 27},
        "gita_wisdom": "All activities are performed by the modes of material nature. But one deluded by ego thinks: 'I am the doer.'",
        "practical_antidote": "Post something authentic and imperfect. Notice the fear. Notice that real connection follows vulnerability.",
        "reflection_question": "Who would I be if I didn't need anyone's approval?",
    },
    {
        "enemy": "mada",
        "category": "personal_growth",
        "scenario": "Dismissing spiritual practices as 'beneath' your intellectual level",
        "how_enemy_manifests": "Pride in intellect blocks access to wisdom that comes through humility, practice, and surrender.",
        "gita_verse_ref": {"chapter": 4, "verse": 34},
        "gita_wisdom": "Learn the truth by approaching a spiritual master. Inquire with humility and render service. The wise, having seen the truth, will instruct you.",
        "practical_antidote": "Approach one practice you've dismissed with beginner's mind. Try it genuinely before judging.",
        "reflection_question": "What might I discover if I approached life with more humility?",
    },
    # =========================================================================
    # MATSARYA (Jealousy / Envy)
    # =========================================================================
    {
        "enemy": "matsarya",
        "category": "social_media",
        "scenario": "Feeling inadequate when seeing others' highlight reels online",
        "how_enemy_manifests": "Constant comparison leads to chronic dissatisfaction with your own life, which may actually be wonderful.",
        "gita_verse_ref": {"chapter": 12, "verse": 13},
        "gita_wisdom": "One who is free from envy, friendly and compassionate to all beings, free from possessiveness and ego—such a person is dear to Me.",
        "practical_antidote": "When envy arises, transform it: 'Their success shows what's possible for me too.' Practice mudita—joy in others' happiness.",
        "reflection_question": "What if their success was my inspiration rather than my competition?",
    },
    {
        "enemy": "matsarya",
        "category": "workplace",
        "scenario": "Colleague gets the promotion you wanted",
        "how_enemy_manifests": "Resentment colors all future interactions. You look for their failures and minimize their achievements.",
        "gita_verse_ref": {"chapter": 6, "verse": 32},
        "gita_wisdom": "One who sees all beings in the self and the self in all beings, seeing the same everywhere—such a yogi is considered the highest.",
        "practical_antidote": "Genuinely congratulate them. Ask what they did well—there may be lessons for your own growth.",
        "reflection_question": "How can their success be my teacher rather than my torment?",
    },
    {
        "enemy": "matsarya",
        "category": "family",
        "scenario": "Sibling or cousin seems to have a 'better' life",
        "how_enemy_manifests": "Family gatherings become painful comparisons. You see only their advantages, not their struggles.",
        "gita_verse_ref": {"chapter": 14, "verse": 22},
        "gita_wisdom": "One who is beyond the three gunas, unmoved by their workings, who remains centered knowing 'the gunas are at work'—such a person is called beyond gunas.",
        "practical_antidote": "Make a list of 10 things you have that you're grateful for. Recognize that everyone has unseen struggles.",
        "reflection_question": "What blessings in my life am I overlooking while focused on what others have?",
    },
    {
        "enemy": "matsarya",
        "category": "relationships",
        "scenario": "Friend's relationship seems happier than yours",
        "how_enemy_manifests": "Idealization of others' relationships while seeing only the flaws in your own creates a cycle of dissatisfaction.",
        "gita_verse_ref": {"chapter": 2, "verse": 57},
        "gita_wisdom": "One who withdraws the senses from sense objects as a tortoise withdraws its limbs, is established in wisdom.",
        "practical_antidote": "Remember that you're seeing their public moments, not private struggles. Invest that comparative energy into nurturing your own relationship.",
        "reflection_question": "What would happen if I put the energy of comparison into appreciation?",
    },
    # =========================================================================
    # GENERATION-Z scenarios — KAMA (desire / craving / dopamine loops)
    # =========================================================================
    {
        "enemy": "kama",
        "category": "social_media",
        "generation": "gen_z",
        "scenario": "Falling into the TikTok For-You-Page rabbit hole for hours",
        "how_enemy_manifests": "Each swipe promises the next perfect dopamine hit. Three hours pass; you cannot remember a single video, but the wanting mind has been fed.",
        "gita_verse_ref": {"chapter": 3, "verse": 37},
        "gita_wisdom": "It is desire, born of rajas, that is the all-devouring enemy here in this world. Know this to be the foe.",
        "practical_antidote": "Move TikTok / Reels off the home screen. Set a 20-minute hard timer before opening. When the urge strikes, do one push-up before tapping the icon.",
        "sanatan_practice": "Indriya-pratyahara: at the urge, close the eyes and chant 'Om' three times — turning the senses inward as Krishna directs in BG 2.58 (the tortoise withdrawing its limbs).",
        "reflection_question": "What real hunger of mine is the algorithm pretending to feed?",
    },
    {
        "enemy": "kama",
        "category": "relationships",
        "generation": "gen_z",
        "scenario": "Endless swiping on dating apps and lingering 'situationships'",
        "how_enemy_manifests": "The next-profile fantasy keeps you from being present with anyone. You collect matches; you starve for connection.",
        "gita_verse_ref": {"chapter": 5, "verse": 22},
        "gita_wisdom": "The pleasures born of sense-contact are wombs of suffering — they have a beginning and an end. The wise do not delight in them.",
        "practical_antidote": "Delete one dating app for a week. Before swiping, name out loud the qualities a real partnership would require. Stop swiping after 15 minutes — quality over quantity.",
        "sanatan_practice": "Brahmacharya as energy-stewardship: dedicate one weekend to a tech-free practice (walk in nature, seva, japa) so the prana you usually leak into swipe-craving is reclaimed.",
        "reflection_question": "Am I looking for a person, or for the feeling of being chosen?",
    },
    {
        "enemy": "kama",
        "category": "finance",
        "generation": "gen_z",
        "scenario": "Buy-now-pay-later impulse hauls on Shein / Temu / Amazon",
        "how_enemy_manifests": "The 'add to cart' high is the destination; the package arrival is a let-down. Closet fills; bank account thins; the underlying ache is still there.",
        "gita_verse_ref": {"chapter": 3, "verse": 43},
        "gita_wisdom": "Knowing the Self beyond the intellect, steady the lower self by the higher Self. Conquer this stubborn enemy — desire.",
        "practical_antidote": "Install a 'cooling-off' wishlist: anything you want must sit on the list 7 days before checkout. Track how many items you no longer want by day 7.",
        "sanatan_practice": "Santosha (contentment) sankalpa: every morning before opening any app, name three things you already own that are sufficient. Aparigraha — non-grasping — practiced as ritual.",
        "reflection_question": "Is this cart a real need, or is it grief / boredom / loneliness wearing a credit-card mask?",
    },
    {
        "enemy": "kama",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Stacking aesthetic identities (clean girl, dark academia, soft-core, that-girl)",
        "how_enemy_manifests": "Each aesthetic promises a self that will finally feel whole. You chase the look; the wanting reconstitutes around the next trend.",
        "gita_verse_ref": {"chapter": 2, "verse": 70},
        "gita_wisdom": "As the ocean remains undisturbed while rivers enter it, so the wise are unmoved when desires enter them — they alone find peace.",
        "practical_antidote": "Choose a single 'identity-fast' week — no new aesthetics, no Pinterest, no haul videos. Notice what wants to emerge without the borrowed costume.",
        "sanatan_practice": "Atma-vichara (Who am I?): five minutes before sleep, ask the question Ramana Maharshi taught — beneath every aesthetic, who is the one watching them come and go?",
        "reflection_question": "Which version of me is borrowing someone else's vibe to avoid meeting itself?",
    },
    # =========================================================================
    # GENERATION-Z scenarios — KRODHA (anger / reactive heat)
    # =========================================================================
    {
        "enemy": "krodha",
        "category": "social_media",
        "generation": "gen_z",
        "scenario": "Pile-ons and quote-tweet dunks on X / Threads",
        "how_enemy_manifests": "Righteous heat feels like justice; meanwhile your nervous system is fried, your sleep is wrecked, and the target is a stranger.",
        "gita_verse_ref": {"chapter": 2, "verse": 63},
        "gita_wisdom": "From anger arises delusion; from delusion, confusion of memory; from confused memory, the destruction of discrimination; and then one perishes.",
        "practical_antidote": "Adopt a 24-hour rule: never quote-tweet in heat. Draft, sleep, re-read tomorrow. Mute words that trigger your reactivity for a week.",
        "sanatan_practice": "Kshama (forgiveness as strength): when the urge to punish a stranger surfaces, take three slow rounds of nadi-shodhana (alternate-nostril breathing) before the thumb meets the screen.",
        "reflection_question": "Is this the cause of justice — or is it the dopamine of being seen to defend justice?",
    },
    {
        "enemy": "krodha",
        "category": "workplace",
        "generation": "gen_z",
        "scenario": "Rage at a manager's Slack ping at 9 PM",
        "how_enemy_manifests": "A boundary has been crossed and the body knows. The anger is information, but the response — a venting voice-note to a coworker — only burns you twice.",
        "gita_verse_ref": {"chapter": 16, "verse": 21},
        "gita_wisdom": "Lust, anger, and greed — these three are the gates of self-destruction. Therefore one must abandon them all.",
        "practical_antidote": "Set a 'comms cutoff' in your status. Write the angry response in a draft. Send a calm boundary message the next morning at 9 AM, not in heat.",
        "sanatan_practice": "Shanti-japa: 108 slow repetitions of 'Om Shanti' before drafting any reply. Treat the breath as a cooling stream over the fire (BG 5.23 — withstanding the impulse of desire and anger).",
        "reflection_question": "What boundary is my anger pointing at — and can I honor it without burning the bridge?",
    },
    {
        "enemy": "krodha",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Climate anxiety turning into eco-rage at older generations",
        "how_enemy_manifests": "Grief and fear come out as scorn. The rage is real and the cause is just, but the fire eats the activist before it touches the harm.",
        "gita_verse_ref": {"chapter": 5, "verse": 23},
        "gita_wisdom": "One who, before leaving the body, can withstand the urge of desire and anger — that yogi is happy.",
        "practical_antidote": "Channel one hour of rage-scrolling into one concrete action this week (write to a representative, divest one account, join one local cleanup). Action is anti-anger.",
        "sanatan_practice": "Karma-yoga (BG 2.47): act for the duty itself, surrender the fruits. Plant one tree, do one act of seva, with the sankalpa 'this is offered, not owed.'",
        "reflection_question": "Beneath the rage at 'them' — what grief have I not let myself feel?",
    },
    {
        "enemy": "krodha",
        "category": "family",
        "generation": "gen_z",
        "scenario": "Explosive argument with parents about identity, career, or pronouns",
        "how_enemy_manifests": "Years of being unheard compress into one Sunday dinner detonation. Both sides leave more wounded; nothing was actually said.",
        "gita_verse_ref": {"chapter": 2, "verse": 56},
        "gita_wisdom": "One whose mind is unshaken in sorrow, who is free from longing in pleasure, free from attachment, fear, and anger — is called a sage of steady wisdom.",
        "practical_antidote": "Use a 90-second physiological reset: cold water on the wrists, four-count exhale longer than inhale. Reschedule the conversation for a walk, not the dinner table.",
        "sanatan_practice": "Matri-pitri seva-bhava (BG 13.7): before the conversation, do one small act of service for them (chai, a shared photo, a question about their childhood). Anger softens where reverence enters.",
        "reflection_question": "Do I want to be understood, or do I want to win? Which can I actually live with tomorrow?",
    },
    # =========================================================================
    # GENERATION-Z scenarios — LOBHA (greed / accumulation / FOMO)
    # =========================================================================
    {
        "enemy": "lobha",
        "category": "finance",
        "generation": "gen_z",
        "scenario": "FOMO-buying meme stocks, crypto, or NFTs at the top",
        "how_enemy_manifests": "Each green candle whispers 'you're missing it.' The mind compresses years of patience into a 5-minute panic-buy that the market punishes.",
        "gita_verse_ref": {"chapter": 14, "verse": 17},
        "gita_wisdom": "From rajas — greed is born; from tamas — negligence, delusion, and ignorance. Sattva alone gives knowledge.",
        "practical_antidote": "Define a written 'enough' number and refuse to look at portfolios more than once a day. The 24-hour buy rule: no purchase under emotional spike.",
        "sanatan_practice": "Aparigraha-vrata (vow of non-grasping): one Saturday a month, no new financial transactions. Let the wanting move through, observed but unfed.",
        "reflection_question": "If this goes to zero tomorrow, what was I really buying — the asset, or the story I told myself about who I'd be once I had it?",
    },
    {
        "enemy": "lobha",
        "category": "workplace",
        "generation": "gen_z",
        "scenario": "Side-hustle stacking — 9-to-5 + Uber + Etsy + content creation",
        "how_enemy_manifests": "Every waking minute is monetized. Rest becomes guilt. The accumulation logic devours the life it was supposed to fund.",
        "gita_verse_ref": {"chapter": 16, "verse": 12},
        "gita_wisdom": "Bound by a hundred ties of hope, given over to desire and anger, they strive to amass wealth by unjust means for the satisfaction of cravings.",
        "practical_antidote": "Pick ONE primary income stream this quarter. Audit the others for true ROI (energy + money). Sabbath one day a week — no monetized activity.",
        "sanatan_practice": "Tyaga (renunciation of the fruits, not the work — BG 18.11): keep the work, drop one hustle as an offering. Donate the first hour's earnings each week as dana.",
        "reflection_question": "What is the version of my life that this hustle is supposed to buy — and could I live it now, smaller, today?",
    },
    {
        "enemy": "lobha",
        "category": "daily_life",
        "generation": "gen_z",
        "scenario": "Sneaker / streetwear / limited-drop hoarding and resell culture",
        "how_enemy_manifests": "The drop is the ritual; the unboxing is the deity; the closet is the shrine to a self that never quite arrives.",
        "gita_verse_ref": {"chapter": 2, "verse": 71},
        "gita_wisdom": "The person who has given up all desires and moves about free from craving — free from 'mine' and 'I' — attains peace.",
        "practical_antidote": "One-in / one-out rule with extra step: for every drop bought, give one piece you own to someone who would actually wear it. Track NPS (do you wear it 7 times in 90 days?).",
        "sanatan_practice": "Dana as ritual (BG 17.20): give the next drop's budget — fully — to a cause you care about. Watch how the wanting changes shape when the loop is broken.",
        "reflection_question": "Am I dressing a body, or feeding an identity that will need a new drop next week to keep existing?",
    },
    {
        "enemy": "lobha",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Grindset / hustle-culture LinkedIn flexing and bookmark hoarding",
        "how_enemy_manifests": "You collect courses, saved-posts, and 'one-day' projects. The collection becomes the substitute for the doing.",
        "gita_verse_ref": {"chapter": 6, "verse": 16},
        "gita_wisdom": "Yoga is not for one who eats too much or too little, who sleeps too much or too little. The middle way is the way.",
        "practical_antidote": "Bookmark-purge ritual: delete 80% of saved content. The other 20% must each get a calendared 'do' date or be deleted at month-end.",
        "sanatan_practice": "Swadhyaya (study + self-study, BG 16.1) over hoarding: read ONE chapter slowly, journal three lines about what changed in you. Knowledge is digested, not collected.",
        "reflection_question": "What would I have to admit about myself if the bookmarks bar were empty?",
    },
    # =========================================================================
    # GENERATION-Z scenarios — MOHA (delusion / attachment / fantasy)
    # =========================================================================
    {
        "enemy": "moha",
        "category": "social_media",
        "generation": "gen_z",
        "scenario": "Parasocial bond with a streamer, podcaster, or creator",
        "how_enemy_manifests": "Their voice is in your ear daily; you grieve their breaks; you defend them online. Yet they cannot pick you out of a crowd.",
        "gita_verse_ref": {"chapter": 2, "verse": 52},
        "gita_wisdom": "When your understanding crosses the swamp of delusion, you become indifferent to all that has been heard and all that is to be heard.",
        "practical_antidote": "Unfollow for 30 days. Replace the listening time with one phone call a week to someone who knows your real name. Track which connection nourishes more.",
        "sanatan_practice": "Viveka — the discriminative faculty (BG 4.39): each morning, name aloud three relationships that are mutual. Bhakti is reverence; parasocial fixation is its shadow.",
        "reflection_question": "If this person never spoke to me again, what would still be true about my life?",
    },
    {
        "enemy": "moha",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Sliding into conspiracy / wellness-cult / radicalization rabbit holes",
        "how_enemy_manifests": "Every video confirms the worldview. The algorithm rewards certainty; doubt feels like betrayal of the in-group; nuance evaporates.",
        "gita_verse_ref": {"chapter": 7, "verse": 27},
        "gita_wisdom": "By the delusion of dualities — born of liking and disliking — all creatures are bewildered at birth.",
        "practical_antidote": "Read one well-sourced article weekly that disagrees with your strongest belief. Talk to one person who used to believe what you now do, and who left.",
        "sanatan_practice": "Buddhi-yoga (the yoga of discernment, BG 2.39): sit ten minutes daily asking 'What in me NEEDS this to be true?' Let the answer be uncomfortable.",
        "reflection_question": "Who would I have to become — and what would I have to grieve — if the central belief turned out to be more complicated than the video said?",
    },
    {
        "enemy": "moha",
        "category": "relationships",
        "generation": "gen_z",
        "scenario": "Emotional dependence on AI chat companions / 'soulmate' fixations",
        "how_enemy_manifests": "The bot never disappoints; the imagined soulmate never argues. Real, imperfect relationships start to feel intolerable by comparison.",
        "gita_verse_ref": {"chapter": 5, "verse": 22},
        "gita_wisdom": "Pleasures born of contact with objects are sources of misery; they have a beginning and an end. The wise do not rejoice in them.",
        "practical_antidote": "Cap AI-companion use to 30 minutes/day. Reinvest the time in one weekly in-person conversation that does not have an end-of-trial paywall.",
        "sanatan_practice": "Satsang (gathering with the real, BG 13.10): once a week, share a meal with one human you can touch. Sangha is medicine moha cannot synthesize.",
        "reflection_question": "What part of me is being loved by the bot — and what part of me needs to be loved by another flawed human to actually heal?",
    },
    {
        "enemy": "moha",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Y2K / cottagecore / nostalgia-loop escapism",
        "how_enemy_manifests": "Curated longing for an era you didn't live, or a self you weren't, becomes a permanent hiding place from the present moment.",
        "gita_verse_ref": {"chapter": 13, "verse": 31},
        "gita_wisdom": "When the wise one sees this universe sustained by the One, spreading out into many — then they attain Brahman.",
        "practical_antidote": "Make ONE thing from the era you romanticize, in your real life. (Sew the dress, cook the recipe, write the letter.) Test whether the longing survives the doing.",
        "sanatan_practice": "Vartamana-darshan — seeing the present (BG 6.5): five minutes of sitting still, no aesthetic playlist, no filter. Watch what the body actually wants today.",
        "reflection_question": "What is the present asking of me that I'm trying to outrun by remembering a time that never quite existed?",
    },
    # =========================================================================
    # GENERATION-Z scenarios — MADA (pride / ego / performance)
    # =========================================================================
    {
        "enemy": "mada",
        "category": "social_media",
        "generation": "gen_z",
        "scenario": "Main-character-syndrome posting and the curated highlight feed",
        "how_enemy_manifests": "Every walk is a photoshoot; every meal is content. You stop experiencing the life you are too busy publishing.",
        "gita_verse_ref": {"chapter": 3, "verse": 27},
        "gita_wisdom": "All actions are performed by the gunas of nature. The self, bewildered by ego, thinks 'I am the doer.'",
        "practical_antidote": "Try a 'no-content week' — one full week of meals, sunsets, and outfits that no one online sees. Notice the withdrawal symptoms honestly.",
        "sanatan_practice": "Anonymous seva (BG 17.20): perform one act of help this week and tell no one. The dropping of the 'who saw me do it?' is mada loosening its grip.",
        "reflection_question": "If the post got zero likes, would this moment still have happened? If yes, why did I need the post?",
    },
    {
        "enemy": "mada",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Performative activism and virtue-signaling carousels",
        "how_enemy_manifests": "Sharing the right slide becomes the activism. The dopamine of being seen as good crowds out the slow, unglamorous work of being good.",
        "gita_verse_ref": {"chapter": 17, "verse": 18},
        "gita_wisdom": "Penance performed for show, to win honor and respect — that penance is called rajasic, unsteady and impermanent.",
        "practical_antidote": "Ratio rule: for every cause you post about publicly, do one private action (donate, volunteer, learn). Track the ratio; aim for it to flip toward private.",
        "sanatan_practice": "Nishkama-karma (BG 2.47): act for the cause itself, not for the credit. Donate without screenshotting the receipt. Let the deed be the prayer.",
        "reflection_question": "If no one would ever know I cared about this — would I still do the work?",
    },
    {
        "enemy": "mada",
        "category": "relationships",
        "generation": "gen_z",
        "scenario": "Diagnosing yourself or others through TikTok pop-psychology",
        "how_enemy_manifests": "Every difficult person becomes a 'narcissist'; every quirk becomes a clinical label. The certainty feels powerful; nuance and growth disappear.",
        "gita_verse_ref": {"chapter": 16, "verse": 4},
        "gita_wisdom": "Hypocrisy, arrogance, conceit, anger, harshness, and ignorance — these belong to one of demonic disposition.",
        "practical_antidote": "When you reach for a label, pause and describe one specific behavior instead. Speak to a real therapist before adopting any TikTok diagnosis as identity.",
        "sanatan_practice": "Vinaya (BG 13.7) — humility as the first virtue: write one sentence each evening — 'today I was wrong about ____' — even if the wrongness was small.",
        "reflection_question": "Is this label helping me understand a person — or helping me end the conversation without having to grow?",
    },
    {
        "enemy": "mada",
        "category": "workplace",
        "generation": "gen_z",
        "scenario": "'I figured it out alone' — refusing mentors, therapy, or feedback",
        "how_enemy_manifests": "Self-reliance hardens into isolation. The pride of 'I built this' refuses the help that would have made the building lighter and the builder kinder.",
        "gita_verse_ref": {"chapter": 4, "verse": 34},
        "gita_wisdom": "Learn this by humble approach, by inquiry, by service. The wise who have seen the Truth will instruct you.",
        "practical_antidote": "This month, ask three people for help on three different things. Note which ego-story flares up each time — that flare is the work.",
        "sanatan_practice": "Guru-shishya bhava (the disciple disposition, BG 4.34): identify one teacher (alive or in books) and write them a real thank-you. Receiving teaching is a practice.",
        "reflection_question": "What part of my identity depends on the story that no one helped me?",
    },
    # =========================================================================
    # GENERATION-Z scenarios — MATSARYA (envy / comparison / scarcity)
    # =========================================================================
    {
        "enemy": "matsarya",
        "category": "social_media",
        "generation": "gen_z",
        "scenario": "Watching peers' 'soft life' content while you grind",
        "how_enemy_manifests": "Their morning routine is your evidence of failure. The comparison is between your behind-the-scenes and their highlight reel.",
        "gita_verse_ref": {"chapter": 12, "verse": 13},
        "gita_wisdom": "One who has no ill-will toward any being, who is friendly and compassionate, free from possessiveness and ego — that devotee is dear to Me.",
        "practical_antidote": "Mute (don't unfollow — that's still attention) the three accounts whose content tightens your chest. Replace the time with a 20-minute walk.",
        "sanatan_practice": "Mudita-bhavana (the meditation on sympathetic joy): each night, name three people whose wins you genuinely celebrated today. Train the muscle.",
        "reflection_question": "Whose unedited day am I actually competing with — and would I trade my whole life for theirs, or only the photo?",
    },
    {
        "enemy": "matsarya",
        "category": "workplace",
        "generation": "gen_z",
        "scenario": "AI doing your job better — and a friend earning more for less effort",
        "how_enemy_manifests": "The scarcity logic says someone else's competence makes yours worth less. Envy curdles into self-attack and resentment of the friend.",
        "gita_verse_ref": {"chapter": 6, "verse": 32},
        "gita_wisdom": "One who sees the same Self in all beings — in joy and in sorrow — that yogi is regarded as supreme.",
        "practical_antidote": "Convert envy into curriculum: ask the friend or the model how it does what it does. Spend 30 minutes on one new skill instead of 60 on resentment.",
        "sanatan_practice": "Karuna (compassion) + maitri (friendliness): write a sincere congratulation to the friend, even if it stings. The sting is where the practice begins.",
        "reflection_question": "If their success added to mine instead of subtracted — what would I do with that freed-up energy today?",
    },
    {
        "enemy": "matsarya",
        "category": "personal_growth",
        "generation": "gen_z",
        "scenario": "Comparing yourself to your own past self's productivity (the lockdown-glow-up myth)",
        "how_enemy_manifests": "You envy a version of you that posted six-pack progress in 2021. The current you is grieving, healing, building — invisible work in invisible seasons.",
        "gita_verse_ref": {"chapter": 14, "verse": 22},
        "gita_wisdom": "One who is unmoved by the gunas — neither hating nor craving their workings — who is steady, knowing it is the gunas at work — that person is established beyond them.",
        "practical_antidote": "Write a 'season audit' — list what THIS season is for (recovery, learning, parenting, grief). Measure with this season's metrics, not last season's.",
        "sanatan_practice": "Kalachakra-darshan — seeing the wheel of time (BG 11.32): meditate on impermanence. The past-self you envy will also pass; today is the only ground.",
        "reflection_question": "Which season of life am I actually in — and what would honoring this season, instead of mourning the last, look like today?",
    },
    {
        "enemy": "matsarya",
        "category": "relationships",
        "generation": "gen_z",
        "scenario": "Envying a friend group / aesthetic-coded community on Instagram",
        "how_enemy_manifests": "Their grid screams belonging. Yours feels patchy. You forget you're consuming the marketing of friendship, not the friendship itself.",
        "gita_verse_ref": {"chapter": 2, "verse": 57},
        "gita_wisdom": "One who is unattached everywhere, who neither rejoices nor recoils on receiving good or evil — that person's wisdom is firm.",
        "practical_antidote": "Invest the comparison-energy into ONE friendship in your real life this week: a meal, a walk, a real question, a real listen.",
        "sanatan_practice": "Satsang as antidote (BG 10.9): gather your closest two or three people for a simple ritual — a meal, a chant, a shared silence. Belonging is built, not browsed.",
        "reflection_question": "Am I lonely for a group of people — or for a quality of attention I could give to the people already in my life?",
    },
]


# =============================================================================
# MODERN EXAMPLES DATABASE
# =============================================================================


class ModernExamplesDB:
    """
    Database of modern examples connecting Six Enemies to daily life.

    Provides curated scenarios with Gita wisdom and practical antidotes.
    """

    def __init__(self):
        self._examples: list[EnemyExample] = [
            EnemyExample(**data) for data in EXAMPLES_DATA
        ]

    def get_examples(
        self,
        enemy: str,
        category: str | None = None,
        limit: int | None = None,
    ) -> list[EnemyExample]:
        """
        Get examples for a specific enemy.

        Args:
            enemy: The inner enemy (e.g., "krodha")
            category: Optional category filter
            limit: Maximum number of examples

        Returns:
            List of matching examples
        """
        results = [
            ex for ex in self._examples
            if ex.enemy == enemy.lower()
        ]

        if category:
            results = [
                ex for ex in results
                if ex.category == category.lower()
            ]

        if limit:
            results = results[:limit]

        return results

    def get_random_example(self, enemy: str) -> EnemyExample | None:
        """Get a random example for the given enemy."""
        examples = self.get_examples(enemy)
        return random.choice(examples) if examples else None

    def get_all_enemies(self) -> list[str]:
        """Get list of all enemies with examples."""
        return list(set(ex.enemy for ex in self._examples))

    def get_categories(self) -> list[str]:
        """Get list of all categories."""
        return list(set(ex.category for ex in self._examples))

    def get_by_verse(
        self,
        chapter: int,
        verse: int,
    ) -> list[EnemyExample]:
        """Get examples that reference a specific verse."""
        return [
            ex for ex in self._examples
            if ex.gita_verse_ref.get("chapter") == chapter
            and ex.gita_verse_ref.get("verse") == verse
        ]

    def get_example_count(self, enemy: str | None = None) -> int:
        """Get count of examples, optionally filtered by enemy."""
        if enemy:
            return len([ex for ex in self._examples if ex.enemy == enemy.lower()])
        return len(self._examples)

    def add_example(self, example: EnemyExample) -> None:
        """Add a new example to the database."""
        self._examples.append(example)

    def to_dict(self) -> dict[str, list[dict]]:
        """Export all examples as dictionary grouped by enemy."""
        result: dict[str, list[dict]] = {}
        for ex in self._examples:
            if ex.enemy not in result:
                result[ex.enemy] = []
            result[ex.enemy].append(ex.to_dict())
        return result


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================


_examples_db: ModernExamplesDB | None = None


def get_examples_db() -> ModernExamplesDB:
    """Get the singleton ModernExamplesDB instance."""
    global _examples_db
    if _examples_db is None:
        _examples_db = ModernExamplesDB()
    return _examples_db
