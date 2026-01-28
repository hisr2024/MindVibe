"""
KIAAN Advanced Voice Features - World-Class Divine Voice Technology

This module contains cutting-edge voice features that make KIAAN truly unique:

1. HEALING FREQUENCIES - 432Hz (universal harmony), 528Hz (love/DNA repair)
2. BINAURAL AUDIO - Theta waves for meditation, Alpha for calm focus
3. BREATH SYNCHRONIZATION - Sync speech rhythm to user's breathing
4. HINDU CALENDAR AWARENESS - Festival greetings, auspicious timing
5. PERSONALIZED MANTRAS - Struggle-specific mantra recommendations
6. EMOTIONAL JOURNEY ARC - Guide user from distress to peace
7. WHISPER MODE - Intimate, close-presence voice for deep moments
8. ADAPTIVE SILENCE - Intelligent pauses that honor the moment
9. VOICE PERSONALITY LAYERS - Multiple voice modes for different contexts
10. SPIRITUAL SOUNDSCAPES - Optional ambient sacred sounds

"The voice that heals carries frequencies beyond words."
"""

import logging
import math
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


# =============================================================================
# HEALING FREQUENCIES - Scientific sound healing principles
# =============================================================================

class HealingFrequency(Enum):
    """
    Sacred healing frequencies used in sound therapy.
    These can be subtly embedded in voice synthesis or suggested for background.
    """
    UNIVERSAL_HARMONY = 432      # 432Hz - Natural tuning, universal harmony
    LOVE_FREQUENCY = 528         # 528Hz - "Love frequency", DNA repair
    LIBERATION = 396             # 396Hz - Liberation from fear and guilt
    TRANSFORMATION = 417         # 417Hz - Facilitating change
    MIRACLE = 639                # 639Hz - Connecting relationships
    INTUITION = 741              # 741Hz - Awakening intuition
    SPIRITUAL_ORDER = 852        # 852Hz - Returning to spiritual order
    UNITY = 963                  # 963Hz - Connection to divine/oneness


FREQUENCY_PURPOSES = {
    HealingFrequency.UNIVERSAL_HARMONY: {
        "name": "Universal Harmony",
        "hz": 432,
        "purpose": "Grounding, natural resonance with universe",
        "emotions": ["anxious", "disconnected", "ungrounded"],
        "description": "Aligns with natural vibration of the universe",
    },
    HealingFrequency.LOVE_FREQUENCY: {
        "name": "Love Frequency",
        "hz": 528,
        "purpose": "Heart opening, healing, transformation",
        "emotions": ["sad", "heartbroken", "grieving", "lonely"],
        "description": "Known as the 'miracle tone' for DNA repair and love",
    },
    HealingFrequency.LIBERATION: {
        "name": "Liberation",
        "hz": 396,
        "purpose": "Release fear and guilt",
        "emotions": ["fearful", "guilty", "ashamed"],
        "description": "Liberates from deep-seated fear and guilt patterns",
    },
    HealingFrequency.TRANSFORMATION: {
        "name": "Transformation",
        "hz": 417,
        "purpose": "Facilitate positive change",
        "emotions": ["stuck", "resistant", "unable to change"],
        "description": "Clears traumatic experiences and facilitates change",
    },
    HealingFrequency.INTUITION: {
        "name": "Awakening Intuition",
        "hz": 741,
        "purpose": "Clarity and inner knowing",
        "emotions": ["confused", "uncertain", "seeking"],
        "description": "Awakens intuition and self-expression",
    },
    HealingFrequency.UNITY: {
        "name": "Divine Unity",
        "hz": 963,
        "purpose": "Connection to oneness, spiritual awakening",
        "emotions": ["peaceful", "seeking_transcendence", "spiritual"],
        "description": "Connects to highest spiritual state and unity",
    },
}


def recommend_healing_frequency(emotional_state: str) -> Dict[str, Any]:
    """
    Recommend a healing frequency based on emotional state.

    Args:
        emotional_state: User's current emotional state

    Returns:
        Recommended frequency info with usage guidance
    """
    state_lower = emotional_state.lower()

    for freq, info in FREQUENCY_PURPOSES.items():
        if state_lower in info["emotions"]:
            return {
                "frequency": freq,
                "hz": info["hz"],
                "name": info["name"],
                "purpose": info["purpose"],
                "description": info["description"],
                "usage": f"Consider playing {info['hz']}Hz tones softly in background",
            }

    # Default to universal harmony
    default = FREQUENCY_PURPOSES[HealingFrequency.UNIVERSAL_HARMONY]
    return {
        "frequency": HealingFrequency.UNIVERSAL_HARMONY,
        "hz": default["hz"],
        "name": default["name"],
        "purpose": default["purpose"],
        "description": default["description"],
        "usage": "432Hz provides natural grounding for any emotional state",
    }


# =============================================================================
# BINAURAL AUDIO - Brainwave entrainment for meditation states
# =============================================================================

class BrainwaveState(Enum):
    """
    Brainwave states that can be induced through binaural beats.
    """
    DELTA = "delta"         # 0.5-4Hz - Deep sleep, healing
    THETA = "theta"         # 4-8Hz - Deep meditation, REM sleep, creativity
    ALPHA = "alpha"         # 8-13Hz - Relaxed focus, calm alertness
    BETA = "beta"           # 13-30Hz - Active thinking, focus
    GAMMA = "gamma"         # 30-100Hz - Peak awareness, insight


