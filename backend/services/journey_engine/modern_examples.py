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
    """A modern example for an inner enemy."""
    enemy: str
    category: str
    scenario: str
    how_enemy_manifests: str
    gita_verse_ref: dict[str, int]
    gita_wisdom: str
    practical_antidote: str
    reflection_question: str

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
        "how_enemy_manifests": "Energy spent maintaining an false image creates disconnection from authentic self and genuine relationships.",
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
