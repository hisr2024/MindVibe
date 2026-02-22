"""Beginner Curriculum routes: structured introduction to the Bhagavad Gita.

For Gita-curious users who don't know where to start. Provides a
7-day introductory curriculum that teaches the Gita's core concepts
without assuming prior knowledge.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from backend.deps import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/beginner", tags=["beginner-curriculum"])


# ---------------------------------------------------------------------------
# The 7-Day Beginner Curriculum (static, no DB dependency)
# ---------------------------------------------------------------------------

BEGINNER_CURRICULUM = {
    "id": "gita-foundations-7day",
    "title": "Discover the Gita: 7 Days to Inner Wisdom",
    "description": (
        "A gentle introduction to the Bhagavad Gita for complete beginners. "
        "No prior knowledge needed — just curiosity and an open heart."
    ),
    "duration_days": 7,
    "difficulty": 1,
    "is_free": True,
    "days": [
        {
            "day": 1,
            "title": "What is the Bhagavad Gita?",
            "teaching": (
                "The Bhagavad Gita is a 700-verse conversation between Prince Arjuna "
                "and Lord Krishna on a battlefield. But it's not really about war — "
                "it's about the battles we all fight inside ourselves. Every time you "
                "feel torn between what's easy and what's right, you're Arjuna. And "
                "the Gita offers Krishna's wisdom to guide you through."
            ),
            "key_concept": "Dharma (purpose/duty)",
            "verse": {
                "chapter": 2,
                "verse": 47,
                "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
                "translation": (
                    "You have the right to perform your duty, but you are not "
                    "entitled to the fruits of your actions."
                ),
            },
            "reflection_prompt": (
                "Think of one thing you've been avoiding because you're afraid of the outcome. "
                "What would change if you focused only on doing it well, without worrying about results?"
            ),
            "practice": "Write down one task you'll do today purely for the act of doing it, without attachment to what happens.",
        },
        {
            "day": 2,
            "title": "The Two Selves: Who Are You Really?",
            "teaching": (
                "The Gita teaches that you have two selves: the small self (ego, fears, desires) "
                "and the true Self (atman — your unchanging essence). When you feel anxious, "
                "jealous, or angry, that's the small self reacting. Your true Self is calm, "
                "aware, and whole — it was never broken."
            ),
            "key_concept": "Atman (the true Self)",
            "verse": {
                "chapter": 2,
                "verse": 20,
                "sanskrit": "न जायते म्रियते वा कदाचित्",
                "translation": (
                    "The Self is never born, nor does it die. It is unborn, eternal, "
                    "ever-existing, and primeval."
                ),
            },
            "reflection_prompt": (
                "When have you felt completely at peace — as if your worries didn't define you? "
                "That glimpse of peace is your true Self."
            ),
            "practice": "Sit quietly for 5 minutes. When a thought arises, say 'I am not this thought' and let it pass.",
        },
        {
            "day": 3,
            "title": "The Three Paths: Finding Your Way",
            "teaching": (
                "The Gita doesn't prescribe one way. It offers three paths that suit "
                "different temperaments: Karma Yoga (selfless action), Bhakti Yoga "
                "(devotion and love), and Jnana Yoga (knowledge and wisdom). "
                "Most of us use a combination. The 'right' path is the one that "
                "naturally draws your heart."
            ),
            "key_concept": "The Three Yogas (paths to liberation)",
            "verse": {
                "chapter": 3,
                "verse": 19,
                "sanskrit": "तस्मादसक्तः सततं कार्यं कर्म समाचर",
                "translation": (
                    "Therefore, without attachment, always perform your duty, "
                    "for by working without attachment, one attains the Supreme."
                ),
            },
            "reflection_prompt": (
                "Which resonates more with you right now: doing good work (Karma), "
                "loving deeply (Bhakti), or understanding deeply (Jnana)? There's no wrong answer."
            ),
            "practice": "Choose one act of selfless service today — help someone without expecting anything back.",
        },
        {
            "day": 4,
            "title": "The Mind: Your Greatest Friend or Enemy",
            "teaching": (
                "Krishna tells Arjuna: 'For one who has conquered the mind, "
                "the mind is the best of friends; but for one who has failed "
                "to do so, the mind is the greatest enemy.' Your thoughts shape "
                "your reality. The Gita doesn't say to suppress thoughts — "
                "it says to observe them with detachment."
            ),
            "key_concept": "Mastering the mind through practice (Abhyasa)",
            "verse": {
                "chapter": 6,
                "verse": 6,
                "sanskrit": "बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः",
                "translation": (
                    "For one who has conquered the mind, the mind is the best "
                    "of friends; but for one who has failed to do so, the mind "
                    "remains the greatest enemy."
                ),
            },
            "reflection_prompt": (
                "Notice your inner voice today. Is it kind or critical? "
                "Is it encouraging or anxious? Just notice — don't judge."
            ),
            "practice": "When you catch yourself spiraling in thoughts, pause and take 3 slow breaths. Just observe.",
        },
        {
            "day": 5,
            "title": "Equanimity: Staying Balanced in the Storm",
            "teaching": (
                "One of the Gita's most powerful teachings is sthitaprajna — "
                "the state of being unmoved by pleasure or pain, success or failure. "
                "This doesn't mean being emotionless. It means your core remains "
                "steady while emotions come and go, like waves on the ocean."
            ),
            "key_concept": "Sthitaprajna (equanimity / steady wisdom)",
            "verse": {
                "chapter": 2,
                "verse": 14,
                "sanskrit": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः",
                "translation": (
                    "The contacts of the senses with their objects, which give rise "
                    "to feelings of heat and cold, pleasure and pain, are impermanent. "
                    "Bear them patiently, O Arjuna."
                ),
            },
            "reflection_prompt": (
                "Think of a recent situation where you overreacted. "
                "How might it have gone differently if you had paused for 10 seconds?"
            ),
            "practice": "Today, when something upsets you, say to yourself: 'This too is temporary.' Then respond, don't react.",
        },
        {
            "day": 6,
            "title": "Letting Go: The Art of Surrender",
            "teaching": (
                "Surrender in the Gita isn't defeat — it's freedom. When you stop "
                "trying to control outcomes and focus on your effort, anxiety drops. "
                "Krishna says: 'Abandon all varieties of duty and just surrender "
                "unto Me. I shall deliver you from all sinful reactions.' Whether "
                "you interpret 'Me' as God, the universe, or your higher self — "
                "the message is: let go of the need to control everything."
            ),
            "key_concept": "Ishvara Pranidhana (surrender to the divine)",
            "verse": {
                "chapter": 18,
                "verse": 66,
                "sanskrit": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
                "translation": (
                    "Abandon all varieties of duty and just surrender unto Me. "
                    "I shall deliver you from all reactions. Do not fear."
                ),
            },
            "reflection_prompt": (
                "What are you holding onto tightly right now — a relationship, an outcome, "
                "a grudge? What would it feel like to loosen your grip, even slightly?"
            ),
            "practice": "Write down one thing you're trying to control. Then write: 'I release the outcome. I keep my effort.'",
        },
        {
            "day": 7,
            "title": "Your Journey Begins: Living the Gita",
            "teaching": (
                "The Gita isn't meant to be read once and shelved. It's meant to be "
                "lived. Every day offers a chance to practice: action without attachment, "
                "steadiness in chaos, compassion in conflict, and surrender when you've "
                "done your best. You've spent 7 days tasting this wisdom. "
                "Now the real journey begins."
            ),
            "key_concept": "Integration — bringing wisdom into daily life",
            "verse": {
                "chapter": 4,
                "verse": 38,
                "sanskrit": "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते",
                "translation": (
                    "In this world, there is nothing as purifying as knowledge. "
                    "One who has achieved perfection in yoga finds it within the Self in due course."
                ),
            },
            "reflection_prompt": (
                "Looking back at these 7 days, which teaching resonated most deeply? "
                "Which one felt uncomfortable? Often the uncomfortable one is what you need most."
            ),
            "practice": "Choose ONE concept from this week and commit to practicing it for the next 30 days. Write it down and place it where you'll see it daily.",
        },
    ],
}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class VerseInfo(BaseModel):
    chapter: int
    verse: int
    sanskrit: str
    translation: str


class CurriculumDay(BaseModel):
    day: int
    title: str
    teaching: str
    key_concept: str
    verse: VerseInfo
    reflection_prompt: str
    practice: str


class CurriculumOut(BaseModel):
    id: str
    title: str
    description: str
    duration_days: int
    difficulty: int
    is_free: bool
    days: list[CurriculumDay]


class CurriculumDayOut(BaseModel):
    """Single day response for progressive revelation."""

    day: int
    title: str
    teaching: str
    key_concept: str
    verse: VerseInfo
    reflection_prompt: str
    practice: str
    total_days: int
    is_last_day: bool


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/curriculum", response_model=CurriculumOut)
async def get_beginner_curriculum(
    request: Request,
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> CurriculumOut:
    """Get the full 7-day beginner curriculum.

    Free for all users — no subscription required.
    """
    return CurriculumOut(**BEGINNER_CURRICULUM)


@router.get("/curriculum/day/{day_number}", response_model=CurriculumDayOut)
async def get_curriculum_day(
    day_number: int,
    request: Request,
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> CurriculumDayOut:
    """Get a specific day of the beginner curriculum.

    Allows progressive revelation — show one day at a time.
    """
    if day_number < 1 or day_number > len(BEGINNER_CURRICULUM["days"]):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Day {day_number} not found. Curriculum has {len(BEGINNER_CURRICULUM['days'])} days."
        )

    day_data = BEGINNER_CURRICULUM["days"][day_number - 1]
    return CurriculumDayOut(
        **day_data,
        total_days=len(BEGINNER_CURRICULUM["days"]),
        is_last_day=day_number == len(BEGINNER_CURRICULUM["days"]),
    )