BINAURAL_PRESETS = {
    BrainwaveState.DELTA: {
        "frequency_range": (0.5, 4),
        "target_hz": 2,
        "name": "Deep Healing Sleep",
        "purpose": "Profound rest, physical healing, unconscious processing",
        "best_for": ["insomnia", "physical_healing", "deep_rest"],
        "base_frequency": 100,  # Carrier frequency
        "duration_minutes": 30,
    },
    BrainwaveState.THETA: {
        "frequency_range": (4, 8),
        "target_hz": 6,
        "name": "Deep Meditation",
        "purpose": "Meditation, visualization, spiritual insight",
        "best_for": ["meditation", "anxiety", "spiritual_practice", "creativity"],
        "base_frequency": 200,
        "duration_minutes": 20,
    },
    BrainwaveState.ALPHA: {
        "frequency_range": (8, 13),
        "target_hz": 10,
        "name": "Calm Focus",
        "purpose": "Relaxed alertness, stress reduction, learning",
        "best_for": ["stress", "focus", "learning", "light_meditation"],
        "base_frequency": 200,
        "duration_minutes": 15,
    },
    BrainwaveState.BETA: {
        "frequency_range": (13, 30),
        "target_hz": 18,
        "name": "Active Focus",
        "purpose": "Concentration, problem-solving, active engagement",
        "best_for": ["focus", "work", "problem_solving"],
        "base_frequency": 250,
        "duration_minutes": 25,
    },
    BrainwaveState.GAMMA: {
        "frequency_range": (30, 100),
        "target_hz": 40,
        "name": "Peak Awareness",
        "purpose": "Higher consciousness, insight, peak performance",
        "best_for": ["insight", "peak_experience", "transcendence"],
        "base_frequency": 300,
        "duration_minutes": 10,
    },
}


def recommend_binaural_state(context: str) -> Dict[str, Any]:
    """
    Recommend a brainwave state based on user's needs.

    Args:
        context: What the user needs (meditation, sleep, focus, etc.)

    Returns:
        Binaural preset recommendation
    """
    context_lower = context.lower()

    for state, preset in BINAURAL_PRESETS.items():
        if any(need in context_lower for need in preset["best_for"]):
            return {
                "state": state,
                "preset": preset,
                "recommendation": f"For {context}, I recommend {preset['name']} at {preset['target_hz']}Hz",
            }

    # Default to alpha for general calm
    return {
        "state": BrainwaveState.ALPHA,
        "preset": BINAURAL_PRESETS[BrainwaveState.ALPHA],
        "recommendation": "Alpha waves at 10Hz provide gentle calm and clarity",
    }


# =============================================================================
# BREATH SYNCHRONIZATION - Match speech to breathing rhythm
# =============================================================================

@dataclass
class BreathPattern:
    """Represents a breathing pattern for synchronization."""
    inhale_seconds: float = 4.0
    hold_seconds: float = 4.0
    exhale_seconds: float = 6.0
    rest_seconds: float = 2.0
    name: str = "calming"

    @property
    def total_cycle_seconds(self) -> float:
        return self.inhale_seconds + self.hold_seconds + self.exhale_seconds + self.rest_seconds

    @property
    def breaths_per_minute(self) -> float:
        return 60.0 / self.total_cycle_seconds


# Predefined breath patterns for different purposes
BREATH_PATTERNS = {
    "calming": BreathPattern(
        inhale_seconds=4, hold_seconds=4, exhale_seconds=6, rest_seconds=2,
        name="4-4-6 Calming Breath"
    ),
    "energizing": BreathPattern(
        inhale_seconds=4, hold_seconds=0, exhale_seconds=4, rest_seconds=0,
        name="4-4 Energizing Breath"
    ),
    "box": BreathPattern(
        inhale_seconds=4, hold_seconds=4, exhale_seconds=4, rest_seconds=4,
        name="Box Breathing (4-4-4-4)"
    ),
    "relaxing": BreathPattern(
        inhale_seconds=4, hold_seconds=7, exhale_seconds=8, rest_seconds=0,
        name="4-7-8 Relaxing Breath"
    ),
    "meditation": BreathPattern(
        inhale_seconds=5, hold_seconds=5, exhale_seconds=5, rest_seconds=5,
        name="5-5-5-5 Meditation Breath"
    ),
    "anxiety_relief": BreathPattern(
        inhale_seconds=3, hold_seconds=3, exhale_seconds=6, rest_seconds=3,
        name="Extended Exhale for Anxiety"
    ),
    "sleep": BreathPattern(
        inhale_seconds=4, hold_seconds=7, exhale_seconds=8, rest_seconds=4,
        name="Sleep Induction Breath"
    ),
}


def get_breath_synced_pauses(pattern: BreathPattern, pause_mult: float = 1.0) -> Dict[str, int]:
    """
    Generate SSML pause durations synchronized to breathing pattern.

    Args:
        pattern: Breathing pattern to sync to
        pause_mult: Multiplier for pause durations

    Returns:
        Dictionary of pause durations in milliseconds
    """
    return {
        "inhale_pause": int(pattern.inhale_seconds * 1000 * pause_mult),
        "hold_pause": int(pattern.hold_seconds * 1000 * pause_mult),
        "exhale_pause": int(pattern.exhale_seconds * 1000 * pause_mult),
        "rest_pause": int(pattern.rest_seconds * 1000 * pause_mult),
        "quarter_breath": int(pattern.total_cycle_seconds * 250 * pause_mult),
        "half_breath": int(pattern.total_cycle_seconds * 500 * pause_mult),
    }


