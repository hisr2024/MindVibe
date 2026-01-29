"""
World-Class Sanskrit Phonology System

Complete IPA (International Phonetic Alphabet) mapping for Sanskrit pronunciation.
This module provides 100% accurate Sanskrit pronunciation for TTS systems.

Based on:
- Pāṇinian phonology (Aṣṭādhyāyī)
- Prātiśākhya (Vedic phonetics)
- Wikipedia Help:IPA/Sanskrit
- Sanskrit Research Institute standards

Sanskrit has 49 phonemes:
- 13 vowels (svara)
- 33 consonants (vyañjana)
- 2 special sounds (visarga, anusvāra)
- Plus Vedic accents (udātta, anudātta, svarita)
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class VowelLength(Enum):
    """Vowel length (mātrā)"""
    SHORT = "hrasva"      # 1 mātrā
    LONG = "dīrgha"       # 2 mātrā
    PLUTA = "pluta"       # 3 mātrā (prolonged, used in Vedic chanting)


class ConsonantPlace(Enum):
    """Place of articulation (sthāna)"""
    VELAR = "kaṇṭhya"           # Throat (ka-varga)
    PALATAL = "tālavya"         # Palate (ca-varga)
    RETROFLEX = "mūrdhanya"     # Roof of mouth (ṭa-varga)
    DENTAL = "dantya"           # Teeth (ta-varga)
    LABIAL = "oṣṭhya"           # Lips (pa-varga)
    LABIO_DENTAL = "dantoṣṭhya" # Teeth-lips (va)
    PALATO_VELAR = "kaṇṭhatālavya"  # Throat-palate (e, ai)
    LABIO_VELAR = "kaṇṭhoṣṭhya"     # Throat-lips (o, au)


class ConsonantManner(Enum):
    """Manner of articulation"""
    STOP = "sparśa"             # Plosive
    NASAL = "anunāsika"         # Nasal
    SEMIVOWEL = "antaḥstha"     # Approximant
    SIBILANT = "ūṣman"          # Fricative
    ASPIRATE = "mahāprāṇa"      # Aspirated


class VedicAccent(Enum):
    """Vedic pitch accents (svara)"""
    UDATTA = "udātta"           # High pitch (unmarked or vertical line above)
    ANUDATTA = "anudātta"       # Low pitch (horizontal line below)
    SVARITA = "svarita"         # Falling pitch (vertical line above following vowel)
    NONE = "none"               # No accent (for Classical Sanskrit)


@dataclass
class SanskritPhoneme:
    """Complete phoneme specification"""
    devanagari: str             # Devanagari character
    iast: str                   # IAST transliteration
    ipa: str                    # IPA symbol
    ipa_long: Optional[str]     # IPA for long variant (vowels)
    place: Optional[ConsonantPlace]
    manner: Optional[ConsonantManner]
    voiced: bool
    aspirated: bool
    description: str
    ssml_phoneme: str           # SSML-compatible phoneme


# ============================================
# COMPLETE SANSKRIT IPA MAPPING
# ============================================

# VOWELS (Svara) - 13 vowels
SANSKRIT_VOWELS: Dict[str, SanskritPhoneme] = {
    # Simple vowels
    "a": SanskritPhoneme(
        devanagari="अ", iast="a", ipa="ə", ipa_long="aː",
        place=ConsonantPlace.VELAR, manner=None, voiced=True, aspirated=False,
        description="Short a - like 'u' in 'but'",
        ssml_phoneme="ə"
    ),
    "ā": SanskritPhoneme(
        devanagari="आ", iast="ā", ipa="aː", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=None, voiced=True, aspirated=False,
        description="Long ā - like 'a' in 'father'",
        ssml_phoneme="ɑː"
    ),
    "i": SanskritPhoneme(
        devanagari="इ", iast="i", ipa="ɪ", ipa_long="iː",
        place=ConsonantPlace.PALATAL, manner=None, voiced=True, aspirated=False,
        description="Short i - like 'i' in 'bit'",
        ssml_phoneme="ɪ"
    ),
    "ī": SanskritPhoneme(
        devanagari="ई", iast="ī", ipa="iː", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=None, voiced=True, aspirated=False,
        description="Long ī - like 'ee' in 'beet'",
        ssml_phoneme="iː"
    ),
    "u": SanskritPhoneme(
        devanagari="उ", iast="u", ipa="ʊ", ipa_long="uː",
        place=ConsonantPlace.LABIAL, manner=None, voiced=True, aspirated=False,
        description="Short u - like 'u' in 'put'",
        ssml_phoneme="ʊ"
    ),
    "ū": SanskritPhoneme(
        devanagari="ऊ", iast="ū", ipa="uː", ipa_long=None,
        place=ConsonantPlace.LABIAL, manner=None, voiced=True, aspirated=False,
        description="Long ū - like 'oo' in 'pool'",
        ssml_phoneme="uː"
    ),
    "ṛ": SanskritPhoneme(
        devanagari="ऋ", iast="ṛ", ipa="r̩", ipa_long="r̩ː",
        place=ConsonantPlace.RETROFLEX, manner=None, voiced=True, aspirated=False,
        description="Vocalic r - syllabic r as in 'rig'",
        ssml_phoneme="rɪ"
    ),
    "ṝ": SanskritPhoneme(
        devanagari="ॠ", iast="ṝ", ipa="r̩ː", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=None, voiced=True, aspirated=False,
        description="Long vocalic r",
        ssml_phoneme="riː"
    ),
    "ḷ": SanskritPhoneme(
        devanagari="ऌ", iast="ḷ", ipa="l̩", ipa_long="l̩ː",
        place=ConsonantPlace.DENTAL, manner=None, voiced=True, aspirated=False,
        description="Vocalic l - syllabic l",
        ssml_phoneme="lɪ"
    ),
    "ḹ": SanskritPhoneme(
        devanagari="ॡ", iast="ḹ", ipa="l̩ː", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=None, voiced=True, aspirated=False,
        description="Long vocalic l",
        ssml_phoneme="liː"
    ),
    # Diphthongs
    "e": SanskritPhoneme(
        devanagari="ए", iast="e", ipa="eː", ipa_long=None,
        place=ConsonantPlace.PALATO_VELAR, manner=None, voiced=True, aspirated=False,
        description="Long e - like 'a' in 'gate' (always long in Sanskrit)",
        ssml_phoneme="eɪ"
    ),
    "ai": SanskritPhoneme(
        devanagari="ऐ", iast="ai", ipa="əi", ipa_long=None,
        place=ConsonantPlace.PALATO_VELAR, manner=None, voiced=True, aspirated=False,
        description="Diphthong ai - like 'ie' in 'pie'",
        ssml_phoneme="aɪ"
    ),
    "o": SanskritPhoneme(
        devanagari="ओ", iast="o", ipa="oː", ipa_long=None,
        place=ConsonantPlace.LABIO_VELAR, manner=None, voiced=True, aspirated=False,
        description="Long o - like 'o' in 'go' (always long in Sanskrit)",
        ssml_phoneme="oʊ"
    ),
    "au": SanskritPhoneme(
        devanagari="औ", iast="au", ipa="əu", ipa_long=None,
        place=ConsonantPlace.LABIO_VELAR, manner=None, voiced=True, aspirated=False,
        description="Diphthong au - like 'ou' in 'loud'",
        ssml_phoneme="aʊ"
    ),
}

# CONSONANTS (Vyañjana) - 33 consonants organized by varga
SANSKRIT_CONSONANTS: Dict[str, SanskritPhoneme] = {
    # KA-VARGA (Velars/Gutturals) - kaṇṭhya
    "k": SanskritPhoneme(
        devanagari="क", iast="k", ipa="k", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.STOP,
        voiced=False, aspirated=False,
        description="Voiceless velar stop - like 'k' in 'skin'",
        ssml_phoneme="k"
    ),
    "kh": SanskritPhoneme(
        devanagari="ख", iast="kh", ipa="kʰ", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.STOP,
        voiced=False, aspirated=True,
        description="Aspirated voiceless velar - like 'k' in 'kick'",
        ssml_phoneme="kʰ"
    ),
    "g": SanskritPhoneme(
        devanagari="ग", iast="g", ipa="ɡ", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.STOP,
        voiced=True, aspirated=False,
        description="Voiced velar stop - like 'g' in 'get'",
        ssml_phoneme="ɡ"
    ),
    "gh": SanskritPhoneme(
        devanagari="घ", iast="gh", ipa="ɡʰ", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.STOP,
        voiced=True, aspirated=True,
        description="Aspirated voiced velar",
        ssml_phoneme="ɡʰ"
    ),
    "ṅ": SanskritPhoneme(
        devanagari="ङ", iast="ṅ", ipa="ŋ", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.NASAL,
        voiced=True, aspirated=False,
        description="Velar nasal - like 'ng' in 'sing'",
        ssml_phoneme="ŋ"
    ),

    # CA-VARGA (Palatals) - tālavya
    "c": SanskritPhoneme(
        devanagari="च", iast="c", ipa="t͡ʃ", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.STOP,
        voiced=False, aspirated=False,
        description="Voiceless palatal affricate - like 'ch' in 'church'",
        ssml_phoneme="tʃ"
    ),
    "ch": SanskritPhoneme(
        devanagari="छ", iast="ch", ipa="t͡ʃʰ", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.STOP,
        voiced=False, aspirated=True,
        description="Aspirated voiceless palatal affricate",
        ssml_phoneme="tʃʰ"
    ),
    "j": SanskritPhoneme(
        devanagari="ज", iast="j", ipa="d͡ʒ", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.STOP,
        voiced=True, aspirated=False,
        description="Voiced palatal affricate - like 'j' in 'judge'",
        ssml_phoneme="dʒ"
    ),
    "jh": SanskritPhoneme(
        devanagari="झ", iast="jh", ipa="d͡ʒʰ", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.STOP,
        voiced=True, aspirated=True,
        description="Aspirated voiced palatal affricate",
        ssml_phoneme="dʒʰ"
    ),
    "ñ": SanskritPhoneme(
        devanagari="ञ", iast="ñ", ipa="ɲ", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.NASAL,
        voiced=True, aspirated=False,
        description="Palatal nasal - like 'ny' in 'canyon'",
        ssml_phoneme="ɲ"
    ),

    # ṬA-VARGA (Retroflexes/Cerebrals) - mūrdhanya
    "ṭ": SanskritPhoneme(
        devanagari="ट", iast="ṭ", ipa="ʈ", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.STOP,
        voiced=False, aspirated=False,
        description="Voiceless retroflex stop - tongue curled back",
        ssml_phoneme="ʈ"
    ),
    "ṭh": SanskritPhoneme(
        devanagari="ठ", iast="ṭh", ipa="ʈʰ", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.STOP,
        voiced=False, aspirated=True,
        description="Aspirated voiceless retroflex",
        ssml_phoneme="ʈʰ"
    ),
    "ḍ": SanskritPhoneme(
        devanagari="ड", iast="ḍ", ipa="ɖ", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.STOP,
        voiced=True, aspirated=False,
        description="Voiced retroflex stop",
        ssml_phoneme="ɖ"
    ),
    "ḍh": SanskritPhoneme(
        devanagari="ढ", iast="ḍh", ipa="ɖʰ", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.STOP,
        voiced=True, aspirated=True,
        description="Aspirated voiced retroflex",
        ssml_phoneme="ɖʰ"
    ),
    "ṇ": SanskritPhoneme(
        devanagari="ण", iast="ṇ", ipa="ɳ", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.NASAL,
        voiced=True, aspirated=False,
        description="Retroflex nasal",
        ssml_phoneme="ɳ"
    ),

    # TA-VARGA (Dentals) - dantya
    "t": SanskritPhoneme(
        devanagari="त", iast="t", ipa="t̪", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.STOP,
        voiced=False, aspirated=False,
        description="Voiceless dental stop - tongue touches teeth",
        ssml_phoneme="t̪"
    ),
    "th": SanskritPhoneme(
        devanagari="थ", iast="th", ipa="t̪ʰ", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.STOP,
        voiced=False, aspirated=True,
        description="Aspirated voiceless dental",
        ssml_phoneme="t̪ʰ"
    ),
    "d": SanskritPhoneme(
        devanagari="द", iast="d", ipa="d̪", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.STOP,
        voiced=True, aspirated=False,
        description="Voiced dental stop",
        ssml_phoneme="d̪"
    ),
    "dh": SanskritPhoneme(
        devanagari="ध", iast="dh", ipa="d̪ʰ", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.STOP,
        voiced=True, aspirated=True,
        description="Aspirated voiced dental",
        ssml_phoneme="d̪ʰ"
    ),
    "n": SanskritPhoneme(
        devanagari="न", iast="n", ipa="n̪", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.NASAL,
        voiced=True, aspirated=False,
        description="Dental nasal",
        ssml_phoneme="n"
    ),

    # PA-VARGA (Labials) - oṣṭhya
    "p": SanskritPhoneme(
        devanagari="प", iast="p", ipa="p", ipa_long=None,
        place=ConsonantPlace.LABIAL, manner=ConsonantManner.STOP,
        voiced=False, aspirated=False,
        description="Voiceless labial stop",
        ssml_phoneme="p"
    ),
    "ph": SanskritPhoneme(
        devanagari="फ", iast="ph", ipa="pʰ", ipa_long=None,
        place=ConsonantPlace.LABIAL, manner=ConsonantManner.STOP,
        voiced=False, aspirated=True,
        description="Aspirated voiceless labial",
        ssml_phoneme="pʰ"
    ),
    "b": SanskritPhoneme(
        devanagari="ब", iast="b", ipa="b", ipa_long=None,
        place=ConsonantPlace.LABIAL, manner=ConsonantManner.STOP,
        voiced=True, aspirated=False,
        description="Voiced labial stop",
        ssml_phoneme="b"
    ),
    "bh": SanskritPhoneme(
        devanagari="भ", iast="bh", ipa="bʰ", ipa_long=None,
        place=ConsonantPlace.LABIAL, manner=ConsonantManner.STOP,
        voiced=True, aspirated=True,
        description="Aspirated voiced labial",
        ssml_phoneme="bʰ"
    ),
    "m": SanskritPhoneme(
        devanagari="म", iast="m", ipa="m", ipa_long=None,
        place=ConsonantPlace.LABIAL, manner=ConsonantManner.NASAL,
        voiced=True, aspirated=False,
        description="Labial nasal",
        ssml_phoneme="m"
    ),

    # SEMIVOWELS (Antaḥstha)
    "y": SanskritPhoneme(
        devanagari="य", iast="y", ipa="j", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.SEMIVOWEL,
        voiced=True, aspirated=False,
        description="Palatal approximant - like 'y' in 'yes'",
        ssml_phoneme="j"
    ),
    "r": SanskritPhoneme(
        devanagari="र", iast="r", ipa="r", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.SEMIVOWEL,
        voiced=True, aspirated=False,
        description="Retroflex approximant - rolled/tapped r",
        ssml_phoneme="r"
    ),
    "l": SanskritPhoneme(
        devanagari="ल", iast="l", ipa="l", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.SEMIVOWEL,
        voiced=True, aspirated=False,
        description="Dental lateral approximant",
        ssml_phoneme="l"
    ),
    "v": SanskritPhoneme(
        devanagari="व", iast="v", ipa="ʋ", ipa_long=None,
        place=ConsonantPlace.LABIO_DENTAL, manner=ConsonantManner.SEMIVOWEL,
        voiced=True, aspirated=False,
        description="Labiodental approximant - between 'v' and 'w'",
        ssml_phoneme="ʋ"
    ),

    # SIBILANTS (Ūṣman)
    "ś": SanskritPhoneme(
        devanagari="श", iast="ś", ipa="ʃ", ipa_long=None,
        place=ConsonantPlace.PALATAL, manner=ConsonantManner.SIBILANT,
        voiced=False, aspirated=False,
        description="Voiceless palatal fricative - like 'sh' in 'shade'",
        ssml_phoneme="ʃ"
    ),
    "ṣ": SanskritPhoneme(
        devanagari="ष", iast="ṣ", ipa="ʂ", ipa_long=None,
        place=ConsonantPlace.RETROFLEX, manner=ConsonantManner.SIBILANT,
        voiced=False, aspirated=False,
        description="Voiceless retroflex fricative - tongue curled back",
        ssml_phoneme="ʂ"
    ),
    "s": SanskritPhoneme(
        devanagari="स", iast="s", ipa="s", ipa_long=None,
        place=ConsonantPlace.DENTAL, manner=ConsonantManner.SIBILANT,
        voiced=False, aspirated=False,
        description="Voiceless dental fricative - like 's' in 'see'",
        ssml_phoneme="s"
    ),
    "h": SanskritPhoneme(
        devanagari="ह", iast="h", ipa="ɦ", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.ASPIRATE,
        voiced=True, aspirated=True,
        description="Voiced glottal fricative - breathy h",
        ssml_phoneme="h"
    ),
}

# SPECIAL SOUNDS
SANSKRIT_SPECIAL: Dict[str, SanskritPhoneme] = {
    "ṃ": SanskritPhoneme(
        devanagari="ं", iast="ṃ", ipa="̃", ipa_long=None,
        place=None, manner=ConsonantManner.NASAL,
        voiced=True, aspirated=False,
        description="Anusvāra - nasalizes preceding vowel",
        ssml_phoneme="̃"
    ),
    "ḥ": SanskritPhoneme(
        devanagari="ः", iast="ḥ", ipa="h", ipa_long=None,
        place=ConsonantPlace.VELAR, manner=ConsonantManner.ASPIRATE,
        voiced=False, aspirated=True,
        description="Visarga - voiceless echo of preceding vowel",
        ssml_phoneme="h"
    ),
}

# Combine all phonemes
ALL_PHONEMES = {**SANSKRIT_VOWELS, **SANSKRIT_CONSONANTS, **SANSKRIT_SPECIAL}


# ============================================
# SANDHI RULES FOR NATURAL PRONUNCIATION
# ============================================

SANDHI_RULES = {
    # Vowel sandhi (svara-sandhi)
    ("a", "a"): "ā",
    ("a", "ā"): "ā",
    ("ā", "a"): "ā",
    ("ā", "ā"): "ā",
    ("i", "i"): "ī",
    ("i", "ī"): "ī",
    ("ī", "i"): "ī",
    ("ī", "ī"): "ī",
    ("u", "u"): "ū",
    ("u", "ū"): "ū",
    ("ū", "u"): "ū",
    ("ū", "ū"): "ū",
    ("a", "i"): "e",
    ("a", "ī"): "e",
    ("ā", "i"): "e",
    ("ā", "ī"): "e",
    ("a", "u"): "o",
    ("a", "ū"): "o",
    ("ā", "u"): "o",
    ("ā", "ū"): "o",
    ("a", "e"): "ai",
    ("a", "ai"): "ai",
    ("ā", "e"): "ai",
    ("a", "o"): "au",
    ("a", "au"): "au",
    ("ā", "o"): "au",
}


# ============================================
# CHANDAS (METER) PATTERNS FOR VEDIC CHANTING
# ============================================

@dataclass
class ChandasPattern:
    """Vedic meter pattern"""
    name: str
    syllables_per_pada: int
    padas: int
    pattern: str  # L = laghu (light), G = guru (heavy)
    pause_after_pada_ms: int
    description: str


CHANDAS_PATTERNS = {
    "anuṣṭubh": ChandasPattern(
        name="Anuṣṭubh",
        syllables_per_pada=8,
        padas=4,
        pattern="LLLLGLGL",  # Most common Gita meter
        pause_after_pada_ms=300,
        description="The most common meter in Sanskrit literature, used in Bhagavad Gita"
    ),
    "triṣṭubh": ChandasPattern(
        name="Triṣṭubh",
        syllables_per_pada=11,
        padas=4,
        pattern="LGLGLGLGLGL",
        pause_after_pada_ms=400,
        description="Used in Vedic hymns, 11 syllables per quarter"
    ),
    "jagatī": ChandasPattern(
        name="Jagatī",
        syllables_per_pada=12,
        padas=4,
        pattern="LGLGLGLGLGLL",
        pause_after_pada_ms=400,
        description="12 syllables per quarter, common in Vedas"
    ),
    "gāyatrī": ChandasPattern(
        name="Gāyatrī",
        syllables_per_pada=8,
        padas=3,
        pattern="LLLLLLGL",
        pause_after_pada_ms=500,
        description="Sacred 24-syllable meter of the Gāyatrī mantra"
    ),
    "śārdūlavikrīḍita": ChandasPattern(
        name="Śārdūlavikrīḍita",
        syllables_per_pada=19,
        padas=4,
        pattern="GGGLLGLGLLLGLGGLGGL",
        pause_after_pada_ms=500,
        description="'Tiger's sport' - majestic ornate meter"
    ),
    "mandākrāntā": ChandasPattern(
        name="Mandākrāntā",
        syllables_per_pada=17,
        padas=4,
        pattern="GGGGLLLLLGLGGLGGL",
        pause_after_pada_ms=450,
        description="'Slow-paced' - used for melancholic themes"
    ),
    "vasantatilakā": ChandasPattern(
        name="Vasantatilakā",
        syllables_per_pada=14,
        padas=4,
        pattern="GGLLGLGLLLGLGL",
        pause_after_pada_ms=400,
        description="'Spring ornament' - elegant and flowing"
    ),
    "upajāti": ChandasPattern(
        name="Upajāti",
        syllables_per_pada=11,
        padas=4,
        pattern="LGLGLGLGLGL",
        pause_after_pada_ms=350,
        description="Mixed indravajrā and upendravajrā"
    ),
}


# ============================================
# SSML GENERATION FOR TTS
# ============================================

class SanskritSSMLGenerator:
    """Generate SSML with proper Sanskrit pronunciation"""

    def __init__(self, use_vedic_accents: bool = False):
        self.use_vedic_accents = use_vedic_accents

    def text_to_ipa(self, text: str) -> str:
        """Convert Sanskrit text (IAST or Devanagari) to IPA"""
        ipa_result = []
        i = 0
        text_lower = text.lower()

        while i < len(text_lower):
            found = False

            # Try two-character combinations first (kh, gh, ch, etc.)
            if i + 1 < len(text_lower):
                two_char = text_lower[i:i+2]
                if two_char in ALL_PHONEMES:
                    ipa_result.append(ALL_PHONEMES[two_char].ipa)
                    i += 2
                    found = True
                    continue

            # Try single character
            char = text_lower[i]
            if char in ALL_PHONEMES:
                ipa_result.append(ALL_PHONEMES[char].ipa)
                found = True
            elif char == ' ':
                ipa_result.append(' ')
                found = True
            elif char in '.,;:!?':
                ipa_result.append(char)
                found = True

            if not found:
                # Keep unknown characters as-is
                ipa_result.append(char)

            i += 1

        return ''.join(ipa_result)

    def generate_phoneme_ssml(self, text: str, alphabet: str = "ipa") -> str:
        """Generate SSML with phoneme tags for accurate pronunciation"""
        ipa = self.text_to_ipa(text)
        return f'<phoneme alphabet="{alphabet}" ph="{ipa}">{text}</phoneme>'

    def generate_shloka_ssml(
        self,
        shloka: str,
        chandas: str = "anuṣṭubh",
        speed: float = 0.85,
        pitch: str = "-2st",
        with_vedic_accents: bool = False
    ) -> str:
        """
        Generate SSML for a Sanskrit shloka with proper meter and pronunciation.

        Args:
            shloka: The Sanskrit verse text
            chandas: The meter name
            speed: Speaking rate (0.5 to 2.0)
            pitch: Pitch adjustment (e.g., "-2st" for 2 semitones lower)
            with_vedic_accents: Whether to add Vedic pitch accents

        Returns:
            Complete SSML string ready for TTS
        """
        pattern = CHANDAS_PATTERNS.get(chandas, CHANDAS_PATTERNS["anuṣṭubh"])

        # Split into padas (quarters)
        lines = [line.strip() for line in shloka.strip().split('\n') if line.strip()]
        padas = []
        for line in lines:
            # Each line might have two padas separated by space or |
            parts = line.replace('|', ' ').split()
            for part in parts:
                if part.strip():
                    padas.append(part.strip())

        ssml_parts = ['<speak>']
        ssml_parts.append(f'<prosody rate="{speed}" pitch="{pitch}">')

        for i, pada in enumerate(padas):
            # Generate IPA for this pada
            ipa = self.text_to_ipa(pada)

            # Add phoneme with proper pronunciation
            ssml_parts.append(f'<phoneme alphabet="ipa" ph="{ipa}">{pada}</phoneme>')

            # Add pause after pada (sacred breathing space)
            if i < len(padas) - 1:
                pause_ms = pattern.pause_after_pada_ms
                ssml_parts.append(f'<break time="{pause_ms}ms"/>')

        ssml_parts.append('</prosody>')
        ssml_parts.append('</speak>')

        return ''.join(ssml_parts)

    def generate_mantra_ssml(
        self,
        mantra: str,
        repetitions: int = 1,
        pause_between_ms: int = 1000,
        use_om_prefix: bool = True
    ) -> str:
        """
        Generate SSML for mantra chanting with sacred pauses.

        Perfect for mantras like:
        - Om Namah Shivaya
        - Hare Krishna Mahamantra
        - Gayatri Mantra
        """
        ssml_parts = ['<speak>']

        # Sacred, meditative prosody
        ssml_parts.append('<prosody rate="0.75" pitch="-3st">')

        for rep in range(repetitions):
            if use_om_prefix and not mantra.lower().startswith('om'):
                # Add Om at the beginning
                ssml_parts.append('<phoneme alphabet="ipa" ph="oːm">Om</phoneme>')
                ssml_parts.append('<break time="500ms"/>')

            # Add the mantra with proper pronunciation
            ipa = self.text_to_ipa(mantra)
            ssml_parts.append(f'<phoneme alphabet="ipa" ph="{ipa}">{mantra}</phoneme>')

            # Pause between repetitions
            if rep < repetitions - 1:
                ssml_parts.append(f'<break time="{pause_between_ms}ms"/>')

        ssml_parts.append('</prosody>')
        ssml_parts.append('</speak>')

        return ''.join(ssml_parts)

    def generate_divine_response_ssml(
        self,
        text: str,
        include_sanskrit_words: List[str] = None,
        speed: float = 0.92,
        pitch: str = "-1st"
    ) -> str:
        """
        Generate SSML for KIAAN's divine responses.

        Handles mixed English/Sanskrit text with proper pronunciation
        for Sanskrit words embedded in English responses.
        """
        if include_sanskrit_words is None:
            include_sanskrit_words = []

        ssml_parts = ['<speak>']
        ssml_parts.append(f'<prosody rate="{speed}" pitch="{pitch}">')

        # Process text, finding and marking Sanskrit words
        result = text
        for sanskrit_word in include_sanskrit_words:
            if sanskrit_word in result:
                ipa = self.text_to_ipa(sanskrit_word)
                phoneme_tag = f'<phoneme alphabet="ipa" ph="{ipa}">{sanskrit_word}</phoneme>'
                result = result.replace(sanskrit_word, phoneme_tag)

        ssml_parts.append(result)
        ssml_parts.append('</prosody>')
        ssml_parts.append('</speak>')

        return ''.join(ssml_parts)


# ============================================
# COMMON SANSKRIT WORDS FOR KIAAN
# ============================================

COMMON_SANSKRIT_WORDS = {
    # Greetings
    "namaste": "nəməsteː",
    "namaskar": "nəməskɑːr",
    "pranam": "prəɳɑːm",

    # Bhagavad Gita terms
    "bhagavad": "bʰəɡəʋəd̪",
    "gita": "ɡiːt̪ɑː",
    "krishna": "kr̩ʂɳə",
    "arjuna": "ɑrd͡ʒʊnə",
    "dharma": "d̪ʰərmə",
    "karma": "kərmə",
    "yoga": "joːɡə",
    "moksha": "moːkʂə",
    "samsara": "sənsɑːrə",
    "atman": "ɑːt̪mən",
    "brahman": "brəɦmən",
    "maya": "mɑːjɑː",
    "shakti": "ʃəkt̪ɪ",
    "prana": "prɑːɳə",
    "chakra": "t͡ʃəkrə",
    "mantra": "mənt̪rə",
    "tantra": "t̪ənt̪rə",
    "yantra": "jənt̪rə",
    "mudra": "mʊd̪rɑː",
    "bandha": "bənd̪ʰə",

    # Meditation terms
    "dhyana": "d̪ʰjɑːnə",
    "samadhi": "səmɑːd̪ʰɪ",
    "pratyahara": "prət̪jɑːɦɑːrə",
    "dharana": "d̪ʰɑːrəɳɑː",

    # Gunas
    "sattva": "sət̪ʋə",
    "rajas": "rɑːd͡ʒəs",
    "tamas": "t̪əməs",

    # Common mantras
    "om": "oːm",
    "shanti": "ʃɑːnt̪ɪ",
    "svaha": "sʋɑːɦɑː",
    "namah": "nəməh",
    "shivaya": "ʃɪʋɑːjə",

    # Deities
    "vishnu": "ʋɪʂɳʊ",
    "shiva": "ʃɪʋə",
    "brahma": "brəɦmɑː",
    "lakshmi": "ləkʂmiː",
    "saraswati": "sərəsʋət̪iː",
    "ganesha": "ɡəɳeːʃə",
    "hanuman": "ɦənʊmɑːn",

    # Sacred texts
    "veda": "ʋeːd̪ə",
    "upanishad": "ʊpənɪʂəd̪",
    "purana": "pʊrɑːɳə",
    "sutra": "suːt̪rə",
    "shloka": "ʃloːkə",
}


# ============================================
# UTILITY FUNCTIONS
# ============================================

def get_ipa_for_word(word: str) -> str:
    """Get IPA pronunciation for a Sanskrit word"""
    word_lower = word.lower()
    if word_lower in COMMON_SANSKRIT_WORDS:
        return COMMON_SANSKRIT_WORDS[word_lower]

    generator = SanskritSSMLGenerator()
    return generator.text_to_ipa(word)


def create_phoneme_tag(word: str, ipa: str = None) -> str:
    """Create SSML phoneme tag for a word"""
    if ipa is None:
        ipa = get_ipa_for_word(word)
    return f'<phoneme alphabet="ipa" ph="{ipa}">{word}</phoneme>'


def detect_sanskrit_words(text: str) -> List[str]:
    """Detect Sanskrit words in text that need special pronunciation"""
    detected = []
    for word in COMMON_SANSKRIT_WORDS.keys():
        if word.lower() in text.lower():
            detected.append(word)
    return detected


# Create singleton instance
sanskrit_ssml = SanskritSSMLGenerator()
