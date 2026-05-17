"""Seed script for the Sad-Ripu (Six Inner Enemies) journey catalog.

Without these rows, GET /api/journey-engine/templates returns an empty list
and POST /api/journey-engine/journeys 404s with TEMPLATE_NOT_FOUND. The
mobile catalog therefore looks broken even when the backend is healthy.

What is seeded
==============

1.  FALLBACK_TEMPLATES (6 rows) — short-form titles whose IDs / slugs match
    FALLBACK_TEMPLATES in app/(mobile)/m/journeys/hooks/useMobileJourneys.ts,
    so a journey started from the offline catalog still resolves once the
    backend is reachable.

2.  RICH_TEMPLATES (25 rows) — the long-form catalog the mobile app surfaces
    when the backend is healthy. Covers every Sad-Ripu enemy at four graded
    durations (14, 30, 42, 60 days) plus a combined 42-day journey through
    all six enemies. Slugs / titles align with the runtime template-generator
    contract in backend/services/journey_engine/template_generator.py.

How a day's step is composed (Gurukool 5-stage pedagogy)
========================================================

Each daily step is structured on the ancient Gurukool model of learning,
where wisdom moves from the ear, through the heart, into the world, and
finally into the silent witness behind action:

    1. Śravaṇa            — Listening to the śloka (Static Wisdom Core).
    2. Manana             — Contemplation of the teaching, doubt-removal.
    3. Nididhyāsana       — Meditative embodiment, mantra / breath.
    4. Anuṣṭhāna          — Action in the world. Two layers:
                             (a) the Sanatan (yogic) practice,
                             (b) the modern, secular counterpart.
    5. Sākṣi-bhāva        — Witness check-in: who observes the practice?

Each day's content is composed from three sources, all stored in the
Wisdom Core engine bundled with this repository:

    * Static Wisdom Core   — backend/services/gita_ai_analyzer.GitaWisdomCore
                              (701 BG verses, themes, principles).
    * Dynamic Wisdom Core  — backend/services/journey_engine/modern_examples
                              .ModernExamplesDB (curated modern scenarios,
                              including Gen-Z categories, each pre-anchored
                              to a Gita verse with both a secular antidote
                              and a Sanatan practice).
    * Dharmic Anchors      — _ENEMY_DHARMA in this file: the Sanskrit
                              virtue, the dharmic value, and the moral
                              principle that frame the day.

Two modern examples are surfaced per day, deterministically chosen by
``day_index`` — typically one from the general corpus and one from the
Gen-Z corpus — so the practitioner always sees both a timeless and a
contemporary mirror of the teaching.

Run: python -m backend.scripts.seed_journey_templates
Idempotent: safe to call repeatedly (UPSERT by slug). Re-surfaces rows
that were previously soft-deleted so a re-seed restores a wiped catalog.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from backend.models import Base
from backend.models.journeys import JourneyTemplate, JourneyTemplateStep


# ===========================================================================
# FALLBACK_TEMPLATES — short-form rows whose slugs match the frontend offline
# catalog (app/(mobile)/m/journeys/hooks/useMobileJourneys.ts). A journey
# started from the offline catalog will still resolve once the backend is
# reachable, because both sides agree on the slug.
# ===========================================================================

FALLBACK_TEMPLATES: list[dict] = [
    {
        "id": "krodha-beginner-14",
        "slug": "krodha-beginner-14",
        "title": "Cooling the Fire",
        "description": "A 14-day practice to transform anger into clarity through Gita wisdom.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "flame",
        "color_theme": "#E63946",
    },
    {
        "id": "kama-beginner-21",
        "slug": "kama-beginner-21",
        "title": "Taming Desire",
        "description": "A 21-day journey to understand and release the wanting mind.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "heart",
        "color_theme": "#F77F00",
    },
    {
        "id": "lobha-beginner-14",
        "slug": "lobha-beginner-14",
        "title": "The Open Hand",
        "description": "A 14-day practice of sacred abundance and generous giving.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "hand",
        "color_theme": "#FCBF49",
    },
    {
        "id": "moha-intermediate-21",
        "slug": "moha-intermediate-21",
        "title": "Lifting the Veil",
        "description": "A 21-day journey through the fog of illusion toward clarity.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 21,
        "difficulty": 3,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "eye",
        "color_theme": "#9D4EDD",
    },
    {
        "id": "mada-beginner-14",
        "slug": "mada-beginner-14",
        "title": "The Humble Warrior",
        "description": "A 14-day practice of dissolving ego through sacred humility.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "crown",
        "color_theme": "#06A77D",
    },
    {
        "id": "matsara-beginner-14",
        "slug": "matsara-beginner-14",
        "title": "Celebrating Others",
        "description": "A 14-day journey from comparison and envy toward sympathetic joy.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 2,
        "is_active": True,
        "is_featured": True,
        "is_free": True,
        "icon_name": "sparkles",
        "color_theme": "#1D8FE1",
    },
]


# ===========================================================================
# Enemy-grid generator — long-form catalog: 14 / 30 / 42 / 60 days for every
# Sad-Ripu enemy, graded by difficulty, surfaced as featured on the entry
# duration and deeper / paid as durations lengthen.
# ===========================================================================

# Title prefix, description prefix, and visual identity per enemy.
_ENEMY_TEMPLATE_META: dict[str, dict[str, Any]] = {
    "kama": {
        "title_root": "Master Your Desires",
        "title_subtitles": {
            14: "Finding True Contentment",
            30: "The Discipline of Santosha",
            42: "Vairagya — Sacred Dispassion",
            60: "Living the Free Heart",
        },
        "description": (
            "Walk the Gita's path from craving to contentment. Each day pairs a "
            "Sanskrit virtue, a verse from Krishna's teaching, two real-life "
            "mirrors (one timeless, one Gen-Z), and a paired practice — secular "
            "and Sanatan — so desire becomes wisdom you can live with."
        ),
        "icon_name": "flame",
        "color_theme": "#EF4444",
    },
    "krodha": {
        "title_root": "Transform Your Anger",
        "title_subtitles": {
            14: "Cultivating Peace",
            30: "The Patient Heart",
            42: "Kshama — The Forgiveness Path",
            60: "Sthitaprajna in Action",
        },
        "description": (
            "From reactive fire to responsive wisdom. The Gita names anger as "
            "delusion's gateway — across this journey you will learn to listen "
            "to its message, ground the body, and respond from the steady "
            "intelligence Krishna calls sthitaprajna — the wisdom that does not "
            "shake."
        ),
        "icon_name": "peace",
        "color_theme": "#F97316",
    },
    "lobha": {
        "title_root": "From Greed to Generosity",
        "title_subtitles": {
            14: "The Giving Path",
            30: "Santosha — Enough is Abundance",
            42: "Aparigraha — The Vow of Non-Grasping",
            60: "Dana as a Way of Life",
        },
        "description": (
            "The Gita teaches that wealth that is grasped becomes a cage; "
            "wealth that is offered becomes a wing. Across this journey you "
            "exchange the scarcity script for santosha (contentment), "
            "aparigraha (non-grasping), and dana (sacred giving) — until "
            "generosity is no longer an act but a temperament."
        ),
        "icon_name": "gift",
        "color_theme": "#22C55E",
    },
    "moha": {
        "title_root": "Clarity Through Wisdom",
        "title_subtitles": {
            14: "Dispelling Illusion",
            30: "The Practice of Viveka",
            42: "Breaking Free from Illusion",
            60: "Jnana — Knowing the Self",
        },
        "description": (
            "Moha is the fog that makes the unreal look real. The Gita's "
            "antidote is viveka — the discrimination between the eternal and "
            "the passing — and jnana, the direct knowledge of the Self. Each "
            "day refines that lens until decisions arise from clarity, not "
            "from the lens of personal craving."
        ),
        "icon_name": "eye",
        "color_theme": "#8B5CF6",
    },
    "mada": {
        "title_root": "The Humble Path",
        "title_subtitles": {
            14: "Releasing Ego",
            30: "Vinaya — The Strength of Humility",
            42: "Seva — Service as Medicine",
            60: "Bhakti — Confident Surrender",
        },
        "description": (
            "Pride builds a fortress; humility builds a temple. Across this "
            "journey you learn vinaya (humility), seva (service), and finally "
            "bhakti — the surrender that does not weaken the self but reveals "
            "the deeper Self the Gita calls Ātman. Strength here is the "
            "willingness to be taught, helped, and changed."
        ),
        "icon_name": "bow",
        "color_theme": "#06B6D4",
    },
    "matsarya": {
        "title_root": "Celebrating Others' Joy",
        "title_subtitles": {
            14: "Beyond Envy",
            30: "Mudita — Sympathetic Joy",
            42: "Maitri — The Friendly Heart",
            60: "Samadrishti — Equal Vision",
        },
        "description": (
            "Envy is the suffering caused by another's joy. The Gita's medicine "
            "is mudita (joy in others' joy), maitri (friendliness toward all "
            "beings), and ultimately samadrishti — the equal vision that sees "
            "the same Self in every face. This journey trains those muscles "
            "until another's win is felt as your own."
        ),
        "icon_name": "celebrate",
        "color_theme": "#EC4899",
    },
}

# Difficulty + monetization grade per duration. The 14-day variants are the
# free entry point; the deeper journeys are paid because they demand more
# guided support.
_DURATION_GRADE: dict[int, dict[str, Any]] = {
    14: {"difficulty": 3, "is_featured": True,  "is_free": True},
    30: {"difficulty": 4, "is_featured": True,  "is_free": False},
    42: {"difficulty": 4, "is_featured": False, "is_free": False},
    60: {"difficulty": 5, "is_featured": False, "is_free": False},
}

_DURATIONS = (14, 30, 42, 60)


def _build_rich_templates() -> list[dict]:
    """Build the 24-template enemy × duration grid + the combined journey.

    Slugs follow the convention `<title-root-kebab>-<days>d` so the runtime
    template-generator and the seed catalog stay aligned.
    """
    grid: list[dict] = []
    for enemy_tag, meta in _ENEMY_TEMPLATE_META.items():
        title_root_kebab = meta["title_root"].lower().replace(" ", "-").replace("'", "")
        for days in _DURATIONS:
            grade = _DURATION_GRADE[days]
            subtitle = meta["title_subtitles"][days]
            grid.append({
                "slug": f"{title_root_kebab}-{days}d",
                "title": f"{meta['title_root']} — {subtitle}",
                "description": meta["description"],
                "primary_enemy_tags": [enemy_tag],
                "duration_days": days,
                "difficulty": grade["difficulty"],
                "is_active": True,
                "is_featured": grade["is_featured"],
                "is_free": grade["is_free"],
                "icon_name": meta["icon_name"],
                "color_theme": meta["color_theme"],
            })

    # Combined journey — one week per enemy across 42 days.
    grid.append({
        "slug": "conquer-all-six-enemies-42d",
        "title": "Conquer All Six Enemies — The Complete Transformation",
        "description": (
            "The full Sad-Ripu pilgrimage. One week with each inner enemy in "
            "turn, walking from kāma to mātsarya through the Gita's complete "
            "moral curriculum. Pairs each day with two modern mirrors and "
            "both Sanatan and secular practices."
        ),
        "primary_enemy_tags": ["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        "duration_days": 42,
        "difficulty": 5,
        "is_active": True,
        "is_featured": True,
        "is_free": False,
        "icon_name": "crown",
        "color_theme": "#6366F1",
    })

    return grid


RICH_TEMPLATES: list[dict] = _build_rich_templates()

# All templates seeded on backend startup — fallback rows first so their
# slugs are always present for the frontend offline catalog.
ALL_TEMPLATES: list[dict] = FALLBACK_TEMPLATES + RICH_TEMPLATES


# ===========================================================================
# Gurukool 5-stage pedagogy — each daily step traces a movement from
# listening, through contemplation, into embodied practice, into action,
# and finally into the witness consciousness that is the goal of all yoga.
# ===========================================================================

_GURUKOOL_STAGES: dict[str, dict[str, str]] = {
    "shravana": {
        "name_sa": "Śravaṇa",
        "name_en": "Listening",
        "intent": (
            "Sit at the teacher's feet. Receive the śloka and the teaching "
            "as if for the first time. Do not yet argue, judge, or apply — "
            "only listen until the words settle into the heart."
        ),
    },
    "manana": {
        "name_sa": "Manana",
        "name_en": "Contemplation",
        "intent": (
            "Now bring the doubt-mind. Question the teaching against your own "
            "lived experience. Where does it ring true? Where does it ache? "
            "Manana is the honest reasoning that earns the right to practice."
        ),
    },
    "nididhyasana": {
        "name_sa": "Nididhyāsana",
        "name_en": "Meditative Embodiment",
        "intent": (
            "Move from knowing to being. Take the verse into breath, mantra, "
            "or steady gaze. Let the teaching become a felt sense in the body, "
            "not just an idea in the mind."
        ),
    },
    "anushthana": {
        "name_sa": "Anuṣṭhāna",
        "name_en": "Action in the World",
        "intent": (
            "The teaching now meets your day. Two practices are offered: "
            "a Sanatan (yogic / dharmic) action drawn from the Gita's own "
            "toolkit, and a secular counterpart that any worldview can "
            "honor. Choose one — or weave both."
        ),
    },
    "sakshi_bhava": {
        "name_sa": "Sākṣi-bhāva",
        "name_en": "The Witness",
        "intent": (
            "At day's end, become the witness of the day itself. Who was "
            "the one practicing? Who watches the watcher? The Gita's final "
            "promise is not a better self, but the still Self that was here "
            "all along."
        ),
    },
}


# Map the journey's 5-phase arc (awakening → mastery) onto the Gurukool
# stages, so a 14-day or 60-day journey both walk the same five-fold path
# proportionally.
_PHASE_TO_GURUKOOL: dict[str, str] = {
    "awakening":     "shravana",
    "understanding": "manana",
    "practice":      "nididhyasana",
    "integration":   "anushthana",
    "mastery":       "sakshi_bhava",
}


# ===========================================================================
# Dharmic anchors — for each enemy, the Sanskrit virtue that is its antidote,
# the dharmic value the journey instills, and the moral principle from the
# Gita that frames every day's contemplation. These are the unchanging
# spine; the modern examples are the rotating flesh.
# ===========================================================================

_ENEMY_DHARMA: dict[str, dict[str, str]] = {
    "kama": {
        "sanskrit_virtue": "Santosha (contentment)",
        "dharmic_value":   "Aparigraha — non-grasping",
        "moral_principle": (
            "Krishna teaches that desire, born of rajas, is the all-devouring "
            "enemy here (BG 3.37). The remedy is not suppression but viveka — "
            "the discriminative wisdom that sees the want for what it is, and "
            "rests in the sufficiency of what already is."
        ),
        "deepening_call": (
            "Today you are not asked to renounce desire by force. You are "
            "asked to befriend the wanting mind long enough to see what it "
            "really wants — which is never the next object, but the peace "
            "the next object falsely promises."
        ),
    },
    "krodha": {
        "sanskrit_virtue": "Kshama (forgiveness as strength)",
        "dharmic_value":   "Shanti — the unshaken peace",
        "moral_principle": (
            "Krishna names the chain of destruction precisely (BG 2.62-63): "
            "dwelling on objects breeds attachment, attachment breeds desire, "
            "desire breeds anger, anger breeds delusion, delusion destroys "
            "memory, and the loss of discriminative intelligence is the "
            "perishing of the person. Today you intercept that chain at its "
            "first link."
        ),
        "deepening_call": (
            "Anger is not your enemy; it is messenger. Beneath every anger "
            "is a value being threatened. Honor the message, refuse the "
            "fire. The strong are not those who never burn — they are those "
            "who do not let the burning become the speaking."
        ),
    },
    "lobha": {
        "sanskrit_virtue": "Dāna (sacred giving)",
        "dharmic_value":   "Tyāga — renunciation of the fruits of action",
        "moral_principle": (
            "Krishna teaches nishkama-karma (BG 2.47) — you have a right to "
            "the work, never to its fruits. Lobha is the mind that has "
            "reversed this: it grasps the fruit and forgets the work. The "
            "antidote is dāna — the practice of giving, which dissolves the "
            "illusion of separate ownership."
        ),
        "deepening_call": (
            "Test your wealth today by what flows through you, not by what "
            "stops with you. The Gita is unsentimental: that which is "
            "hoarded out of fear becomes the fear itself. Generosity is "
            "the only proof that you trust the universe."
        ),
    },
    "moha": {
        "sanskrit_virtue": "Viveka (discernment)",
        "dharmic_value":   "Vairagya — sacred dispassion",
        "moral_principle": (
            "The whole Gita opens with Arjuna's moha — a confusion so deep "
            "that duty itself becomes invisible. Krishna's answer (BG 2.11 "
            "onward) is jnana, the knowledge of the deathless Self, and "
            "viveka, the moment-by-moment discrimination between the real "
            "and the passing."
        ),
        "deepening_call": (
            "Today the practice is not certainty but clarity. Notice where "
            "the lens of liking and disliking is doing the seeing for you. "
            "Wipe it. The Gita's promise is not that the fog will never "
            "return; it is that you will learn, again and again, to clear it."
        ),
    },
    "mada": {
        "sanskrit_virtue": "Vinaya (humility)",
        "dharmic_value":   "Sevā — service without self-display",
        "moral_principle": (
            "Krishna lists arrogance, conceit, anger, and harshness among "
            "the demonic qualities (BG 16.4). Their cure is taught in BG 4.34: "
            "learn by humble approach, by inquiry, by service to the wise. "
            "Mada is the wall that keeps wisdom out; vinaya is the door."
        ),
        "deepening_call": (
            "The Gita's strongest figures — Arjuna, Krishna, even Bhishma — "
            "are great because they could be taught. Greatness in the "
            "dharmic tradition is never the refusal to be changed; it is "
            "the unending readiness to be re-taught."
        ),
    },
    "matsarya": {
        "sanskrit_virtue": "Muditā (sympathetic joy)",
        "dharmic_value":   "Maitrī — friendliness to all beings",
        "moral_principle": (
            "Krishna names as dearest the devotee who is free from envy, "
            "friendly and compassionate to all, free from possessiveness "
            "and ego (BG 12.13). Mātsarya is the suffering of believing "
            "another's joy diminishes your own; muditā is the medicine "
            "that proves it does not."
        ),
        "deepening_call": (
            "Today's practice is athletic, not abstract. You will train the "
            "muscle of muditā the way one trains any muscle — by lifting it "
            "deliberately, repeatedly, even when it aches. Each celebration "
            "of another's joy reshapes the heart toward its native "
            "equanimity."
        ),
    },
}


# ===========================================================================
# Per-enemy step content — the unchanging arc of the journey, deepened so
# that every day rests on a real Gita teaching, a Sanskrit value, and a
# real-world application drawn from the Wisdom Core.
# ===========================================================================

_ENEMY_STEP_CONTENT: dict[str, dict] = {
    "kama": {
        "titles": {
            "awakening":     "Recognizing Desire's Pull",
            "understanding": "The Root of Craving",
            "practice":      "Cultivating Contentment",
            "integration":   "Freedom from Attachment",
            "mastery":       "Living in Sufficiency",
        },
        "teachings": {
            "awakening": (
                "Listen, without yet trying to change anything. Watch the "
                "wanting mind arise. Krishna calls it the all-devouring "
                "enemy (BG 3.37) — not because wanting is sinful, but "
                "because it is bottomless when fed and luminous when seen."
            ),
            "understanding": (
                "Now question. What is the desire really asking for? "
                "Beneath the object — the scroll, the swipe, the haul — "
                "what unmet need has dressed itself in this craving? "
                "Manana means you have permission to doubt the desire's "
                "story."
            ),
            "practice": (
                "Move from idea to body. Each time desire arises today, "
                "place the breath between the urge and the action. The "
                "Gita's word is sthairyam — steadiness — and it is built "
                "one paused breath at a time."
            ),
            "integration": (
                "Carry the practice into ordinary acts. Eat, work, scroll, "
                "love — and let contentment, not consumption, be the test. "
                "Vairagya is not the absence of desire; it is the absence "
                "of the desire's dictatorship."
            ),
            "mastery": (
                "Witness now. Who is the one who wanted? Who is the one "
                "who is, today, no longer ruled by the want? The Gita "
                "promises that the witness is not a better you — it is "
                "the unchanging Self the wanting was always orbiting."
            ),
        },
        "reflection": "What desire arose today? If it were fulfilled this moment, what would still be missing?",
        "practice":   "When desire arises, take three slow breaths and ask: 'Is this a true need, or the wanting wearing a costume?'",
        "verse_tags": ["desire", "craving", "detachment", "contentment"],
        "day1_verse": {"chapter": 3, "verse": 37},
    },
    "krodha": {
        "titles": {
            "awakening":     "The Fire Within",
            "understanding": "Anger's Hidden Message",
            "practice":      "The Sacred Pause",
            "integration":   "Transforming Fire to Light",
            "mastery":       "Equanimity in Action",
        },
        "teachings": {
            "awakening": (
                "Today you do not judge the anger — you listen to it. "
                "Krishna does not call anger weakness; he calls it the "
                "second link in a chain that ends in the loss of "
                "discriminative intelligence (BG 2.63). To listen is to "
                "interrupt the chain at the link where you still have power."
            ),
            "understanding": (
                "Now ask what value the anger is defending. Anger is "
                "always information. Beneath every flare is a boundary, "
                "a grief, or an injustice asking to be named. Without "
                "this manana the same anger will return tomorrow under "
                "another name."
            ),
            "practice": (
                "Drop the contemplation into the body. Long exhale longer "
                "than inhale, cold water on the wrists, feet pressed into "
                "the floor — the ancients knew the vāyu (breath) is the "
                "fastest route to shanti. This is nididhyāsana made "
                "physical."
            ),
            "integration": (
                "The fire is not extinguished; it is redirected. Speak the "
                "boundary, write the email, set the limit — but without the "
                "burning. This is what Krishna means by acting from the "
                "buddhi (BG 2.39), not from the agitated mind."
            ),
            "mastery": (
                "Witness even the absence of anger. Sthitaprajna — the "
                "sage of steady wisdom (BG 2.55-72) — is not the one who "
                "never feels heat. They are the one in whom the heat "
                "no longer steers."
            ),
        },
        "reflection": "When did anger arise today? What value was it defending — and how could that value have been honored without the fire?",
        "practice":   "When anger flares, press the soles of your feet into the ground, exhale four counts longer than you inhale, and do not speak for the length of five breaths.",
        "verse_tags": ["anger", "peace", "patience", "equanimity"],
        "day1_verse": {"chapter": 2, "verse": 63},
        "safety_note": (
            "If the anger is rising toward another person or yourself, "
            "ground first — feet on floor, cold water, long exhale — "
            "before reflecting or messaging. The Gita honors the body."
        ),
        "safety_days": 3,
    },
    "lobha": {
        "titles": {
            "awakening":     "The Hunger for More",
            "understanding": "Why Enough is Never Enough",
            "practice":      "The Art of Appreciation",
            "integration":   "Giving as Liberation",
            "mastery":       "Abundance in Simplicity",
        },
        "teachings": {
            "awakening": (
                "Watch the accumulating mind today. Cart, saved-posts, "
                "wishlist, portfolio — wherever the 'just a little more' "
                "voice lives. The Gita is unsentimental about lobha: it is "
                "rajas-born (BG 14.17) and feeds on itself."
            ),
            "understanding": (
                "Question the scarcity story. What inner emptiness is the "
                "next acquisition supposed to fill? Lobha is rarely about "
                "the object; it is about the imagined self the object would "
                "make real. Manana lets you meet that self without buying it."
            ),
            "practice": (
                "Gratitude is the felt sense of santosha. Before the next "
                "purchase, before the next portfolio check, name three "
                "things already given to you that you did not earn. Let the "
                "breath rest there until the grasping unclasps."
            ),
            "integration": (
                "Now act. Give one thing away today — money, time, "
                "attention, an object — without keeping score. The Gita "
                "calls this dāna (BG 17.20). It is not charity; it is the "
                "proof that you are not owned by what you own."
            ),
            "mastery": (
                "Become the witness of abundance. Aparigraha is not "
                "poverty — it is the recognition that nothing was ever "
                "yours to lose. The wealthiest yogi the Gita knows is the "
                "one whose hands open as easily as they close."
            ),
        },
        "reflection": "Where did 'not enough' speak today? What would have to be true for this moment, exactly as it is, to be already abundant?",
        "practice":   "Name ten things you did not buy that are sustaining your life right now. Then give one thing away — no record, no announcement.",
        "verse_tags": ["greed", "contentment", "generosity", "giving"],
        "day1_verse": {"chapter": 14, "verse": 17},
    },
    "moha": {
        "titles": {
            "awakening":     "The Fog of Confusion",
            "understanding": "What We Mistake for Truth",
            "practice":      "Cultivating Viveka",
            "integration":   "Seeing Clearly",
            "mastery":       "Wisdom in Action",
        },
        "teachings": {
            "awakening": (
                "Arjuna's first state in the Gita is moha (BG 1.46) — a "
                "confusion so complete that even duty becomes invisible. "
                "Today, simply notice the fog. Where do you not actually "
                "know what is true, but are acting as if you do?"
            ),
            "understanding": (
                "Now question the attachments that make the fog. Moha is "
                "not stupidity; it is the cloud raised by desire and "
                "aversion (BG 7.27). What craving is making you call the "
                "passing eternal, or the eternal disposable?"
            ),
            "practice": (
                "Viveka is a felt practice, not just a thought. Before "
                "decisions today, drop the breath and ask: 'Is this the "
                "real, or the passing?' Krishna trains Arjuna in this "
                "verse by verse (BG 2.11-30). You are training the same "
                "muscle."
            ),
            "integration": (
                "Act now from clarity, not from confusion. Even small "
                "actions — what to eat, what to read, whom to message — "
                "become rehearsals for the larger discrimination. The "
                "Gita calls this buddhi-yoga (BG 2.49)."
            ),
            "mastery": (
                "Witness the witness. The fog will return; the one who "
                "sees the fog does not. Jnana, the Gita's deepest "
                "promise, is not an idea — it is the steady recognition "
                "that you are not the cloud but the sky."
            ),
        },
        "reflection": "Where did liking or disliking do the seeing for you today? What did the day look like once you wiped the lens?",
        "practice":   "Before any meaningful decision today, name one thing about the situation that is eternal and one thing that is passing. Act from the first.",
        "verse_tags": ["delusion", "clarity", "wisdom", "discernment"],
        "day1_verse": {"chapter": 2, "verse": 52},
        "safety_note": (
            "Viveka practice can surface grief over old illusions. Treat "
            "this gently — the breaking of a delusion is a small "
            "bereavement, and the Gita honors the slow heart."
        ),
        "safety_phase": "integration",
    },
    "mada": {
        "titles": {
            "awakening":     "The Shield of Pride",
            "understanding": "What Ego Protects",
            "practice":      "The Strength of Humility",
            "integration":   "Service as Medicine",
            "mastery":       "Confident Surrender",
        },
        "teachings": {
            "awakening": (
                "Today you do not attack the ego — you watch it work. "
                "Mada is the inflated 'I' that thinks itself the doer "
                "(BG 3.27). To see it operate without identifying with it "
                "is the first step of vinaya."
            ),
            "understanding": (
                "Ask what the pride is protecting. Beneath every "
                "arrogance is a vulnerability that is afraid to be seen. "
                "Krishna's path is not to shame this — it is to make the "
                "vulnerability holy, so the pride is no longer needed."
            ),
            "practice": (
                "Today ask one person for help. Notice the inner flinch. "
                "Stay with it. Krishna's instruction (BG 4.34) is "
                "explicit: learn by humble approach, by inquiry, by "
                "service. The flinch is the doorway."
            ),
            "integration": (
                "Serve without telling anyone. Sevā done in secret "
                "(BG 17.20) starves the part of the ego that needed the "
                "audience, and feeds the Self that does not. This is the "
                "deepest re-routing of mada."
            ),
            "mastery": (
                "Surrender, but not as weakness. Bhakti — the surrender "
                "Krishna unfolds in BG 18.65-66 — is the strength of the "
                "one who no longer needs to be right. The truly humble "
                "are the unbreakable."
            ),
        },
        "reflection": "Where did the 'I am the doer' arise today? What part of you needed to be seen as the one who did it — and what was that part afraid of?",
        "practice":   "Ask one person for help with something small today, and do one quiet act of service nobody will ever know about.",
        "verse_tags": ["pride", "ego", "humility", "surrender"],
        "day1_verse": {"chapter": 16, "verse": 4},
    },
    "matsarya": {
        "titles": {
            "awakening":     "The Pain of Comparison",
            "understanding": "What Envy Reveals",
            "practice":      "Muditā — Sympathetic Joy",
            "integration":   "Celebrating Others",
            "mastery":       "One in All",
        },
        "teachings": {
            "awakening": (
                "Watch the comparing mind. Envy is information; do not "
                "shame it, do not act on it — just notice the moment it "
                "rises. Krishna names freedom from envy as the mark of "
                "the dearest devotee (BG 12.13). That mark is built, not "
                "born."
            ),
            "understanding": (
                "Now read the message. Envy points always at an "
                "unspoken desire of your own. What does their life mirror "
                "back to you about what you actually want? Manana turns "
                "envy from a wound into a map."
            ),
            "practice": (
                "Muditā is athletic. Today, deliberately and out loud, "
                "celebrate three wins that are not yours. Watch the "
                "heart resist; watch it then expand. This is the felt "
                "training of maitrī."
            ),
            "integration": (
                "Act now from the friendly heart. Send the message you "
                "would have envied sending. Show up for someone whose "
                "shine you have been measuring yourself against. The "
                "Gita's promise is real: another's joy can become your "
                "rest."
            ),
            "mastery": (
                "Witness samadrishti — the equal vision (BG 6.32). When "
                "the same Self looks out of every face, comparison loses "
                "its grammar. Their success is yours; yours is theirs; "
                "the celebration is one."
            ),
        },
        "reflection": "Whose joy was hardest to share today? What does that show you about what your own heart is still waiting for?",
        "practice":   "Choose one person whose success has been a quiet ache. Send them a sincere, specific congratulation today — and notice the inside of the sending.",
        "verse_tags": ["envy", "jealousy", "joy", "compassion"],
        "day1_verse": {"chapter": 12, "verse": 13},
    },
}


# ===========================================================================
# Wisdom Core integration — Dynamic (ModernExamplesDB) + Static (verses)
# ===========================================================================
#
# Two complementary Wisdom Core sources feed every day of every journey:
#
#   * Dynamic Wisdom Core — ModernExamplesDB: curated real-life scenarios
#     with anchoring Gita verse refs, secular antidotes, and Sanatan
#     practices. Provides the day's "modern mirror".
#
#   * Static Wisdom Core  — the 701-verse corpus shipped at
#     data/gita/gita_verses_complete.json. Provides the actual śloka
#     text (Sanskrit, transliteration, English, principle, theme) for
#     every verse referenced by the day. We load it directly here
#     (not via gita_ai_analyzer.GitaWisdomCore) so the seed has no
#     dependency on the provider_manager / redis import chain — the
#     seed must succeed even when no AI provider is configured.
#
# Together they let each seeded day carry the genuine śloka the user
# reads on screen — not just a pointer — so the day stays meaningful
# even if the runtime verse-hydration path is briefly unavailable.

_EXAMPLES_DB_SINGLETON = None
_STATIC_WISDOM_INDEX: dict[str, dict[str, Any]] | None = None


def _get_modern_examples_db():
    """Return the singleton ModernExamplesDB instance — the Dynamic Wisdom Core."""
    global _EXAMPLES_DB_SINGLETON
    if _EXAMPLES_DB_SINGLETON is None:
        from backend.services.journey_engine.modern_examples import ModernExamplesDB

        _EXAMPLES_DB_SINGLETON = ModernExamplesDB()
    return _EXAMPLES_DB_SINGLETON


def _load_static_wisdom_core() -> dict[str, dict[str, Any]]:
    """Load the 701-verse corpus and index it by 'C.V' for O(1) lookup.

    The corpus is the same file consumed by ``GitaWisdomCore`` in
    backend/services/gita_ai_analyzer.py — we read it directly to avoid
    pulling in that module's heavyweight dependencies (the OpenAI
    provider manager and the Redis cache layer) at seed time. Returns an
    empty dict if the file is missing so the seed degrades gracefully.
    """
    global _STATIC_WISDOM_INDEX
    if _STATIC_WISDOM_INDEX is not None:
        return _STATIC_WISDOM_INDEX

    import json
    from pathlib import Path

    index: dict[str, dict[str, Any]] = {}
    gita_path = (
        Path(__file__).resolve().parent.parent.parent
        / "data" / "gita" / "gita_verses_complete.json"
    )
    try:
        if gita_path.exists():
            with open(gita_path, "r", encoding="utf-8") as f:
                verses = json.load(f)
            for verse in verses:
                chapter = verse.get("chapter")
                verse_num = verse.get("verse")
                if chapter is not None and verse_num is not None:
                    index[f"{chapter}.{verse_num}"] = verse
            print(
                f"📜 Static Wisdom Core loaded: {len(index)} verses from "
                f"{gita_path.name}"
            )
        else:
            print(
                f"⚠️  Static Wisdom Core not found at {gita_path} — seed will "
                "store verse refs only; runtime will hydrate text."
            )
    except Exception as exc:
        print(f"⚠️  Static Wisdom Core load failed: {exc} — refs only.")

    _STATIC_WISDOM_INDEX = index
    return index


def _hydrate_verse(verse_ref: dict[str, int] | None) -> dict[str, Any] | None:
    """Look up a verse by ``{chapter, verse}`` ref in the Static Wisdom Core.

    Returns the full verse dict (sanskrit, transliteration, english,
    principle, theme, mental_health_applications) or ``None`` when the
    ref isn't found / the corpus isn't loaded. Callers must handle the
    None case so a missing verse never breaks the seed.
    """
    if not verse_ref:
        return None
    chapter = verse_ref.get("chapter")
    verse_num = verse_ref.get("verse")
    if chapter is None or verse_num is None:
        return None
    return _load_static_wisdom_core().get(f"{chapter}.{verse_num}")


def _format_verse_block(verse_ref: dict[str, int] | None, label: str = "Today's śloka") -> str:
    """Render a Static-Wisdom-Core verse as a block of teaching text.

    Falls back to just the ref + label when the corpus isn't available,
    so a missing verses file never prevents the day from rendering.
    """
    if not verse_ref:
        return ""
    chapter = verse_ref.get("chapter")
    verse_num = verse_ref.get("verse")
    ref_label = f"BG {chapter}.{verse_num}"

    verse = _hydrate_verse(verse_ref)
    if not verse:
        return f"{label} ({ref_label}) — verse text will appear when you open the day."

    lines: list[str] = [f"{label} — {ref_label}"]
    sanskrit = (verse.get("sanskrit") or "").strip()
    transliteration = (verse.get("transliteration") or "").strip()
    english = (verse.get("english") or "").strip()
    principle = (verse.get("principle") or "").strip()
    theme = (verse.get("theme") or "").strip()

    if sanskrit:
        # Keep just the verse couplet — strip any speaker prefix bookkeeping.
        lines.append("")
        lines.append("Sanskrit:")
        lines.append(sanskrit)
    if transliteration:
        lines.append("")
        lines.append("Transliteration:")
        lines.append(transliteration)
    if english:
        lines.append("")
        lines.append("English:")
        lines.append(english)
    if principle:
        lines.append("")
        lines.append(f"Principle: {principle}")
    if theme:
        lines.append(f"Theme: {theme.replace('_', ' ').title()}")
    return "\n".join(lines)


def _pick_two_modern_examples(enemy_tag: str, day: int) -> list[Any]:
    """Deterministically pick TWO modern examples for (enemy, day).

    The first example is drawn from the timeless general bank; the second
    is drawn from the Gen-Z bank when available, so every day pairs an
    ageless mirror with a contemporary one. Falls back gracefully if
    either subcorpus is unavailable.
    """
    try:
        db = _get_modern_examples_db()
        all_for_enemy = db.get_examples(enemy_tag)
    except Exception:
        return []
    if not all_for_enemy:
        return []

    general = [ex for ex in all_for_enemy if getattr(ex, "generation", "general") != "gen_z"]
    gen_z = [ex for ex in all_for_enemy if getattr(ex, "generation", "general") == "gen_z"]

    chosen: list[Any] = []
    if general:
        chosen.append(general[(day - 1) % len(general)])
    if gen_z:
        chosen.append(gen_z[(day - 1) % len(gen_z)])

    # Backfill from the full list if one subcorpus is empty.
    if len(chosen) < 2 and len(all_for_enemy) > 0:
        backfill_idx = (day - 1 + len(chosen)) % len(all_for_enemy)
        candidate = all_for_enemy[backfill_idx]
        if candidate not in chosen:
            chosen.append(candidate)

    return chosen[:2]


# ===========================================================================
# Step composition — Gurukool 5-stage rendering of a single day.
# ===========================================================================

def _format_step_title(day: int, enemy_tag: str, phase: str, content: dict) -> str:
    return (
        f"Day {day} · {content['titles'].get(phase, 'Walking the Path')}"
    )


def _format_teaching(
    day: int,
    enemy_tag: str,
    phase: str,
    content: dict,
    examples: list[Any],
    day_verse_ref: dict[str, int] | None = None,
) -> str:
    """Compose the day's teaching prose.

    Critical scope note — what NOT to put here
    ------------------------------------------
    The mobile renderer (app/(mobile)/m/journeys/[id]/page.tsx) already
    surfaces three things in their own dedicated UI cards:

      * The verse card — rendered from the flattened sacred fields
        (verse_sanskrit / verse_transliteration / verse_translation),
        which the runtime hydrates from the Static Wisdom Core via
        ``_step_to_response`` in routes/journey_engine.py.
      * The modern-example card — rendered from ``step.modern_example``,
        populated by ``_pick_modern_example`` in the same route.
      * The reflection list and practice list — rendered from
        ``step.guided_reflection`` and ``step.practice.instructions``.

    Embedding the Sanskrit verse or modern-mirror scenarios inside the
    teaching text would therefore duplicate content the user already sees
    in dedicated cards. We keep this field focused on the *teaching prose*
    — the Gurukool stage opener, the Sanskrit virtue + dharmic value, the
    moral principle, the phase deepening, and the witness call.

    Paragraphs are separated by a blank line; the mobile <p> renders them
    with ``whiteSpace: 'pre-line'`` so blank-line breaks survive.
    """
    stage_key = _PHASE_TO_GURUKOOL.get(phase, "shravana")
    stage = _GURUKOOL_STAGES[stage_key]
    dharma = _ENEMY_DHARMA[enemy_tag]
    phase_teaching = content["teachings"].get(phase, "Continue your contemplation.")

    parts: list[str] = []
    parts.append(f"Gurukool stage — {stage['name_sa']} ({stage['name_en']})")
    parts.append(stage["intent"])
    parts.append("")
    parts.append(f"Sanskrit virtue of the day: {dharma['sanskrit_virtue']}")
    parts.append(f"Dharmic value: {dharma['dharmic_value']}")
    parts.append("")
    parts.append("Moral principle (from the Gita):")
    parts.append(dharma["moral_principle"])
    parts.append("")
    parts.append("Today's deepening:")
    parts.append(phase_teaching)
    parts.append("")
    parts.append(dharma["deepening_call"])

    return "\n".join(parts)


# PRACTICE_DELIM / REFLECTION_DELIM are exported so the runtime path in
# journey_engine_service._generate_step_content can split these multi-item
# fields back into the LIST shape the StepResponse contract requires.
# The double newline never appears inside a single instruction or question
# (those use single newlines if needed), so the split is unambiguous.
ITEM_DELIM = "\n\n"


def _format_practice(
    day: int, enemy_tag: str, phase: str, content: dict, examples: list[Any]
) -> str:
    """Compose secular + Sanatan practices as ITEM_DELIM-separated entries.

    Each entry becomes one bullet in the mobile renderer's practice list
    (``step.practice.instructions``). The runtime path
    ``_generate_step_content`` splits this field on ITEM_DELIM.
    """
    items: list[str] = []
    # The base phase practice is always the first instruction.
    items.append(f"Secular path — {content['practice']}")

    if examples:
        # One bullet per modern-example antidote so the list reads cleanly.
        for ex in examples:
            antidote = (ex.practical_antidote or "").strip()
            if not antidote:
                continue
            label = "Gen Z antidote" if getattr(ex, "generation", "general") == "gen_z" else "Timeless antidote"
            items.append(f"{label} — {antidote}")

        # Each Sanatan practice gets its own bullet too — distinct from the
        # secular ones so the user can choose by inclination, not have to
        # parse a paragraph.
        for ex in examples:
            sanatan = (getattr(ex, "sanatan_practice", "") or "").strip()
            if sanatan:
                items.append(f"Sanatan path — {sanatan}")

    return ITEM_DELIM.join(items)


def _format_reflection(
    day: int, enemy_tag: str, phase: str, content: dict, examples: list[Any]
) -> str:
    """Compose the day's reflection as ITEM_DELIM-separated questions.

    The runtime path splits this on ITEM_DELIM into the
    ``guided_reflection`` string list so the mobile renderer can show
    each question as its own numbered bullet. The Sākṣi-bhāva witness
    closer always comes last so the day ends in silence, not in another
    question.
    """
    items: list[str] = []
    items.append((content["reflection"] or "").strip())
    for ex in examples:
        q = (ex.reflection_question or "").strip()
        if q:
            items.append(q)
    items.append(
        "Sākṣi-bhāva — who was the one asking these questions? "
        "Notice that One, and let the noticing be tonight's silence."
    )
    return ITEM_DELIM.join([it for it in items if it])


def _select_static_verse_ref(
    day: int, enemy_tag: str, content: dict, examples: list[Any]
) -> list[dict[str, int]] | None:
    """Anchor verses for the day, drawn from the Static Wisdom Core.

    On day 1, the canonical enemy verse always opens the journey. On every
    day we also include every example's verse so a single day exposes the
    student to multiple complementary ślokas — one for the timeless
    mirror, one for the Gen-Z mirror. De-duplicated by (chapter, verse)
    so the list never repeats itself.
    """
    refs: list[dict[str, int]] = []
    seen: set[tuple[int, int]] = set()

    def _add(ref: dict[str, int] | None) -> None:
        if not ref:
            return
        chapter = ref.get("chapter")
        verse = ref.get("verse")
        if chapter is None or verse is None:
            return
        key = (chapter, verse)
        if key in seen:
            return
        refs.append({"chapter": chapter, "verse": verse})
        seen.add(key)

    if day == 1:
        _add(content.get("day1_verse"))
    for ex in examples:
        _add(getattr(ex, "gita_verse_ref", None))
    if not refs:
        _add(content.get("day1_verse"))

    return refs if refs else None


def _get_journey_phase(day: int, total_days: int) -> str:
    """Map a day-index onto the 5-phase Gurukool arc.

    Long journeys (30/42/60 days) walk the same five stages proportionally,
    so a 60-day journey gives roughly 12 days to each stage of Gurukool
    pedagogy. The arc thresholds are inclusive on the upper bound.
    """
    progress = day / total_days
    if progress <= 0.2:
        return "awakening"
    if progress <= 0.4:
        return "understanding"
    if progress <= 0.6:
        return "practice"
    if progress <= 0.8:
        return "integration"
    return "mastery"


def _build_template_steps(
    template_id: str, enemy_tag: str, duration_days: int
) -> list[dict]:
    """Generate Gurukool-structured step dicts for every day of a template."""
    content = _ENEMY_STEP_CONTENT[enemy_tag]
    steps: list[dict] = []
    for day in range(1, duration_days + 1):
        phase = _get_journey_phase(day, duration_days)

        safety_notes = None
        if "safety_days" in content and day <= content["safety_days"]:
            safety_notes = content.get("safety_note")
        elif "safety_phase" in content and phase == content["safety_phase"]:
            safety_notes = content.get("safety_note")

        examples = _pick_two_modern_examples(enemy_tag, day)
        static_verse_refs = _select_static_verse_ref(day, enemy_tag, content, examples)
        # Pass the day's primary verse ref through to the teaching formatter
        # so the Static Wisdom Core hydration can embed the actual śloka.
        # The prominently rendered śloka rotates across the day's verse
        # refs so a 60-day journey walks many ślokas instead of repeating
        # the same opening one. Day 1 is anchored to the canonical verse
        # (always at index 0); subsequent days walk the remaining refs.
        if static_verse_refs:
            day_verse_ref = static_verse_refs[(day - 1) % len(static_verse_refs)] if day != 1 else static_verse_refs[0]
        else:
            day_verse_ref = None

        steps.append({
            "journey_template_id": template_id,
            "day_index": day,
            "step_title": _format_step_title(day, enemy_tag, phase, content),
            "teaching_hint":  _format_teaching(day, enemy_tag, phase, content, examples, day_verse_ref),
            "reflection_prompt": _format_reflection(day, enemy_tag, phase, content, examples),
            "practice_prompt":   _format_practice(day, enemy_tag, phase, content, examples),
            "verse_selector": {
                "tags": content["verse_tags"],
                "max_verses": 2,
                "avoid_recent": 10,
            },
            "static_verse_refs": static_verse_refs,
            "safety_notes": safety_notes,
        })
    return steps


def _build_combined_template_steps(
    template_id: str, enemy_tags: list[str], duration_days: int
) -> list[dict]:
    """Generate steps for the combined all-enemies journey.

    Walks one enemy per week. Each day still composes its content through
    the Gurukool 5-stage rendering for that day's enemy, so the user
    experiences six full Gurukool curricula laid end-to-end across the 42
    days.
    """
    if not enemy_tags:
        return []
    days_per_enemy = max(1, duration_days // len(enemy_tags))
    steps: list[dict] = []
    day = 1
    for enemy_tag in enemy_tags:
        if enemy_tag not in _ENEMY_STEP_CONTENT:
            continue
        content = _ENEMY_STEP_CONTENT[enemy_tag]
        for offset in range(days_per_enemy):
            if day > duration_days:
                break
            phase = _get_journey_phase(offset + 1, days_per_enemy)

            safety_notes = None
            if "safety_days" in content and (offset + 1) <= content["safety_days"]:
                safety_notes = content.get("safety_note")
            elif "safety_phase" in content and phase == content["safety_phase"]:
                safety_notes = content.get("safety_note")

            examples = _pick_two_modern_examples(enemy_tag, offset + 1)
            static_verse_refs = _select_static_verse_ref(offset + 1, enemy_tag, content, examples)
            # The prominently rendered śloka rotates across the day's verse
            # refs so the within-enemy week walks several ślokas. Day 1 of
            # the enemy-week anchors to the canonical verse (index 0);
            # subsequent days rotate through the remaining refs.
            if static_verse_refs:
                within_enemy_day = offset + 1
                if within_enemy_day == 1:
                    day_verse_ref = static_verse_refs[0]
                else:
                    day_verse_ref = static_verse_refs[(within_enemy_day - 1) % len(static_verse_refs)]
            else:
                day_verse_ref = None

            title_phase = content["titles"].get(phase, "Walking the Path")
            steps.append({
                "journey_template_id": template_id,
                "day_index": day,
                "step_title": f"Day {day} · {enemy_tag.title()} · {title_phase}",
                "teaching_hint":     _format_teaching(offset + 1, enemy_tag, phase, content, examples, day_verse_ref),
                "reflection_prompt": _format_reflection(offset + 1, enemy_tag, phase, content, examples),
                "practice_prompt":   _format_practice(offset + 1, enemy_tag, phase, content, examples),
                "verse_selector": {
                    "tags": content["verse_tags"],
                    "max_verses": 2,
                    "avoid_recent": 10,
                },
                "static_verse_refs": static_verse_refs,
                "safety_notes": safety_notes,
            })
            day += 1
    return steps


# ===========================================================================
# Database operations — idempotent UPSERT by slug, soft-delete recovery.
# ===========================================================================

async def seed_journey_template_steps(db: AsyncSession) -> int:
    """Idempotently upsert day-by-day step skeletons for each seeded template."""
    stmt = select(JourneyTemplate).where(JourneyTemplate.deleted_at.is_(None))
    templates = (await db.execute(stmt)).scalars().all()

    count = 0
    for template in templates:
        tags = template.primary_enemy_tags or []
        if not tags:
            continue

        # Combined templates walk a different enemy per week.
        if len(tags) > 1:
            steps_data = _build_combined_template_steps(
                template.id, list(tags), template.duration_days
            )
        else:
            enemy_tag = tags[0]
            if enemy_tag not in _ENEMY_STEP_CONTENT:
                print(f"⚠️  No step content for enemy '{enemy_tag}', skipping {template.slug}")
                continue
            steps_data = _build_template_steps(template.id, enemy_tag, template.duration_days)

        for step_data in steps_data:
            existing_step = (
                await db.execute(
                    select(JourneyTemplateStep).where(
                        JourneyTemplateStep.journey_template_id == template.id,
                        JourneyTemplateStep.day_index == step_data["day_index"],
                        JourneyTemplateStep.deleted_at.is_(None),
                    )
                )
            ).scalars().first()

            if existing_step:
                existing_step.step_title         = step_data["step_title"]
                existing_step.teaching_hint      = step_data["teaching_hint"]
                existing_step.reflection_prompt  = step_data["reflection_prompt"]
                existing_step.practice_prompt    = step_data["practice_prompt"]
                existing_step.verse_selector     = step_data["verse_selector"]
                existing_step.static_verse_refs  = step_data["static_verse_refs"]
                existing_step.safety_notes       = step_data["safety_notes"]
            else:
                db.add(JourneyTemplateStep(id=str(uuid.uuid4()), **step_data))

            count += 1

    await db.commit()
    return count


async def seed_journey_templates(existing_engine: AsyncEngine) -> None:
    """Idempotently upsert the full journey catalog by slug."""
    session_maker = async_sessionmaker(existing_engine, expire_on_commit=False)

    # Ensure tables exist (no-op when migrations already ran).
    async with existing_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_maker() as db:
        created = 0
        updated = 0
        for data in ALL_TEMPLATES:
            stmt = select(JourneyTemplate).where(
                JourneyTemplate.slug == data["slug"]
            )
            existing = (await db.execute(stmt)).scalars().first()

            if existing:
                # Re-surface rows that were soft-deleted in earlier deploys —
                # without this, a wipe followed by a re-seed leaves the
                # catalog filtered out by JourneyEngineService.list_templates,
                # which only returns rows where deleted_at IS NULL.
                existing.deleted_at         = None
                existing.title              = data["title"]
                existing.description        = data["description"]
                existing.primary_enemy_tags = data["primary_enemy_tags"]
                existing.duration_days      = data["duration_days"]
                existing.difficulty         = data["difficulty"]
                existing.is_active          = data["is_active"]
                existing.is_featured        = data["is_featured"]
                existing.is_free            = data["is_free"]
                existing.icon_name          = data["icon_name"]
                existing.color_theme        = data["color_theme"]
                updated += 1
            else:
                # Rich templates intentionally do not pin "id" so PostgreSQL
                # auto-generates a UUID via the model default. Fallback rows
                # do pin "id" to match the frontend offline catalog.
                db.add(JourneyTemplate(**data))
                created += 1

        await db.commit()
        print(
            f"✅ Journey templates seeded: created={created}, updated={updated} "
            f"(total catalog: {len(ALL_TEMPLATES)})"
        )

    # Seed step content (CE-1) with Gurukool 5-stage pedagogy.
    async with session_maker() as db:
        step_count = await seed_journey_template_steps(db)
        print(f"✅ Journey template steps seeded: {step_count} rows")


if __name__ == "__main__":
    import os
    import ssl as _ssl
    from sqlalchemy.ext.asyncio import create_async_engine

    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    connect_args: dict = {}
    if "postgresql" in db_url:
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        connect_args = {"ssl": ctx}

    engine = create_async_engine(db_url, echo=False, connect_args=connect_args)
    try:
        asyncio.run(seed_journey_templates(engine))
    finally:
        asyncio.run(engine.dispose())