def generate_breath_guided_ssml(
    pattern: BreathPattern,
    cycles: int = 3,
    include_counts: bool = True
) -> str:
    """
    Generate SSML for guided breathing synchronized to pattern.

    Args:
        pattern: Breathing pattern
        cycles: Number of breath cycles
        include_counts: Whether to include counting

    Returns:
        SSML-formatted guided breathing
    """
    inhale_ms = int(pattern.inhale_seconds * 1000)
    hold_ms = int(pattern.hold_seconds * 1000)
    exhale_ms = int(pattern.exhale_seconds * 1000)
    rest_ms = int(pattern.rest_seconds * 1000)

    ssml_parts = [f'<break time="500ms"/>Let us breathe together using the {pattern.name} technique.<break time="800ms"/>']

    for cycle in range(1, cycles + 1):
        cycle_ssml = []

        # Inhale
        if include_counts and pattern.inhale_seconds >= 3:
            counts = " ".join([f'<break time="900ms"/>{i}' for i in range(1, int(pattern.inhale_seconds) + 1)])
            cycle_ssml.append(f'<prosody rate="85%" pitch="-1st">Breathe in{counts}</prosody>')
        else:
            cycle_ssml.append(f'<prosody rate="85%" pitch="-1st">Breathe in</prosody><break time="{inhale_ms}ms"/>')

        # Hold (if any)
        if pattern.hold_seconds > 0:
            if include_counts and pattern.hold_seconds >= 3:
                counts = " ".join([f'<break time="900ms"/>{i}' for i in range(1, int(pattern.hold_seconds) + 1)])
                cycle_ssml.append(f'<prosody rate="80%" pitch="-1.5st">Hold{counts}</prosody>')
            else:
                cycle_ssml.append(f'<prosody rate="80%" pitch="-1.5st">Hold</prosody><break time="{hold_ms}ms"/>')

        # Exhale
        if include_counts and pattern.exhale_seconds >= 3:
            counts = " ".join([f'<break time="900ms"/>{i}' for i in range(1, int(pattern.exhale_seconds) + 1)])
            cycle_ssml.append(f'<prosody rate="80%" pitch="-2st">Release{counts}</prosody>')
        else:
            cycle_ssml.append(f'<prosody rate="80%" pitch="-2st">Release slowly</prosody><break time="{exhale_ms}ms"/>')

        # Rest (if any)
        if pattern.rest_seconds > 0:
            cycle_ssml.append(f'<break time="{rest_ms}ms"/>')

        ssml_parts.append("".join(cycle_ssml))

        if cycle < cycles:
            ssml_parts.append('<break time="500ms"/>')

    ssml_parts.append('<break time="800ms"/><prosody rate="85%" pitch="-1st">Beautiful. You are doing wonderfully.</prosody>')

    return "\n".join(ssml_parts)


# =============================================================================
# HINDU CALENDAR AWARENESS - Festival greetings and auspicious timing
# =============================================================================

class HinduMonth(Enum):
    """Hindu lunar months."""
    CHAITRA = "chaitra"
    VAISHAKHA = "vaishakha"
    JYESHTHA = "jyeshtha"
    ASHADHA = "ashadha"
    SHRAVANA = "shravana"
    BHADRAPADA = "bhadrapada"
    ASHWIN = "ashwin"
    KARTIK = "kartik"
    MARGASHIRSHA = "margashirsha"
    PAUSHA = "pausha"
    MAGHA = "magha"
    PHALGUNA = "phalguna"


# Major Hindu festivals with approximate Gregorian dates (varies by year)
HINDU_FESTIVALS = {
    "makar_sankranti": {
        "name": "Makar Sankranti",
        "month": 1, "day": 14,
        "greeting": "On this auspicious day of Makar Sankranti, as the sun begins its northern journey, may your life too turn toward greater light and warmth.",
        "mantra": "Om Suryaya Namaha",
        "significance": "Sun's transition, harvest celebration",
    },
    "maha_shivaratri": {
        "name": "Maha Shivaratri",
        "month": 2, "day": 21,  # Approximate
        "greeting": "On this sacred night of Shiva, may you dissolve all that no longer serves you and awaken to the eternal consciousness within.",
        "mantra": "Om Namah Shivaya",
        "significance": "Night of Shiva, spiritual awakening",
    },
    "holi": {
        "name": "Holi",
        "month": 3, "day": 8,  # Approximate
        "greeting": "Happy Holi! May the colors of joy, love, and new beginnings fill your life as we celebrate the triumph of good over evil.",
        "mantra": "Om Hreem Namaha",
        "significance": "Festival of colors, spring celebration",
    },
    "ram_navami": {
        "name": "Ram Navami",
        "month": 4, "day": 10,  # Approximate
        "greeting": "On Ram Navami, may the divine qualities of Lord Rama - dharma, courage, and compassion - illuminate your path.",
        "mantra": "Om Sri Ramaya Namaha",
        "significance": "Birth of Lord Rama",
    },
    "guru_purnima": {
        "name": "Guru Purnima",
        "month": 7, "day": 21,  # Approximate
        "greeting": "On Guru Purnima, we honor the teachers who light our way. May gratitude fill your heart for all who have guided you.",
        "mantra": "Om Guruve Namaha",
        "significance": "Honoring spiritual teachers",
    },
    "raksha_bandhan": {
        "name": "Raksha Bandhan",
        "month": 8, "day": 11,  # Approximate
        "greeting": "On Raksha Bandhan, may the bonds of love and protection strengthen in your life.",
        "mantra": "Om Shanti Shanti Shanti",
        "significance": "Celebration of sibling bonds",
    },
    "janmashtami": {
        "name": "Krishna Janmashtami",
        "month": 8, "day": 26,  # Approximate
        "greeting": "On Janmashtami, may Lord Krishna's divine wisdom from the Gita illuminate your heart and guide your actions.",
        "mantra": "Om Namo Bhagavate Vasudevaya",
        "significance": "Birth of Lord Krishna",
    },
    "ganesh_chaturthi": {
        "name": "Ganesh Chaturthi",
        "month": 9, "day": 7,  # Approximate
        "greeting": "Ganpati Bappa Morya! May Lord Ganesha remove all obstacles from your path and bless you with wisdom and new beginnings.",
        "mantra": "Om Gam Ganapataye Namaha",
        "significance": "Birth of Lord Ganesha",
    },
    "navratri": {
        "name": "Navratri",
        "month": 10, "day": 3,  # Approximate start
        "greeting": "During these nine sacred nights, may the Divine Mother's energy purify, strengthen, and transform you.",
        "mantra": "Om Dum Durgayei Namaha",
        "significance": "Nine nights of divine feminine",
    },
    "dussehra": {
        "name": "Dussehra",
        "month": 10, "day": 12,  # Approximate
        "greeting": "On Dussehra, may you triumph over your inner demons just as Rama triumphed over Ravana. Victory to righteousness!",
        "mantra": "Om Vijayaya Namaha",
        "significance": "Victory of good over evil",
    },
    "diwali": {
        "name": "Diwali",
        "month": 11, "day": 1,  # Approximate
        "greeting": "Shubh Diwali! May the festival of lights illuminate the darkness within and around you. May prosperity, joy, and wisdom be yours.",
        "mantra": "Om Shreem Mahalakshmiyei Namaha",
        "significance": "Festival of lights",
    },
}


def get_festival_greeting() -> Optional[Dict[str, Any]]:
    """
    Check if today is near a Hindu festival and return appropriate greeting.

    Returns:
        Festival info with greeting if within 3 days of festival, else None
    """
    today = date.today()

    for festival_id, festival in HINDU_FESTIVALS.items():
        try:
            festival_date = date(today.year, festival["month"], festival["day"])
            days_diff = abs((today - festival_date).days)

            if days_diff <= 3:  # Within 3 days of festival
                return {
                    "festival_id": festival_id,
                    "name": festival["name"],
                    "greeting": festival["greeting"],
                    "mantra": festival["mantra"],
                    "significance": festival["significance"],
                    "days_until": (festival_date - today).days,
                }
        except ValueError:
            continue

    return None


def get_auspicious_time_greeting() -> Dict[str, str]:
    """
    Get greeting based on auspicious times in Hindu tradition.

    Returns:
        Greeting and significance for current time
    """
    hour = datetime.now().hour

    # Brahma Muhurta - most auspicious time for spiritual practice
    if 4 <= hour < 6:
        return {
            "time_name": "Brahma Muhurta",
            "greeting": "You have come during Brahma Muhurta, the most sacred time when the veil between worlds is thinnest. The divine is especially close now.",
            "recommendation": "This is the ideal time for meditation and spiritual practice.",
        }

    # Sandhya - twilight times for prayer
    elif 6 <= hour < 7:
        return {
            "time_name": "Pratah Sandhya (Morning Twilight)",
            "greeting": "The morning twilight carries special energy for prayer and intention-setting. You honor this sacred transition.",
            "recommendation": "Perfect time for Gayatri mantra and sunrise meditation.",
        }

    elif 17 <= hour < 19:
        return {
            "time_name": "Sayam Sandhya (Evening Twilight)",
            "greeting": "The evening twilight is a time of letting go. As the sun sets, we release the day's burdens.",
            "recommendation": "Ideal for gratitude practice and evening prayers.",
        }

    # Nishita - midnight for Shiva worship
    elif hour == 0 or hour == 23:
        return {
            "time_name": "Nishita Kala (Sacred Midnight)",
            "greeting": "You have come during Nishita Kala, the mystical midnight hour sacred to Lord Shiva. Deep transformation is possible now.",
            "recommendation": "Powerful time for Shiva meditation and letting go.",
        }

    else:
        return {
            "time_name": "Sacred Present",
            "greeting": "Every moment you choose awareness is auspicious. The divine is always available.",
            "recommendation": "Simply breathe and be present.",
        }


# =============================================================================
# PERSONALIZED MANTRA SYSTEM - Struggle-specific mantras
# =============================================================================

@dataclass
class Mantra:
    """Represents a sacred mantra with its attributes."""
    sanskrit: str
    transliteration: str
    meaning: str
    deity: str
    purpose: List[str]
    repetitions: int = 108  # Traditional mala count
    pronunciation_guide: str = ""
    ssml_pronunciation: str = ""  # SSML for proper pronunciation


HEALING_MANTRAS = {
    # For Anxiety and Fear
    "anxiety": [
        Mantra(
            sanskrit="ॐ गं गणपतये नमः",
            transliteration="Om Gam Ganapataye Namaha",
            meaning="I bow to Lord Ganesha, remover of obstacles",
            deity="Ganesha",
            purpose=["anxiety", "obstacles", "new_beginnings", "fear"],
            pronunciation_guide="Ohm Gahm Gah-nah-pah-tah-yay Nah-mah-hah",
            ssml_pronunciation='<phoneme alphabet="ipa">oːm ɡəm ɡənaːpətəjeː nəməhə</phoneme>',
        ),
        Mantra(
            sanskrit="ॐ नमः शिवाय",
            transliteration="Om Namah Shivaya",
            meaning="I bow to the inner Self, the auspicious one",
            deity="Shiva",
            purpose=["anxiety", "peace", "transformation", "letting_go"],
            pronunciation_guide="Ohm Nah-mah Shee-vah-yah",
            ssml_pronunciation='<phoneme alphabet="ipa">oːm nəməh ʃɪvaːjə</phoneme>',
        ),
    ],

    # For Sadness and Grief
    "sadness": [
        Mantra(
            sanskrit="ॐ श्रीं महालक्ष्म्यै नमः",
            transliteration="Om Shreem Mahalakshmyei Namaha",
            meaning="I bow to the great goddess of abundance and grace",
            deity="Lakshmi",
            purpose=["sadness", "abundance", "grace", "healing"],
            pronunciation_guide="Ohm Shreem Mah-hah-lahk-shmee-yay Nah-mah-hah",
        ),
        Mantra(
            sanskrit="लोकाः समस्ताः सुखिनो भवन्तु",
            transliteration="Lokah Samastah Sukhino Bhavantu",
            meaning="May all beings everywhere be happy and free",
            deity="Universal",
            purpose=["sadness", "compassion", "connection", "healing"],
            pronunciation_guide="Loh-kah Sah-mah-stah Soo-khee-noh Bhah-vahn-too",
        ),
    ],

    # For Anger
    "anger": [
        Mantra(
            sanskrit="ॐ शान्ति शान्ति शान्तिः",
            transliteration="Om Shanti Shanti Shantih",
            meaning="Om Peace Peace Peace",
            deity="Universal",
            purpose=["anger", "peace", "calm", "harmony"],
            pronunciation_guide="Ohm Shahn-tee Shahn-tee Shahn-teeh",
        ),
        Mantra(
            sanskrit="ॐ ह्रीं श्रीं क्लीं महालक्ष्म्यै नमः",
            transliteration="Om Hreem Shreem Kleem Mahalakshmyei Namaha",
            meaning="Sacred sounds invoking the divine mother's cooling grace",
            deity="Lakshmi",
            purpose=["anger", "cooling", "grace", "transformation"],
            pronunciation_guide="Ohm Hreem Shreem Kleem Mah-hah-lahk-shmee-yay Nah-mah-hah",
        ),
    ],

    # For Confusion and Clarity
    "confusion": [
        Mantra(
            sanskrit="ॐ ऐं सरस्वत्यै नमः",
            transliteration="Om Aim Saraswatyai Namaha",
            meaning="I bow to Saraswati, goddess of wisdom and clarity",
            deity="Saraswati",
            purpose=["confusion", "clarity", "wisdom", "learning"],
            pronunciation_guide="Ohm Aym Sah-rahs-wah-tyai Nah-mah-hah",
        ),
        Mantra(
            sanskrit="ॐ तत्सत्",
            transliteration="Om Tat Sat",
            meaning="Om, That is Truth - the eternal reality",
            deity="Universal",
            purpose=["confusion", "truth", "clarity", "reality"],
            pronunciation_guide="Ohm Taht Saht",
        ),
    ],

    # For Fear
    "fear": [
        Mantra(
            sanskrit="ॐ दुं दुर्गायै नमः",
            transliteration="Om Dum Durgayei Namaha",
            meaning="I bow to Durga, the invincible protector",
            deity="Durga",
            purpose=["fear", "protection", "courage", "strength"],
            pronunciation_guide="Ohm Doom Door-gah-yay Nah-mah-hah",
        ),
        Mantra(
            sanskrit="ॐ क्षौं नृसिंहाय नमः",
            transliteration="Om Kshraum Nrisimhaya Namaha",
            meaning="I bow to Narasimha, the fierce protector",
            deity="Narasimha",
            purpose=["fear", "protection", "courage", "safety"],
            pronunciation_guide="Ohm Kshrowm Nrih-sim-hah-yah Nah-mah-hah",
        ),
    ],

    # For Loneliness
    "loneliness": [
        Mantra(
            sanskrit="ॐ नमो भगवते वासुदेवाय",
            transliteration="Om Namo Bhagavate Vasudevaya",
            meaning="I bow to Lord Krishna, the indwelling divine friend",
            deity="Krishna",
            purpose=["loneliness", "divine_friendship", "love", "connection"],
            pronunciation_guide="Ohm Nah-moh Bhah-gah-vah-tay Vah-soo-day-vah-yah",
        ),
        Mantra(
            sanskrit="अहं ब्रह्मास्मि",
            transliteration="Aham Brahmasmi",
            meaning="I am the infinite consciousness",
            deity="Universal",
            purpose=["loneliness", "unity", "connection", "oneness"],
            pronunciation_guide="Ah-hahm Brah-mahs-mee",
        ),
    ],

    # For General Peace
    "peace": [
        Mantra(
            sanskrit="ॐ",
            transliteration="Om",
            meaning="The primordial sound of the universe",
            deity="Universal",
            purpose=["peace", "meditation", "centering", "all"],
            pronunciation_guide="Ohm (extended: Ah-Oo-Mm)",
        ),
        Mantra(
            sanskrit="सो ऽहं",
            transliteration="So Ham",
            meaning="I am That (the universal consciousness)",
            deity="Universal",
            purpose=["peace", "breath", "meditation", "identity"],
            pronunciation_guide="Soh Hahm (synced with breath: So on inhale, Ham on exhale)",
        ),
    ],
}


def recommend_mantra(emotional_state: str, context: Optional[str] = None) -> Dict[str, Any]:
    """
    Recommend a mantra based on emotional state.

    Args:
        emotional_state: User's emotional state
        context: Optional additional context

    Returns:
        Recommended mantra with guidance
    """
    state_lower = emotional_state.lower()

    # Map emotional states to mantra categories
    state_mapping = {
        "anxious": "anxiety",
        "worried": "anxiety",
        "nervous": "anxiety",
        "sad": "sadness",
        "depressed": "sadness",
        "grieving": "sadness",
        "angry": "anger",
        "frustrated": "anger",
        "confused": "confusion",
        "lost": "confusion",
        "afraid": "fear",
        "scared": "fear",
        "fearful": "fear",
        "lonely": "loneliness",
        "isolated": "loneliness",
        "peaceful": "peace",
        "seeking": "peace",
    }

    category = state_mapping.get(state_lower, "peace")
    mantras = HEALING_MANTRAS.get(category, HEALING_MANTRAS["peace"])

    # Select first mantra (could be randomized or user-preferred)
    mantra = mantras[0]

    return {
        "mantra": mantra,
        "category": category,
        "guidance": f"""
For your current state of {emotional_state}, I recommend the mantra:

{mantra.transliteration}
{mantra.meaning}

Pronunciation: {mantra.pronunciation_guide}

How to practice:
1. Find a comfortable seated position
2. Close your eyes and take three deep breaths
3. Begin repeating the mantra, either aloud or silently
4. Traditional practice is 108 repetitions (one mala)
5. Let the vibration of the sound fill your being

This mantra invokes {mantra.deity} for {', '.join(mantra.purpose[:2])}.
""",
        "ssml_pronunciation": mantra.ssml_pronunciation,
    }


# =============================================================================
# EMOTIONAL JOURNEY ARC - Guide user from distress to peace
# =============================================================================

@dataclass
class EmotionalJourneyPhase:
    """A phase in the emotional healing journey."""
    name: str
    description: str
    voice_quality: Dict[str, Any]
    techniques: List[str]
    duration_ratio: float  # Portion of response dedicated to this phase


EMOTIONAL_JOURNEY_ARCS = {
    "distress_to_peace": [
        EmotionalJourneyPhase(
            name="Meeting",
            description="Meet the user where they are - validate, acknowledge",
            voice_quality={"rate": 0.95, "pitch": -0.5, "warmth": "high"},
            techniques=["validation", "acknowledgment", "presence"],
            duration_ratio=0.20,
        ),
        EmotionalJourneyPhase(
            name="Holding",
            description="Create safety, hold space for the emotion",
            voice_quality={"rate": 0.90, "pitch": -1.0, "warmth": "very_high"},
            techniques=["grounding", "safety", "breath_awareness"],
            duration_ratio=0.25,
        ),
        EmotionalJourneyPhase(
            name="Shifting",
            description="Gently introduce new perspective or wisdom",
            voice_quality={"rate": 0.88, "pitch": -1.2, "warmth": "high"},
            techniques=["reframing", "wisdom", "gentle_guidance"],
            duration_ratio=0.25,
        ),
        EmotionalJourneyPhase(
            name="Integrating",
            description="Help integrate the insight, suggest practice",
            voice_quality={"rate": 0.85, "pitch": -1.5, "warmth": "medium"},
            techniques=["practice", "mantra", "breathing"],
            duration_ratio=0.20,
        ),
        EmotionalJourneyPhase(
            name="Blessing",
            description="Close with blessing, empowerment, hope",
            voice_quality={"rate": 0.82, "pitch": -1.8, "warmth": "high"},
            techniques=["blessing", "empowerment", "continuity"],
            duration_ratio=0.10,
        ),
    ],

    "seeking_to_insight": [
        EmotionalJourneyPhase(
            name="Honoring",
            description="Honor the seeking, validate the question",
            voice_quality={"rate": 0.92, "pitch": -0.3, "warmth": "medium"},
            techniques=["validation", "curiosity", "openness"],
            duration_ratio=0.15,
        ),
        EmotionalJourneyPhase(
            name="Exploring",
            description="Explore the question together",
            voice_quality={"rate": 0.90, "pitch": -0.5, "warmth": "medium"},
            techniques=["inquiry", "reflection", "examples"],
            duration_ratio=0.30,
        ),
        EmotionalJourneyPhase(
            name="Illuminating",
            description="Share the wisdom, the insight",
            voice_quality={"rate": 0.88, "pitch": -1.0, "warmth": "high"},
            techniques=["teaching", "verse", "wisdom"],
            duration_ratio=0.30,
        ),
        EmotionalJourneyPhase(
            name="Applying",
            description="How to apply this in life",
            voice_quality={"rate": 0.90, "pitch": -0.8, "warmth": "medium"},
            techniques=["application", "practice", "action"],
            duration_ratio=0.15,
        ),
        EmotionalJourneyPhase(
            name="Encouraging",
            description="Close with encouragement",
            voice_quality={"rate": 0.88, "pitch": -0.5, "warmth": "high"},
            techniques=["encouragement", "blessing"],
            duration_ratio=0.10,
        ),
    ],
}


def get_journey_arc(emotional_state: str) -> List[EmotionalJourneyPhase]:
    """
    Get the appropriate emotional journey arc based on state.

    Args:
        emotional_state: User's emotional state

    Returns:
        List of journey phases to guide the response
    """
    distress_states = ["anxious", "sad", "angry", "fearful", "lonely", "overwhelmed"]

    if emotional_state.lower() in distress_states:
        return EMOTIONAL_JOURNEY_ARCS["distress_to_peace"]
    else:
        return EMOTIONAL_JOURNEY_ARCS["seeking_to_insight"]


# =============================================================================
# VOICE MODES - Different voice qualities for different contexts
# =============================================================================

class VoiceMode(Enum):
    """Different voice modes for various contexts."""
    NORMAL = "normal"           # Standard divine voice
    WHISPER = "whisper"         # Intimate, close, soft
    MEDITATION = "meditation"   # Very slow, hypnotic
    TEACHING = "teaching"       # Clear, slightly faster
    BLESSING = "blessing"       # Reverent, sacred
    COMFORTING = "comforting"   # Warm, embracing
    ENERGIZING = "energizing"   # Slightly brighter, encouraging


VOICE_MODE_SETTINGS = {
    VoiceMode.NORMAL: {
        "rate": 0.88,
        "pitch": -1.0,
        "volume": "medium",
        "breathiness": 0.2,
        "description": "Standard divine presence",
    },
    VoiceMode.WHISPER: {
        "rate": 0.80,
        "pitch": -1.5,
        "volume": "soft",
        "breathiness": 0.5,
        "description": "Intimate, close presence - as if speaking directly into the ear",
        "ssml_effect": '<amazon:effect name="whispered">',
    },
    VoiceMode.MEDITATION: {
        "rate": 0.75,
        "pitch": -2.0,
        "volume": "soft",
        "breathiness": 0.3,
        "description": "Hypnotic, trance-inducing quality",
    },
    VoiceMode.TEACHING: {
        "rate": 0.92,
        "pitch": -0.5,
        "volume": "medium",
        "breathiness": 0.1,
        "description": "Clear, articulate for sharing wisdom",
    },
    VoiceMode.BLESSING: {
        "rate": 0.82,
        "pitch": -1.8,
        "volume": "soft",
        "breathiness": 0.4,
        "description": "Sacred, reverent, blessing quality",
    },
    VoiceMode.COMFORTING: {
        "rate": 0.85,
        "pitch": -1.2,
        "volume": "medium",
        "breathiness": 0.3,
        "description": "Warm, embracing, maternal/paternal",
    },
    VoiceMode.ENERGIZING: {
        "rate": 0.95,
        "pitch": -0.3,
        "volume": "medium",
        "breathiness": 0.1,
        "description": "Uplifting, encouraging, bright",
    },
}


def get_voice_mode_ssml(mode: VoiceMode, text: str) -> str:
    """
    Wrap text in SSML for specified voice mode.

    Args:
        mode: Voice mode to apply
        text: Text to wrap

    Returns:
        SSML-formatted text
    """
    settings = VOICE_MODE_SETTINGS[mode]
    rate_percent = int(settings["rate"] * 100)
    pitch_st = settings["pitch"]

    ssml = f'<prosody rate="{rate_percent}%" pitch="{pitch_st:+.1f}st" volume="{settings["volume"]}">'

    # Add whisper effect if applicable
    if "ssml_effect" in settings:
        ssml += settings["ssml_effect"]
        ssml += text
        ssml += '</amazon:effect>'
    else:
        ssml += text

    ssml += '</prosody>'

    return ssml


# =============================================================================
# ADAPTIVE SILENCE - Intelligent pauses that honor the moment
# =============================================================================

SILENCE_CONTEXTS = {
    "after_heavy_revelation": {
        "duration_ms": 2000,
        "description": "After user shares something deeply personal or painful",
        "ssml": '<break time="2000ms"/>',
    },
    "before_wisdom": {
        "duration_ms": 800,
        "description": "Before sharing important wisdom - creates anticipation",
        "ssml": '<break time="800ms"/>',
    },
    "after_question": {
        "duration_ms": 600,
        "description": "After asking a reflective question - space to think",
        "ssml": '<break time="600ms"/>',
    },
    "grief_honoring": {
        "duration_ms": 3000,
        "description": "Honoring grief with extended silence",
        "ssml": '<break time="3000ms"/>',
    },
    "meditation_space": {
        "duration_ms": 5000,
        "description": "Space for meditation or contemplation",
        "ssml": '<break time="5000ms"/>',
    },
    "letting_sink_in": {
        "duration_ms": 1500,
        "description": "After profound statement - let it sink in",
        "ssml": '<break time="1500ms"/>',
    },
    "breath_space": {
        "duration_ms": 4000,
        "description": "Space for one full breath cycle",
        "ssml": '<break time="4000ms"/>',
    },
}


def get_adaptive_silence(context: str) -> str:
    """
    Get appropriate silence SSML for context.

    Args:
        context: Context for the silence

    Returns:
        SSML break tag
    """
    if context in SILENCE_CONTEXTS:
        return SILENCE_CONTEXTS[context]["ssml"]
    return '<break time="1000ms"/>'


# =============================================================================
# SPIRITUAL SOUNDSCAPES - Optional ambient sacred sounds
# =============================================================================

SACRED_SOUNDSCAPES = {
    "temple_bells": {
        "description": "Soft temple bells in background",
        "mood": ["peaceful", "sacred", "morning"],
        "duration_minutes": 15,
    },
    "flowing_water": {
        "description": "Gentle stream or fountain sounds",
        "mood": ["calm", "cleansing", "meditation"],
        "duration_minutes": 20,
    },
    "om_drone": {
        "description": "Continuous Om drone at 432Hz",
        "mood": ["meditation", "deep", "sacred"],
        "duration_minutes": 30,
    },
    "nature_morning": {
        "description": "Birds, gentle breeze, morning ambiance",
        "mood": ["awakening", "fresh", "hopeful"],
        "duration_minutes": 20,
    },
    "rain_soft": {
        "description": "Soft rain on leaves",
        "mood": ["relaxing", "sleep", "cozy"],
        "duration_minutes": 45,
    },
    "singing_bowls": {
        "description": "Tibetan singing bowls",
        "mood": ["meditation", "healing", "chakra"],
        "duration_minutes": 20,
    },
    "forest_night": {
        "description": "Night forest sounds, crickets, gentle wind",
        "mood": ["sleep", "night", "grounding"],
        "duration_minutes": 60,
    },
}


def recommend_soundscape(mood: str, purpose: str = "meditation") -> Dict[str, Any]:
    """
    Recommend a soundscape based on mood and purpose.

    Args:
        mood: User's current mood
        purpose: What the soundscape is for

    Returns:
        Recommended soundscape info
    """
    mood_lower = mood.lower()

    for name, info in SACRED_SOUNDSCAPES.items():
        if mood_lower in info["mood"] or purpose.lower() in info["mood"]:
            return {
                "soundscape": name,
                "description": info["description"],
                "duration": info["duration_minutes"],
                "recommendation": f"I recommend {info['description'].lower()} for your {purpose}.",
            }

    # Default to om drone
    return {
        "soundscape": "om_drone",
        "description": SACRED_SOUNDSCAPES["om_drone"]["description"],
        "duration": 30,
        "recommendation": "The continuous Om drone creates a sacred container for any practice.",
    }


# =============================================================================
# MAIN ADVANCED VOICE SERVICE CLASS
# =============================================================================

class KIAANAdvancedVoice:
    """
    Advanced voice features for KIAAN.

    Integrates all the cutting-edge features:
    - Healing frequencies
    - Binaural audio
    - Breath synchronization
    - Hindu calendar awareness
    - Personalized mantras
    - Emotional journey arcs
    - Voice modes
    - Adaptive silence
    - Spiritual soundscapes
    """

    def __init__(self):
        """Initialize advanced voice service."""
        self._current_breath_pattern: Optional[BreathPattern] = None
        self._current_voice_mode: VoiceMode = VoiceMode.NORMAL
        self._current_journey_arc: Optional[List[EmotionalJourneyPhase]] = None

        logger.info("KIAAN Advanced Voice initialized with all features")

    def get_personalized_session_intro(
        self,
        emotional_state: str,
        user_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a personalized session introduction with all advanced features.

        Args:
            emotional_state: User's current emotional state
            user_name: Optional user name for personalization

        Returns:
            Complete session intro with all recommendations
        """
        # Check for festival
        festival = get_festival_greeting()

        # Get auspicious time
        auspicious_time = get_auspicious_time_greeting()

        # Get healing frequency
        frequency = recommend_healing_frequency(emotional_state)

        # Get mantra
        mantra = recommend_mantra(emotional_state)

        # Get breath pattern
        if emotional_state.lower() in ["anxious", "worried", "nervous"]:
            breath_pattern = BREATH_PATTERNS["anxiety_relief"]
        elif emotional_state.lower() in ["sad", "depressed", "grieving"]:
            breath_pattern = BREATH_PATTERNS["calming"]
        elif emotional_state.lower() == "angry":
            breath_pattern = BREATH_PATTERNS["box"]
        else:
            breath_pattern = BREATH_PATTERNS["meditation"]

        # Get journey arc
        journey_arc = get_journey_arc(emotional_state)

        # Get soundscape
        soundscape = recommend_soundscape(emotional_state)

        # Determine voice mode
        if emotional_state.lower() in ["sad", "grieving", "lonely"]:
            voice_mode = VoiceMode.COMFORTING
        elif emotional_state.lower() in ["anxious", "fearful"]:
            voice_mode = VoiceMode.WHISPER
        else:
            voice_mode = VoiceMode.NORMAL

        name_greeting = f", {user_name}" if user_name else ""

        intro_text = f"Namaste{name_greeting}. {auspicious_time['greeting']}"

        if festival:
            intro_text += f"\n\n{festival['greeting']}"

        return {
            "intro_text": intro_text,
            "festival": festival,
            "auspicious_time": auspicious_time,
            "recommended_frequency": frequency,
            "recommended_mantra": mantra,
            "breath_pattern": breath_pattern,
            "journey_arc": [phase.name for phase in journey_arc],
            "voice_mode": voice_mode.value,
            "soundscape": soundscape,
            "session_enhancements": {
                "healing_frequency_hz": frequency["hz"],
                "breath_pattern_name": breath_pattern.name,
                "mantra": mantra["mantra"].transliteration,
                "voice_mode": voice_mode.value,
                "soundscape": soundscape["soundscape"],
            },
        }

    def generate_breath_guided_response(
        self,
        emotional_state: str,
        cycles: int = 3
    ) -> str:
        """
        Generate a breath-guided response synchronized to appropriate pattern.

        Args:
            emotional_state: User's emotional state
            cycles: Number of breath cycles

        Returns:
            SSML for guided breathing
        """
        # Select appropriate pattern
        if emotional_state.lower() in ["anxious", "worried", "nervous"]:
            pattern = BREATH_PATTERNS["anxiety_relief"]
        elif emotional_state.lower() in ["sad", "depressed"]:
            pattern = BREATH_PATTERNS["relaxing"]
        elif emotional_state.lower() == "angry":
            pattern = BREATH_PATTERNS["box"]
        elif emotional_state.lower() == "sleepy":
            pattern = BREATH_PATTERNS["sleep"]
        else:
            pattern = BREATH_PATTERNS["meditation"]

        return generate_breath_guided_ssml(pattern, cycles)

    def get_mantra_practice(self, emotional_state: str) -> Dict[str, Any]:
        """
        Get a complete mantra practice for the emotional state.

        Args:
            emotional_state: User's emotional state

        Returns:
            Complete mantra practice with guidance
        """
        return recommend_mantra(emotional_state)

    def get_binaural_recommendation(self, purpose: str) -> Dict[str, Any]:
        """
        Get binaural audio recommendation.

        Args:
            purpose: What the user needs (meditation, sleep, focus, etc.)

        Returns:
            Binaural preset recommendation
        """
        return recommend_binaural_state(purpose)

    def apply_voice_mode(self, text: str, mode: VoiceMode) -> str:
        """
        Apply voice mode to text.

        Args:
            text: Text to process
            mode: Voice mode to apply

        Returns:
            SSML-formatted text
        """
        return get_voice_mode_ssml(mode, text)

    def get_healing_frequency(self, emotional_state: str) -> Dict[str, Any]:
        """
        Get healing frequency recommendation.

        Args:
            emotional_state: User's emotional state

        Returns:
            Healing frequency info
        """
        return recommend_healing_frequency(emotional_state)


# Singleton instance
kiaan_advanced_voice = KIAANAdvancedVoice()


def get_advanced_voice_service() -> KIAANAdvancedVoice:
    """Get the advanced voice service instance."""
    return kiaan_advanced_voice
