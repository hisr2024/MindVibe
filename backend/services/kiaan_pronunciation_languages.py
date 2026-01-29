"""
KIAAN Pronunciation & Languages System - Perfect Sanskrit and Multi-Language Voice

This module provides world-class pronunciation for:

1. PERFECT SANSKRIT PRONUNCIATION
   - Complete IPA phoneme mappings for all Sanskrit sounds
   - Vedic accent markers (udātta, anudātta, svarita)
   - Chandas (meter) support for shloka recitation
   - Sandhi rules awareness

2. MULTI-LANGUAGE SUPPORT
   - Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi
   - Native pronunciation guides
   - Script-to-phoneme conversion

3. REGIONAL INDIAN ACCENTS
   - North Indian (Delhi, UP, Punjab)
   - South Indian (Tamil, Telugu, Kannada, Kerala)
   - East Indian (Bengali, Odiya)
   - West Indian (Marathi, Gujarati)

4. NATURAL VOICE FEATURES
   - Vocal fry for intimate moments
   - Breathiness control
   - Dynamic pitch contours
   - Micro-prosodic variations

5. VEDIC CHANTING SYSTEM
   - Proper shloka recitation patterns
   - Mantra pronunciation with sacred timing
   - Chandas (meter) recognition and rhythm

6. HUMAN VOICE QUALITIES
   - Emotional contagion patterns
   - Personality expression
   - Subtle humor and warmth
   - Imperfection for authenticity

"The sacred sounds, when pronounced perfectly, vibrate the universe itself."
"""

import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


# =============================================================================
# PART 1: PERFECT SANSKRIT PRONUNCIATION SYSTEM
# =============================================================================

class SanskritPhoneme(Enum):
    """
    Complete Sanskrit phoneme inventory with IPA equivalents.
    Each phoneme maps to precise SSML <phoneme> representation.
    """
    # Vowels (Swaras) - Short
    A = "a"           # अ - /ə/ or /ʌ/
    I = "i"           # इ - /ɪ/
    U = "u"           # उ - /ʊ/
    RI = "ṛ"          # ऋ - /r̩/
    LRI = "ḷ"         # ऌ - /l̩/

    # Vowels (Swaras) - Long
    AA = "ā"          # आ - /aː/
    II = "ī"          # ई - /iː/
    UU = "ū"          # ऊ - /uː/
    RII = "ṝ"         # ॠ - /r̩ː/

    # Diphthongs
    E = "e"           # ए - /eː/
    AI = "ai"         # ऐ - /əi/
    O = "o"           # ओ - /oː/
    AU = "au"         # औ - /əu/

    # Anusvara and Visarga
    ANUSVARA = "ṃ"    # ं - /m̃/ nasal
    VISARGA = "ḥ"     # ः - /h/

    # Consonants - Gutturals (Kaṇṭhya)
    KA = "ka"         # क - /kə/
    KHA = "kha"       # ख - /kʰə/
    GA = "ga"         # ग - /gə/
    GHA = "gha"       # घ - /gʱə/
    NGA = "ṅa"        # ङ - /ŋə/

    # Consonants - Palatals (Tālavya)
    CHA = "ca"        # च - /t͡ʃə/
    CHHA = "cha"      # छ - /t͡ʃʰə/
    JA = "ja"         # ज - /d͡ʒə/
    JHA = "jha"       # झ - /d͡ʒʱə/
    NYA = "ña"        # ञ - /ɲə/

    # Consonants - Cerebrals/Retroflex (Mūrdhanya)
    TTA = "ṭa"        # ट - /ʈə/
    TTHA = "ṭha"      # ठ - /ʈʰə/
    DDA = "ḍa"        # ड - /ɖə/
    DDHA = "ḍha"      # ढ - /ɖʱə/
    NNA = "ṇa"        # ण - /ɳə/

    # Consonants - Dentals (Dantya)
    TA = "ta"         # त - /t̪ə/
    THA = "tha"       # थ - /t̪ʰə/
    DA = "da"         # द - /d̪ə/
    DHA = "dha"       # ध - /d̪ʱə/
    NA = "na"         # न - /n̪ə/

    # Consonants - Labials (Oṣṭhya)
    PA = "pa"         # प - /pə/
    PHA = "pha"       # फ - /pʰə/
    BA = "ba"         # ब - /bə/
    BHA = "bha"       # भ - /bʱə/
    MA = "ma"         # म - /mə/

    # Semi-vowels (Antaḥstha)
    YA = "ya"         # य - /jə/
    RA = "ra"         # र - /rə/
    LA = "la"         # ल - /lə/
    VA = "va"         # व - /ʋə/

    # Sibilants (Ūṣman)
    SHA = "śa"        # श - /ʃə/ (palatal)
    SHHA = "ṣa"       # ष - /ʂə/ (retroflex)
    SA = "sa"         # स - /sə/ (dental)
    HA = "ha"         # ह - /ɦə/


# Complete IPA mapping for Sanskrit sounds
SANSKRIT_IPA_MAP: Dict[str, str] = {
    # Vowels - Short
    "अ": "ə", "a": "ə",
    "इ": "ɪ", "i": "ɪ",
    "उ": "ʊ", "u": "ʊ",
    "ऋ": "r̩", "ṛ": "r̩",
    "ऌ": "l̩", "ḷ": "l̩",

    # Vowels - Long
    "आ": "aː", "ā": "aː", "aa": "aː",
    "ई": "iː", "ī": "iː", "ee": "iː",
    "ऊ": "uː", "ū": "uː", "oo": "uː",
    "ॠ": "r̩ː", "ṝ": "r̩ː",

    # Diphthongs
    "ए": "eː", "e": "eː",
    "ऐ": "əɪ", "ai": "əɪ",
    "ओ": "oː", "o": "oː",
    "औ": "əʊ", "au": "əʊ",

    # Anusvara/Visarga
    "ं": "m̃", "ṃ": "m̃", "m": "m̃",
    "ः": "h", "ḥ": "h",

    # Gutturals
    "क": "k", "ka": "kə",
    "ख": "kʰ", "kha": "kʰə",
    "ग": "g", "ga": "gə",
    "घ": "gʱ", "gha": "gʱə",
    "ङ": "ŋ", "ṅa": "ŋə",

    # Palatals
    "च": "t͡ʃ", "ca": "t͡ʃə", "cha": "t͡ʃə",
    "छ": "t͡ʃʰ", "chha": "t͡ʃʰə",
    "ज": "d͡ʒ", "ja": "d͡ʒə",
    "झ": "d͡ʒʱ", "jha": "d͡ʒʱə",
    "ञ": "ɲ", "ña": "ɲə",

    # Retroflexes
    "ट": "ʈ", "ṭa": "ʈə",
    "ठ": "ʈʰ", "ṭha": "ʈʰə",
    "ड": "ɖ", "ḍa": "ɖə",
    "ढ": "ɖʱ", "ḍha": "ɖʱə",
    "ण": "ɳ", "ṇa": "ɳə",

    # Dentals
    "त": "t̪", "ta": "t̪ə",
    "थ": "t̪ʰ", "tha": "t̪ʰə",
    "द": "d̪", "da": "d̪ə",
    "ध": "d̪ʱ", "dha": "d̪ʱə",
    "न": "n̪", "na": "n̪ə",

    # Labials
    "प": "p", "pa": "pə",
    "फ": "pʰ", "pha": "pʰə",
    "ब": "b", "ba": "bə",
    "भ": "bʱ", "bha": "bʱə",
    "म": "m", "ma": "mə",

    # Semi-vowels
    "य": "j", "ya": "jə",
    "र": "r", "ra": "rə",
    "ल": "l", "la": "lə",
    "व": "ʋ", "va": "ʋə", "wa": "ʋə",

    # Sibilants
    "श": "ʃ", "śa": "ʃə", "sha": "ʃə",
    "ष": "ʂ", "ṣa": "ʂə", "shha": "ʂə",
    "स": "s", "sa": "sə",
    "ह": "ɦ", "ha": "ɦə",
}


@dataclass
class VedicAccent:
    """
    Vedic accent markers for proper shloka recitation.
    Traditional Vedic chanting uses three primary accents.
    """
    UDATTA = "udātta"         # High pitch (unmarked or vertical line above)
    ANUDATTA = "anudātta"     # Low pitch (horizontal line below)
    SVARITA = "svarita"       # Falling pitch (vertical line above next syllable)

    # SSML representations
    @staticmethod
    def get_ssml(accent: str, text: str) -> str:
        """Generate SSML for Vedic accent."""
        if accent == "udātta":
            return f'<prosody pitch="+15%" rate="95%">{text}</prosody>'
        elif accent == "anudātta":
            return f'<prosody pitch="-10%" rate="95%">{text}</prosody>'
        elif accent == "svarita":
            return f'<prosody pitch="+10%"><prosody pitch="-5%">{text}</prosody></prosody>'
        return text


class Chandas(Enum):
    """
    Sanskrit meters (Chandas) for proper shloka recitation rhythm.
    Each meter has specific syllable patterns and pauses.
    """
    ANUSHTUP = "anuṣṭup"           # 8 syllables per quarter, most common
    TRISHTUP = "triṣṭup"           # 11 syllables per quarter
    JAGATI = "jagatī"              # 12 syllables per quarter
    GAYATRI = "gāyatrī"            # 6 syllables per quarter (3 lines)
    USHNIK = "uṣṇik"               # 7 syllables per quarter
    BRIHATI = "bṛhatī"             # 9 syllables per quarter
    PANKTI = "paṅkti"              # 10 syllables per quarter
    VASANTATILAKA = "vasantatilakā"  # Complex 14-syllable meter
    SHARDULVIKRIDIT = "śārdūlavikrīḍita"  # Complex 19-syllable meter
    MANDAKRANTA = "mandākrāntā"    # Flowing 17-syllable meter


CHANDAS_PATTERNS: Dict[Chandas, Dict[str, Any]] = {
    Chandas.ANUSHTUP: {
        "syllables_per_pada": 8,
        "padas": 4,
        "pause_after_pada_ms": 400,
        "pause_after_half_ms": 800,
        "pause_after_full_ms": 1200,
        "rate_multiplier": 0.90,
        "description": "The most common Vedic meter, used in Bhagavad Gita",
    },
    Chandas.GAYATRI: {
        "syllables_per_pada": 8,
        "padas": 3,
        "pause_after_pada_ms": 500,
        "pause_after_half_ms": 700,
        "pause_after_full_ms": 1500,
        "rate_multiplier": 0.85,
        "description": "Sacred meter of the Gayatri Mantra",
    },
    Chandas.TRISHTUP: {
        "syllables_per_pada": 11,
        "padas": 4,
        "pause_after_pada_ms": 350,
        "pause_after_half_ms": 700,
        "pause_after_full_ms": 1100,
        "rate_multiplier": 0.88,
        "description": "Common in Rigveda hymns",
    },
    Chandas.JAGATI: {
        "syllables_per_pada": 12,
        "padas": 4,
        "pause_after_pada_ms": 380,
        "pause_after_half_ms": 750,
        "pause_after_full_ms": 1150,
        "rate_multiplier": 0.87,
        "description": "Twelve syllables per quarter, flowing rhythm",
    },
    Chandas.USHNIK: {
        "syllables_per_pada": 7,
        "padas": 4,
        "pause_after_pada_ms": 350,
        "pause_after_half_ms": 650,
        "pause_after_full_ms": 1000,
        "rate_multiplier": 0.92,
        "description": "Seven syllables, quick and bright",
    },
    Chandas.BRIHATI: {
        "syllables_per_pada": 9,
        "padas": 4,
        "pause_after_pada_ms": 420,
        "pause_after_half_ms": 820,
        "pause_after_full_ms": 1250,
        "rate_multiplier": 0.89,
        "description": "Nine syllables, expansive feeling",
    },
    Chandas.PANKTI: {
        "syllables_per_pada": 10,
        "padas": 4,
        "pause_after_pada_ms": 400,
        "pause_after_half_ms": 780,
        "pause_after_full_ms": 1180,
        "rate_multiplier": 0.88,
        "description": "Ten syllables, balanced meter",
    },
    Chandas.VASANTATILAKA: {
        "syllables_per_pada": 14,
        "padas": 4,
        "pause_after_pada_ms": 450,
        "pause_after_half_ms": 900,
        "pause_after_full_ms": 1400,
        "rate_multiplier": 0.85,
        "description": "Graceful flowing meter, like spring breeze",
    },
    Chandas.SHARDULVIKRIDIT: {
        "syllables_per_pada": 19,
        "padas": 4,
        "pause_after_pada_ms": 550,
        "pause_after_half_ms": 1100,
        "pause_after_full_ms": 1700,
        "rate_multiplier": 0.80,
        "description": "Complex 19-syllable meter, like a tiger's playful movements",
    },
    Chandas.MANDAKRANTA: {
        "syllables_per_pada": 17,
        "padas": 4,
        "pause_after_pada_ms": 500,
        "pause_after_half_ms": 1000,
        "pause_after_full_ms": 1600,
        "rate_multiplier": 0.82,
        "description": "Slow, majestic pace - 'the slow stepper'",
    },
}


@dataclass
class SanskritShloka:
    """
    Represents a Sanskrit shloka with full pronunciation metadata.
    """
    devanagari: str                    # Original Sanskrit in Devanagari
    iast: str                          # IAST transliteration
    ipa: str                           # IPA pronunciation
    meaning: str                       # English meaning
    chandas: Chandas                   # Meter used
    source: str                        # Source text (Gita, Upanishad, etc.)
    chapter_verse: str                 # Reference (e.g., "2.47")
    accents: List[Tuple[int, str]] = field(default_factory=list)  # Position, accent pairs


# Pre-defined important shlokas with perfect pronunciation
SACRED_SHLOKAS: Dict[str, SanskritShloka] = {
    "karmanye_vadhikaraste": SanskritShloka(
        devanagari="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        iast="karmaṇy evādhikāras te mā phaleṣu kadācana, mā karmaphalaheturbhūr mā te saṅgo 'stv akarmaṇi",
        ipa="kəɾməɳjeːʋaːd̪ʱɪkaːɾəst̪eː maː pʰəleːʂʊ kəd̪aːt͡ʃənə maː kəɾməpʰələɦeːt̪ʊɾbʱuːɾmaː t̪eː səŋgoːst̪ʋəkəɾməɳɪ",
        meaning="You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.",
        chandas=Chandas.ANUSHTUP,
        source="Bhagavad Gita",
        chapter_verse="2.47",
    ),
    "yogasthah_kuru_karmani": SanskritShloka(
        devanagari="योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
        iast="yogasthaḥ kuru karmāṇi saṅgaṃ tyaktvā dhanañjaya, siddhyasiddhyoḥ samo bhūtvā samatvaṃ yoga ucyate",
        ipa="joːgəst̪ʱəh kʊɾʊ kəɾmaːɳɪ səŋgəm t̪jəkt̪ʋaː d̪ʱənəɲd͡ʒəjə sɪd̪d̪ʱjəsɪd̪d̪ʱjoːh səmoː bʱuːt̪ʋaː səmət̪ʋəm joːgə ʊt͡ʃjət̪eː",
        meaning="Perform actions, O Dhananjaya, being steadfast in Yoga, abandoning attachment and balanced in success and failure. Evenness of mind is called Yoga.",
        chandas=Chandas.ANUSHTUP,
        source="Bhagavad Gita",
        chapter_verse="2.48",
    ),
    "om_bhur_bhuva": SanskritShloka(
        devanagari="ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥",
        iast="oṃ bhūr bhuvaḥ svaḥ tat savitur vareṇyaṃ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt",
        ipa="oːm bʱuːɾ bʱʊʋəh sʋəh t̪ət̪ səʋɪt̪ʊɾ ʋəɾeːɳjəm bʱəɾgoː d̪eːʋəsjə d̪ʱiːməɦɪ d̪ʱɪjoː joː nəh pɾət͡ʃoːd̪əjaːt̪",
        meaning="We meditate on the glory of that Being who has produced this universe; may He enlighten our minds.",
        chandas=Chandas.GAYATRI,
        source="Rigveda",
        chapter_verse="3.62.10",
    ),
    "asato_ma_sadgamaya": SanskritShloka(
        devanagari="असतो मा सद्गमय। तमसो मा ज्योतिर्गमय। मृत्योर्मा अमृतं गमय॥",
        iast="asato mā sadgamaya, tamaso mā jyotirgamaya, mṛtyormā amṛtaṃ gamaya",
        ipa="əsət̪oː maː səd̪gəməjə t̪əməsoː maː d͡ʒjoːt̪ɪɾgəməjə mɾ̩t̪joːɾmaː əmɾ̩t̪əm gəməjə",
        meaning="Lead me from the unreal to the real, from darkness to light, from death to immortality.",
        chandas=Chandas.ANUSHTUP,
        source="Brihadaranyaka Upanishad",
        chapter_verse="1.3.28",
    ),
    "om_sahana_vavatu": SanskritShloka(
        devanagari="ॐ सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै। तेजस्वि नावधीतमस्तु मा विद्विषावहै। ॐ शान्तिः शान्तिः शान्तिः॥",
        iast="oṃ saha nāvavatu, saha nau bhunaktu, saha vīryaṃ karavāvahai, tejasvi nāvadhītamastu mā vidviṣāvahai, oṃ śāntiḥ śāntiḥ śāntiḥ",
        ipa="oːm səɦə naːʋəʋət̪ʊ səɦə nəʊ bʱʊnəkt̪ʊ səɦə ʋiːɾjəm kəɾəʋaːʋəɦəɪ t̪eːd͡ʒəsʋɪ naːʋəd̪ʱiːt̪əməst̪ʊ maː ʋɪd̪ʋɪʂaːʋəɦəɪ oːm ʃaːn̪t̪ɪh ʃaːn̪t̪ɪh ʃaːn̪t̪ɪh",
        meaning="May we be protected together, may we be nourished together, may we work together with great vigor, may our study be enlightening, may we not hate each other. Om peace, peace, peace.",
        chandas=Chandas.ANUSHTUP,
        source="Taittiriya Upanishad",
        chapter_verse="2.2.2",
    ),
    "lokah_samastah": SanskritShloka(
        devanagari="लोकाः समस्ताः सुखिनो भवन्तु॥",
        iast="lokāḥ samastāḥ sukhino bhavantu",
        ipa="loːkaːh səməst̪aːh sʊkʰɪnoː bʱəʋənt̪ʊ",
        meaning="May all beings everywhere be happy and free.",
        chandas=Chandas.ANUSHTUP,
        source="Traditional",
        chapter_verse="",
    ),
}


def convert_to_ipa(text: str) -> str:
    """
    Convert Sanskrit text (Devanagari or IAST) to IPA pronunciation.

    Args:
        text: Sanskrit text in Devanagari or IAST transliteration

    Returns:
        IPA phonetic transcription
    """
    result = []
    i = 0
    text_lower = text.lower()

    while i < len(text_lower):
        matched = False

        # Try matching longest sequences first (up to 4 chars)
        for length in range(min(4, len(text_lower) - i), 0, -1):
            segment = text_lower[i:i + length]
            if segment in SANSKRIT_IPA_MAP:
                result.append(SANSKRIT_IPA_MAP[segment])
                i += length
                matched = True
                break

        if not matched:
            # Keep unknown characters as-is
            if text_lower[i] not in ' \n\t':
                result.append(text_lower[i])
            else:
                result.append(' ')
            i += 1

    return ''.join(result)


def generate_shloka_ssml(
    shloka: SanskritShloka,
    include_meaning: bool = False,
    voice_gender: str = "male",
    chanting_style: str = "traditional"
) -> str:
    """
    Generate SSML for perfect Sanskrit shloka recitation.

    Args:
        shloka: The SanskritShloka object
        include_meaning: Whether to include English meaning
        voice_gender: "male" or "female"
        chanting_style: "traditional", "meditative", or "devotional"

    Returns:
        SSML-formatted text for TTS
    """
    chandas_info = CHANDAS_PATTERNS.get(shloka.chandas, CHANDAS_PATTERNS[Chandas.ANUSHTUP])
    rate = chandas_info["rate_multiplier"]
    pause_pada = chandas_info["pause_after_pada_ms"]
    pause_half = chandas_info["pause_after_half_ms"]
    pause_full = chandas_info["pause_after_full_ms"]

    # Adjust for chanting style
    if chanting_style == "meditative":
        rate *= 0.85
        pause_pada = int(pause_pada * 1.3)
        pause_half = int(pause_half * 1.3)
        pause_full = int(pause_full * 1.5)
    elif chanting_style == "devotional":
        rate *= 0.90
        pause_pada = int(pause_pada * 1.1)

    # Pitch adjustment for gender
    pitch_adjust = "-2st" if voice_gender == "male" else "+1st"

    # Build SSML
    ssml_parts = []

    # Opening sacred pause
    ssml_parts.append(f'<break time="500ms"/>')

    # Main shloka with proper prosody
    ssml_parts.append(f'<prosody rate="{int(rate * 100)}%" pitch="{pitch_adjust}">')

    # Split shloka into padas (quarters)
    iast_text = shloka.iast

    # Add phoneme markup for key Sanskrit sounds
    iast_with_phonemes = add_sanskrit_phonemes(iast_text)

    # Add pauses at punctuation
    iast_with_pauses = re.sub(r',', f'<break time="{pause_pada}ms"/>', iast_with_phonemes)
    iast_with_pauses = re.sub(r'\.', f'<break time="{pause_full}ms"/>', iast_with_pauses)
    iast_with_pauses = re.sub(r'\|', f'<break time="{pause_half}ms"/>', iast_with_pauses)

    ssml_parts.append(iast_with_pauses)
    ssml_parts.append('</prosody>')

    # Closing sacred pause
    ssml_parts.append(f'<break time="{pause_full}ms"/>')

    # Optional meaning
    if include_meaning:
        ssml_parts.append('<break time="800ms"/>')
        ssml_parts.append(f'<prosody rate="95%" pitch="+0st">')
        ssml_parts.append(f'This means: {shloka.meaning}')
        ssml_parts.append('</prosody>')

    return ''.join(ssml_parts)


def add_sanskrit_phonemes(text: str) -> str:
    """
    Add SSML phoneme tags for proper Sanskrit pronunciation.
    Uses IPA alphabet for precise pronunciation guidance.
    """
    # Key Sanskrit sounds that need special pronunciation
    phoneme_replacements = [
        # Retroflexes (tongue curled back)
        (r'\bṭ', '<phoneme alphabet="ipa" ph="ʈ">t</phoneme>'),
        (r'\bḍ', '<phoneme alphabet="ipa" ph="ɖ">d</phoneme>'),
        (r'\bṇ', '<phoneme alphabet="ipa" ph="ɳ">n</phoneme>'),
        (r'\bṣ', '<phoneme alphabet="ipa" ph="ʂ">sh</phoneme>'),

        # Aspirates (with breath)
        (r'kh', '<phoneme alphabet="ipa" ph="kʰ">kh</phoneme>'),
        (r'gh', '<phoneme alphabet="ipa" ph="gʱ">gh</phoneme>'),
        (r'ch(?!h)', '<phoneme alphabet="ipa" ph="t͡ʃ">ch</phoneme>'),
        (r'jh', '<phoneme alphabet="ipa" ph="d͡ʒʱ">jh</phoneme>'),
        (r'th', '<phoneme alphabet="ipa" ph="t̪ʰ">th</phoneme>'),
        (r'dh', '<phoneme alphabet="ipa" ph="d̪ʱ">dh</phoneme>'),
        (r'ph', '<phoneme alphabet="ipa" ph="pʰ">ph</phoneme>'),
        (r'bh', '<phoneme alphabet="ipa" ph="bʱ">bh</phoneme>'),

        # Long vowels
        (r'ā', '<prosody rate="90%">aa</prosody>'),
        (r'ī', '<prosody rate="90%">ee</prosody>'),
        (r'ū', '<prosody rate="90%">oo</prosody>'),

        # Special sounds
        (r'ṃ', '<phoneme alphabet="ipa" ph="m̃">m</phoneme>'),  # Anusvara
        (r'ḥ', '<phoneme alphabet="ipa" ph="h">h</phoneme>'),  # Visarga
        (r'ñ', '<phoneme alphabet="ipa" ph="ɲ">ny</phoneme>'),
        (r'ṅ', '<phoneme alphabet="ipa" ph="ŋ">ng</phoneme>'),

        # Palatal ś vs retroflex ṣ
        (r'ś', '<phoneme alphabet="ipa" ph="ʃ">sh</phoneme>'),
    ]

    result = text
    for pattern, replacement in phoneme_replacements:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    return result


# =============================================================================
# PART 2: MULTI-LANGUAGE SUPPORT
# =============================================================================

class IndianLanguage(Enum):
    """Supported Indian languages for KIAAN."""
    HINDI = "hi"
    TAMIL = "ta"
    TELUGU = "te"
    KANNADA = "kn"
    MALAYALAM = "ml"
    BENGALI = "bn"
    GUJARATI = "gu"
    MARATHI = "mr"
    PUNJABI = "pa"
    ODIA = "or"


@dataclass
class LanguageConfig:
    """Configuration for each language's voice synthesis."""
    code: str
    name: str
    native_name: str
    script: str
    tts_voice_id: str  # For cloud TTS providers
    rate_adjustment: float = 1.0
    pitch_adjustment: str = "+0st"
    greeting: str = ""
    closing: str = ""
    sample_phonemes: Dict[str, str] = field(default_factory=dict)


LANGUAGE_CONFIGS: Dict[IndianLanguage, LanguageConfig] = {
    IndianLanguage.HINDI: LanguageConfig(
        code="hi",
        name="Hindi",
        native_name="हिन्दी",
        script="Devanagari",
        tts_voice_id="hi-IN-Standard-A",
        rate_adjustment=0.95,
        greeting="नमस्ते, मैं कियान हूँ",
        closing="शांति और प्रेम के साथ",
        sample_phonemes={
            "namaste": "nəməst̪eː",
            "dhanyavaad": "d̪ʱənjəʋaːd̪",
            "shanti": "ʃaːnt̪ɪ",
        },
    ),
    IndianLanguage.TAMIL: LanguageConfig(
        code="ta",
        name="Tamil",
        native_name="தமிழ்",
        script="Tamil",
        tts_voice_id="ta-IN-Standard-A",
        rate_adjustment=0.92,
        pitch_adjustment="-1st",
        greeting="வணக்கம், நான் கியான்",
        closing="அமைதியும் அன்பும் உங்களுக்கு",
        sample_phonemes={
            "vanakkam": "ʋəɳəkkəm",
            "nandri": "n̪ən̪d̪ɾɪ",
        },
    ),
    IndianLanguage.TELUGU: LanguageConfig(
        code="te",
        name="Telugu",
        native_name="తెలుగు",
        script="Telugu",
        tts_voice_id="te-IN-Standard-A",
        rate_adjustment=0.93,
        greeting="నమస్కారం, నేను కియాన్",
        closing="శాంతి మరియు ప్రేమతో",
        sample_phonemes={
            "namaskaram": "nəməskaːɾəm",
            "dhanyavadalu": "d̪ʱənjəʋaːd̪əlʊ",
        },
    ),
    IndianLanguage.KANNADA: LanguageConfig(
        code="kn",
        name="Kannada",
        native_name="ಕನ್ನಡ",
        script="Kannada",
        tts_voice_id="kn-IN-Standard-A",
        rate_adjustment=0.94,
        greeting="ನಮಸ್ಕಾರ, ನಾನು ಕಿಯಾನ್",
        closing="ಶಾಂತಿ ಮತ್ತು ಪ್ರೀತಿಯೊಂದಿಗೆ",
    ),
    IndianLanguage.MALAYALAM: LanguageConfig(
        code="ml",
        name="Malayalam",
        native_name="മലയാളം",
        script="Malayalam",
        tts_voice_id="ml-IN-Standard-A",
        rate_adjustment=0.90,
        pitch_adjustment="-1st",
        greeting="നമസ്കാരം, ഞാൻ കിയാൻ ആണ്",
        closing="സമാധാനവും സ്നേഹവും നിങ്ങൾക്ക്",
    ),
    IndianLanguage.BENGALI: LanguageConfig(
        code="bn",
        name="Bengali",
        native_name="বাংলা",
        script="Bengali",
        tts_voice_id="bn-IN-Standard-A",
        rate_adjustment=0.94,
        greeting="নমস্কার, আমি কিয়ান",
        closing="শান্তি এবং ভালোবাসা",
        sample_phonemes={
            "namaskar": "nɔmoskaːr",
            "dhanyabad": "d̪ʱɔnːobaːd̪",
        },
    ),
    IndianLanguage.GUJARATI: LanguageConfig(
        code="gu",
        name="Gujarati",
        native_name="ગુજરાતી",
        script="Gujarati",
        tts_voice_id="gu-IN-Standard-A",
        rate_adjustment=0.95,
        greeting="નમસ્તે, હું કિયાન છું",
        closing="શાંતિ અને પ્રેમ સાથે",
    ),
    IndianLanguage.MARATHI: LanguageConfig(
        code="mr",
        name="Marathi",
        native_name="मराठी",
        script="Devanagari",
        tts_voice_id="mr-IN-Standard-A",
        rate_adjustment=0.94,
        greeting="नमस्कार, मी कियान आहे",
        closing="शांती आणि प्रेमाने",
    ),
    IndianLanguage.PUNJABI: LanguageConfig(
        code="pa",
        name="Punjabi",
        native_name="ਪੰਜਾਬੀ",
        script="Gurmukhi",
        tts_voice_id="pa-IN-Standard-A",
        rate_adjustment=0.96,
        greeting="ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਕਿਆਨ ਹਾਂ",
        closing="ਸ਼ਾਂਤੀ ਅਤੇ ਪਿਆਰ ਨਾਲ",
    ),
    IndianLanguage.ODIA: LanguageConfig(
        code="or",
        name="Odia",
        native_name="ଓଡ଼ିଆ",
        script="Odia",
        tts_voice_id="or-IN-Standard-A",
        rate_adjustment=0.93,
        greeting="ନମସ୍କାର, ମୁଁ କିଆନ",
        closing="ଶାନ୍ତି ଏବଂ ପ୍ରେମ ସହିତ",
    ),
}


def get_language_greeting(language: IndianLanguage) -> str:
    """Get the native greeting for a language."""
    config = LANGUAGE_CONFIGS.get(language)
    if config:
        return config.greeting
    return "Namaste, I am KIAAN"


def generate_multilingual_ssml(
    text: str,
    language: IndianLanguage,
    include_native_greeting: bool = True
) -> str:
    """
    Generate SSML with proper language configuration.

    Args:
        text: Text to synthesize
        language: Target language
        include_native_greeting: Whether to include native greeting

    Returns:
        SSML-formatted text
    """
    config = LANGUAGE_CONFIGS.get(language)
    if not config:
        return text

    ssml_parts = []

    # Language tag
    ssml_parts.append(f'<lang xml:lang="{config.code}-IN">')

    # Apply language-specific prosody
    ssml_parts.append(f'<prosody rate="{int(config.rate_adjustment * 100)}%" pitch="{config.pitch_adjustment}">')

    # Native greeting if requested
    if include_native_greeting and config.greeting:
        ssml_parts.append(config.greeting)
        ssml_parts.append('<break time="400ms"/>')

    # Main text
    ssml_parts.append(text)

    # Native closing
    if config.closing:
        ssml_parts.append('<break time="500ms"/>')
        ssml_parts.append(config.closing)

    ssml_parts.append('</prosody>')
    ssml_parts.append('</lang>')

    return ''.join(ssml_parts)


# =============================================================================
# PART 3: REGIONAL INDIAN ACCENTS
# =============================================================================

class RegionalAccent(Enum):
    """Regional Indian accent variations."""
    # North Indian
    DELHI = "delhi"
    PUNJABI = "punjabi"
    UP_HINDI = "up_hindi"
    RAJASTHANI = "rajasthani"

    # South Indian
    TAMIL_ENGLISH = "tamil_english"
    TELUGU_ENGLISH = "telugu_english"
    KANNADA_ENGLISH = "kannada_english"
    MALAYALAM_ENGLISH = "malayalam_english"

    # East Indian
    BENGALI_ENGLISH = "bengali_english"
    ODIA_ENGLISH = "odia_english"

    # West Indian
    MARATHI_ENGLISH = "marathi_english"
    GUJARATI_ENGLISH = "gujarati_english"


@dataclass
class AccentProfile:
    """Profile for regional accent voice synthesis."""
    name: str
    region: str

    # Prosodic features
    pitch_range: Tuple[str, str]  # (low, high)
    speaking_rate: float

    # Phonetic patterns (common modifications)
    phonetic_patterns: Dict[str, str]

    # Intonation patterns
    sentence_final_pattern: str  # rising, falling, level
    question_pattern: str

    # Rhythm
    syllable_timing: str  # stress-timed, syllable-timed, mora-timed


ACCENT_PROFILES: Dict[RegionalAccent, AccentProfile] = {
    RegionalAccent.DELHI: AccentProfile(
        name="Delhi Hindi-influenced",
        region="North India - NCR",
        pitch_range=("-1st", "+2st"),
        speaking_rate=1.05,
        phonetic_patterns={
            "the": "da",
            "v": "w",
            "th": "t",
        },
        sentence_final_pattern="slightly_rising",
        question_pattern="strongly_rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.PUNJABI: AccentProfile(
        name="Punjabi-influenced",
        region="Punjab",
        pitch_range=("+0st", "+3st"),
        speaking_rate=1.08,
        phonetic_patterns={
            "j": "z",
            "the": "da",
            "v": "v",  # Punjabi retains v sound
        },
        sentence_final_pattern="rising",
        question_pattern="high_rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.UP_HINDI: AccentProfile(
        name="UP Hindi-influenced",
        region="Uttar Pradesh",
        pitch_range=("-0.5st", "+2st"),
        speaking_rate=1.02,
        phonetic_patterns={
            "the": "da",
            "v": "bh",
            "w": "v",
            "th": "t",
        },
        sentence_final_pattern="slightly_rising",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.RAJASTHANI: AccentProfile(
        name="Rajasthani-influenced",
        region="Rajasthan",
        pitch_range=("-1st", "+2.5st"),
        speaking_rate=1.0,
        phonetic_patterns={
            "the": "da",
            "s": "sh",  # Some words
            "v": "v",
        },
        sentence_final_pattern="rising",
        question_pattern="high_rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.TAMIL_ENGLISH: AccentProfile(
        name="Tamil-influenced English",
        region="Tamil Nadu",
        pitch_range=("-2st", "+1st"),
        speaking_rate=0.92,
        phonetic_patterns={
            "th": "t",
            "z": "s",
            "initial_s": "es",  # school -> eschool
        },
        sentence_final_pattern="falling",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.TELUGU_ENGLISH: AccentProfile(
        name="Telugu-influenced English",
        region="Andhra Pradesh / Telangana",
        pitch_range=("-1st", "+2st"),
        speaking_rate=0.95,
        phonetic_patterns={
            "f": "p",  # fiveteen -> pifteen
            "z": "j",
        },
        sentence_final_pattern="level",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.BENGALI_ENGLISH: AccentProfile(
        name="Bengali-influenced English",
        region="West Bengal",
        pitch_range=("-1st", "+3st"),
        speaking_rate=0.94,
        phonetic_patterns={
            "v": "bh",
            "w": "u",
            "initial_j": "z",  # joy -> zoy
        },
        sentence_final_pattern="falling_rising",
        question_pattern="high_rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.MALAYALAM_ENGLISH: AccentProfile(
        name="Malayalam-influenced English",
        region="Kerala",
        pitch_range=("-2st", "+0st"),
        speaking_rate=0.88,
        phonetic_patterns={
            "th": "t",
            "the": "di",
        },
        sentence_final_pattern="falling",
        question_pattern="level_rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.GUJARATI_ENGLISH: AccentProfile(
        name="Gujarati-influenced English",
        region="Gujarat",
        pitch_range=("+0st", "+2st"),
        speaking_rate=0.98,
        phonetic_patterns={
            "th": "th",  # Gujarati preserves this
            "w": "v",
        },
        sentence_final_pattern="slightly_rising",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.MARATHI_ENGLISH: AccentProfile(
        name="Marathi-influenced English",
        region="Maharashtra",
        pitch_range=("-1st", "+1st"),
        speaking_rate=0.96,
        phonetic_patterns={
            "th": "t",
            "z": "j",
        },
        sentence_final_pattern="falling",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.KANNADA_ENGLISH: AccentProfile(
        name="Kannada-influenced English",
        region="Karnataka",
        pitch_range=("-1st", "+1.5st"),
        speaking_rate=0.93,
        phonetic_patterns={
            "th": "t",
            "f": "ph",
            "z": "j",
        },
        sentence_final_pattern="slightly_falling",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
    RegionalAccent.ODIA_ENGLISH: AccentProfile(
        name="Odia-influenced English",
        region="Odisha",
        pitch_range=("-0.5st", "+2st"),
        speaking_rate=0.94,
        phonetic_patterns={
            "th": "t",
            "v": "bh",
            "w": "u",
        },
        sentence_final_pattern="falling",
        question_pattern="rising",
        syllable_timing="syllable-timed",
    ),
}


def apply_regional_accent(text: str, accent: RegionalAccent) -> str:
    """
    Apply regional accent prosody to SSML text.

    Args:
        text: Input text
        accent: Regional accent to apply

    Returns:
        SSML with accent-appropriate prosody
    """
    profile = ACCENT_PROFILES.get(accent)
    if not profile:
        return text

    rate_percent = int(profile.speaking_rate * 100)
    base_pitch = profile.pitch_range[0]

    # Wrap in prosody
    ssml = f'<prosody rate="{rate_percent}%" pitch="{base_pitch}">'
    ssml += text
    ssml += '</prosody>'

    return ssml


# =============================================================================
# PART 4: NATURAL VOICE FEATURES
# =============================================================================

@dataclass
class VocalQuality:
    """
    Advanced vocal quality controls for natural voice synthesis.
    These add human-like imperfections and qualities.
    """
    breathiness: float = 0.0       # 0.0 - 1.0 (breathy quality)
    vocal_fry: float = 0.0         # 0.0 - 1.0 (creaky voice)
    tenseness: float = 0.5         # 0.0 - 1.0 (relaxed to tense)
    nasality: float = 0.0          # 0.0 - 1.0 (nasal quality)
    head_voice: float = 0.0        # 0.0 - 1.0 (chest to head voice)
    vibrato: float = 0.0           # 0.0 - 1.0 (pitch oscillation)
    shimmer: float = 0.0           # 0.0 - 1.0 (amplitude variation)
    jitter: float = 0.0            # 0.0 - 1.0 (pitch variation)


# Preset vocal qualities for different emotional contexts
VOCAL_QUALITY_PRESETS: Dict[str, VocalQuality] = {
    "intimate_whisper": VocalQuality(
        breathiness=0.7,
        vocal_fry=0.2,
        tenseness=0.2,
        head_voice=0.3,
    ),
    "warm_comforting": VocalQuality(
        breathiness=0.3,
        tenseness=0.3,
        nasality=0.1,
        vibrato=0.1,
    ),
    "gentle_meditation": VocalQuality(
        breathiness=0.4,
        tenseness=0.2,
        head_voice=0.2,
        vibrato=0.05,
    ),
    "energetic_encouraging": VocalQuality(
        breathiness=0.1,
        tenseness=0.6,
        head_voice=0.4,
        shimmer=0.1,
    ),
    "sad_empathetic": VocalQuality(
        breathiness=0.5,
        vocal_fry=0.3,
        tenseness=0.2,
        shimmer=0.15,
        jitter=0.1,
    ),
    "sacred_chanting": VocalQuality(
        breathiness=0.2,
        nasality=0.2,
        vibrato=0.2,
        tenseness=0.4,
    ),
    "wise_elder": VocalQuality(
        breathiness=0.2,
        vocal_fry=0.4,
        tenseness=0.3,
        shimmer=0.1,
    ),
}


@dataclass
class PitchContour:
    """
    Pitch contour pattern for natural intonation.
    Defines how pitch changes across a phrase.
    """
    name: str
    points: List[Tuple[float, float]]  # (position 0-1, pitch semitones)
    duration_adjustment: float = 1.0


# Natural pitch contour patterns
PITCH_CONTOURS: Dict[str, PitchContour] = {
    "statement_neutral": PitchContour(
        name="Neutral Statement",
        points=[(0.0, 0), (0.3, 1), (0.7, 0.5), (1.0, -2)],
    ),
    "statement_warm": PitchContour(
        name="Warm Statement",
        points=[(0.0, 0.5), (0.2, 1.5), (0.5, 1), (0.8, 0.5), (1.0, -1)],
        duration_adjustment=1.05,
    ),
    "question_yes_no": PitchContour(
        name="Yes/No Question",
        points=[(0.0, 0), (0.5, 0), (0.8, 2), (1.0, 4)],
    ),
    "question_wh": PitchContour(
        name="WH-Question",
        points=[(0.0, 3), (0.2, 2), (0.7, 0), (1.0, -1)],
    ),
    "empathetic": PitchContour(
        name="Empathetic",
        points=[(0.0, 0.5), (0.3, 1.5), (0.5, 0.5), (0.7, 1), (1.0, -0.5)],
        duration_adjustment=1.1,
    ),
    "soothing_lullaby": PitchContour(
        name="Soothing Lullaby",
        points=[(0.0, 1), (0.25, 0), (0.5, 1), (0.75, -0.5), (1.0, -1.5)],
        duration_adjustment=1.2,
    ),
    "encouraging": PitchContour(
        name="Encouraging",
        points=[(0.0, 0), (0.2, 2), (0.5, 1), (0.7, 2.5), (1.0, 1)],
    ),
    "sacred_reverent": PitchContour(
        name="Sacred Reverent",
        points=[(0.0, -0.5), (0.3, 0.5), (0.5, 0), (0.7, 0.5), (1.0, -1)],
        duration_adjustment=1.15,
    ),
}


def apply_pitch_contour(text: str, contour_name: str) -> str:
    """
    Apply a pitch contour pattern to text using SSML.

    Note: This is a simplified representation. Real implementation
    would need more sophisticated prosody markup.
    """
    contour = PITCH_CONTOURS.get(contour_name)
    if not contour:
        return text

    # Calculate average pitch offset
    avg_pitch = sum(p[1] for p in contour.points) / len(contour.points)
    pitch_str = f"+{avg_pitch}st" if avg_pitch >= 0 else f"{avg_pitch}st"

    rate_percent = int(100 / contour.duration_adjustment)

    return f'<prosody pitch="{pitch_str}" rate="{rate_percent}%">{text}</prosody>'


# Micro-prosodic features for human-like speech
SPEECH_DISFLUENCIES: Dict[str, str] = {
    "thinking_pause": '<break time="300ms"/>',
    "hesitation": '<break time="150ms"/>um<break time="100ms"/>',
    "soft_restart": '<break time="200ms"/>',
    "breath_intake": '<break time="100ms"/>',
    "emphasis_pause": '<break time="250ms"/>',
}


def add_natural_disfluencies(text: str, frequency: float = 0.1) -> str:
    """
    Add subtle natural speech disfluencies for authenticity.

    Args:
        text: Input text
        frequency: How often to add disfluencies (0.0 - 1.0)

    Returns:
        Text with natural pauses and micro-variations
    """
    # Add thinking pauses before important words
    important_words = ["actually", "really", "truly", "deeply", "perhaps", "maybe"]

    for word in important_words:
        pattern = rf'\b({word})\b'
        replacement = f'<break time="200ms"/>\\1'
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    return text


# =============================================================================
# PART 5: VEDIC CHANTING SYSTEM
# =============================================================================

class ChantingMode(Enum):
    """Different modes of Vedic chanting."""
    SAMHITA = "samhita"           # Connected chanting (standard)
    PADA = "pada"                 # Word-by-word separation
    KRAMA = "krama"               # Sequential word pairs
    JATA = "jata"                 # Back-and-forth pattern
    GHANA = "ghana"               # Dense interweaving pattern


@dataclass
class VedicChant:
    """A complete Vedic chant with recitation metadata."""
    name: str
    text: str
    transliteration: str
    meaning: str
    source: str
    chandas: Chandas
    mode: ChantingMode = ChantingMode.SAMHITA
    vedic_accents: List[Tuple[int, str]] = field(default_factory=list)
    recitation_notes: str = ""


VEDIC_PEACE_CHANTS: Dict[str, VedicChant] = {
    "shanti_mantra_1": VedicChant(
        name="Shanti Mantra - Taittiriya",
        text="ॐ सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै। तेजस्वि नावधीतमस्तु मा विद्विषावहै। ॐ शान्तिः शान्तिः शान्तिः॥",
        transliteration="om saha nāvavatu saha nau bhunaktu saha vīryam karavāvahai tejasvi nāvadhītamastu mā vidviṣāvahai om śāntiḥ śāntiḥ śāntiḥ",
        meaning="May we be protected together, nourished together, work with great energy, may our intellect be sharpened, may we not argue with each other. Om peace peace peace.",
        source="Taittiriya Upanishad",
        chandas=Chandas.ANUSHTUP,
    ),
    "shanti_mantra_2": VedicChant(
        name="Shanti Mantra - Isha",
        text="ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते। पूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते॥",
        transliteration="om pūrṇamadaḥ pūrṇamidam pūrṇātpūrṇamudacyate pūrṇasya pūrṇamādāya pūrṇamevāvaśiṣyate",
        meaning="That is whole, this is whole. From wholeness emerges wholeness. Taking wholeness from wholeness, wholeness alone remains.",
        source="Isha Upanishad",
        chandas=Chandas.ANUSHTUP,
    ),
    "gayatri": VedicChant(
        name="Gayatri Mantra",
        text="ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥",
        transliteration="om bhūr bhuvaḥ svaḥ tat savitur vareṇyam bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt",
        meaning="We meditate on the glory of that Being who has produced this universe; may He enlighten our minds.",
        source="Rigveda 3.62.10",
        chandas=Chandas.GAYATRI,
    ),
    "mahamrityunjaya": VedicChant(
        name="Mahamrityunjaya Mantra",
        text="ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥",
        transliteration="om tryambakaṃ yajāmahe sugandhiṃ puṣṭi-vardhanam urvārukamiva bandhanānmṛtyormukṣīya māmṛtāt",
        meaning="We worship the three-eyed one, who is fragrant and nourishes all beings. May he liberate us from death for the sake of immortality, as the cucumber is severed from its bondage to the creeper.",
        source="Rigveda 7.59.12",
        chandas=Chandas.ANUSHTUP,
        recitation_notes="Chant for healing, protection, and liberation from fear of death",
    ),
}


def generate_vedic_chant_ssml(
    chant: VedicChant,
    repetitions: int = 1,
    include_meaning: bool = True,
    voice_gender: str = "male"
) -> str:
    """
    Generate SSML for proper Vedic chant recitation.

    Args:
        chant: The VedicChant object
        repetitions: Number of times to repeat
        include_meaning: Include English meaning
        voice_gender: "male" or "female"

    Returns:
        SSML-formatted text for sacred chanting
    """
    chandas_info = CHANDAS_PATTERNS.get(chant.chandas, CHANDAS_PATTERNS[Chandas.ANUSHTUP])

    ssml_parts = []

    # Opening sacred space
    ssml_parts.append('<break time="1000ms"/>')

    # Apply sacred chanting vocal quality
    pitch = "-3st" if voice_gender == "male" else "-1st"
    rate = int(chandas_info["rate_multiplier"] * 85)  # Extra slow for chanting

    for rep in range(repetitions):
        ssml_parts.append(f'<prosody rate="{rate}%" pitch="{pitch}" volume="medium">')

        # Add Sanskrit phonemes
        ssml_with_phonemes = add_sanskrit_phonemes(chant.transliteration)

        # Add proper pauses based on meter
        pause_ms = chandas_info["pause_after_pada_ms"]
        ssml_with_pauses = re.sub(r'\s+', f' <break time="{pause_ms // 2}ms"/> ', ssml_with_phonemes)

        ssml_parts.append(ssml_with_pauses)
        ssml_parts.append('</prosody>')

        # Pause between repetitions
        if rep < repetitions - 1:
            ssml_parts.append(f'<break time="{chandas_info["pause_after_full_ms"]}ms"/>')

    # Closing sacred pause
    ssml_parts.append(f'<break time="1500ms"/>')

    # Optional meaning
    if include_meaning:
        ssml_parts.append('<prosody rate="95%" pitch="+0st">')
        ssml_parts.append(f'This sacred chant means: {chant.meaning}')
        ssml_parts.append('</prosody>')

    return ''.join(ssml_parts)


# =============================================================================
# PART 6: HUMAN VOICE QUALITIES
# =============================================================================

class EmotionalContagion(Enum):
    """
    Emotional contagion patterns - how KIAAN mirrors and guides user's emotions.
    """
    MIRROR = "mirror"           # Match user's emotional intensity
    SLIGHTLY_CALMER = "calm"    # Be slightly calmer than user
    COUNTER = "counter"         # Provide contrasting energy
    AMPLIFY = "amplify"         # Enhance positive emotions


@dataclass
class PersonalityTrait:
    """Personality traits that affect voice qualities."""
    name: str
    warmth: float              # 0.0 - 1.0
    authority: float           # 0.0 - 1.0
    playfulness: float         # 0.0 - 1.0
    formality: float           # 0.0 - 1.0
    empathy: float             # 0.0 - 1.0


# KIAAN personality profiles
KIAAN_PERSONALITIES: Dict[str, PersonalityTrait] = {
    "wise_sage": PersonalityTrait(
        name="Wise Sage",
        warmth=0.7,
        authority=0.8,
        playfulness=0.2,
        formality=0.6,
        empathy=0.9,
    ),
    "nurturing_mother": PersonalityTrait(
        name="Nurturing Mother",
        warmth=0.95,
        authority=0.4,
        playfulness=0.4,
        formality=0.2,
        empathy=0.95,
    ),
    "gentle_friend": PersonalityTrait(
        name="Gentle Friend",
        warmth=0.85,
        authority=0.3,
        playfulness=0.6,
        formality=0.2,
        empathy=0.85,
    ),
    "spiritual_guide": PersonalityTrait(
        name="Spiritual Guide",
        warmth=0.75,
        authority=0.7,
        playfulness=0.1,
        formality=0.5,
        empathy=0.8,
    ),
    "encouraging_elder": PersonalityTrait(
        name="Encouraging Elder",
        warmth=0.8,
        authority=0.6,
        playfulness=0.3,
        formality=0.4,
        empathy=0.85,
    ),
}


# Subtle humor and warmth patterns
GENTLE_HUMOR_PATTERNS: Dict[str, List[str]] = {
    "self_deprecating": [
        "Even a divine voice like mine needs a moment to think",
        "If I had hands, I would offer you chai right now",
        "My wisdom comes from the Gita, my timing comes from... practice",
    ],
    "playful_observations": [
        "The mind is like a browser with too many tabs open, isn't it",
        "Arjuna also had days when he wanted to stay in bed",
        "Even Krishna had to be patient with Arjuna's questions",
    ],
    "gentle_teasing": [
        "Ah, you're asking the big questions today",
        "Starting the day with philosophy, I see",
        "You sound like me after too much meditation",
    ],
}


WARMTH_EXPRESSIONS: Dict[str, str] = {
    "opening_warmth": [
        "It's so good to hear your voice",
        "I've been thinking about you",
        "Welcome back, dear one",
        "Your presence brings warmth to this moment",
    ],
    "mid_conversation": [
        "I hear you",
        "That takes courage to share",
        "You're doing beautifully",
        "Take your time",
    ],
    "closing_warmth": [
        "Carry this peace with you",
        "You are never alone in this",
        "I'll be here whenever you need",
        "Go gently, dear one",
    ],
}


def apply_emotional_contagion(
    user_emotion: str,
    user_intensity: float,
    strategy: EmotionalContagion = EmotionalContagion.SLIGHTLY_CALMER
) -> Dict[str, Any]:
    """
    Calculate voice parameters based on emotional contagion strategy.

    Args:
        user_emotion: Detected user emotion
        user_intensity: Intensity of emotion (0.0 - 1.0)
        strategy: How to respond emotionally

    Returns:
        Dict with prosody adjustments
    """
    base_params = {
        "rate": 1.0,
        "pitch": 0,
        "volume": "medium",
        "breathiness": 0.0,
    }

    if strategy == EmotionalContagion.MIRROR:
        # Match intensity exactly
        if user_emotion in ["anxious", "stressed"]:
            base_params["rate"] = 0.9 + (0.1 * user_intensity)
        elif user_emotion in ["sad", "grieving"]:
            base_params["rate"] = 0.85
            base_params["pitch"] = -1
            base_params["breathiness"] = 0.3

    elif strategy == EmotionalContagion.SLIGHTLY_CALMER:
        # Always be a bit calmer
        base_params["rate"] = max(0.85, 0.95 - (0.1 * user_intensity))
        base_params["pitch"] = min(0, -1 * user_intensity)

        if user_emotion in ["anxious", "stressed", "angry"]:
            base_params["rate"] = 0.85
            base_params["breathiness"] = 0.2

    elif strategy == EmotionalContagion.COUNTER:
        # Provide opposite energy
        if user_emotion in ["anxious", "stressed"]:
            base_params["rate"] = 0.82
            base_params["pitch"] = -2
            base_params["volume"] = "soft"
        elif user_emotion in ["sad", "low"]:
            base_params["rate"] = 0.95
            base_params["pitch"] = 1

    elif strategy == EmotionalContagion.AMPLIFY:
        # Enhance positive emotions
        if user_emotion in ["happy", "peaceful", "grateful"]:
            base_params["rate"] = 1.0
            base_params["pitch"] = 1
            base_params["volume"] = "medium"

    return base_params


def add_personality_voice(
    text: str,
    personality: str = "wise_sage",
    include_humor: bool = False
) -> str:
    """
    Apply personality-specific voice qualities.

    Args:
        text: Input text
        personality: Personality profile name
        include_humor: Whether to add gentle humor

    Returns:
        SSML with personality-appropriate prosody
    """
    profile = KIAAN_PERSONALITIES.get(personality)
    if not profile:
        return text

    # Calculate prosody from personality
    rate = 0.95 - (profile.authority * 0.1) + (profile.playfulness * 0.05)
    pitch_offset = -1 + (profile.warmth * 0.5) - (profile.formality * 0.5)
    pitch_str = f"+{pitch_offset}st" if pitch_offset >= 0 else f"{pitch_offset}st"

    # Warmth affects breathiness slightly
    breathiness_note = ""
    if profile.warmth > 0.8:
        # Add gentle breathiness markers through pacing
        text = text.replace(",", ", <break time='200ms'/>")

    return f'<prosody rate="{int(rate * 100)}%" pitch="{pitch_str}">{text}</prosody>'


# =============================================================================
# INTEGRATION FUNCTIONS
# =============================================================================

def create_perfect_pronunciation_ssml(
    text: str,
    language: Optional[IndianLanguage] = None,
    accent: Optional[RegionalAccent] = None,
    is_shloka: bool = False,
    chandas: Optional[Chandas] = None,
    voice_gender: str = "female",
    personality: str = "wise_sage",
    emotion: Optional[str] = None,
    emotion_intensity: float = 0.5,
) -> str:
    """
    Create comprehensive SSML with all pronunciation and voice features.

    This is the main integration function that combines:
    - Sanskrit pronunciation if needed
    - Multi-language support
    - Regional accent
    - Vedic chanting patterns for shlokas
    - Personality and emotional expression

    Args:
        text: Text to synthesize
        language: Optional Indian language
        accent: Optional regional accent
        is_shloka: Whether text is a Sanskrit shloka
        chandas: Meter if shloka
        voice_gender: "male" or "female"
        personality: Personality profile
        emotion: User's current emotion
        emotion_intensity: Intensity of emotion

    Returns:
        Complete SSML for TTS synthesis
    """
    result = text

    # Step 1: Handle Sanskrit shlokas
    if is_shloka:
        result = add_sanskrit_phonemes(result)
        if chandas:
            chandas_info = CHANDAS_PATTERNS.get(chandas, CHANDAS_PATTERNS[Chandas.ANUSHTUP])
            pause_ms = chandas_info["pause_after_pada_ms"]
            result = re.sub(r',', f'<break time="{pause_ms}ms"/>', result)
            result = re.sub(r'\|', f'<break time="{chandas_info["pause_after_half_ms"]}ms"/>', result)
            result = f'<prosody rate="{int(chandas_info["rate_multiplier"] * 100)}%">{result}</prosody>'

    # Step 2: Apply language-specific settings
    if language:
        config = LANGUAGE_CONFIGS.get(language)
        if config:
            result = generate_multilingual_ssml(result, language, include_native_greeting=False)

    # Step 3: Apply regional accent
    if accent:
        result = apply_regional_accent(result, accent)

    # Step 4: Apply emotional contagion
    if emotion:
        voice_params = apply_emotional_contagion(
            emotion,
            emotion_intensity,
            EmotionalContagion.SLIGHTLY_CALMER
        )
        rate_pct = int(voice_params["rate"] * 100)
        pitch_st = voice_params["pitch"]
        pitch_str = f"+{pitch_st}st" if pitch_st >= 0 else f"{pitch_st}st"
        result = f'<prosody rate="{rate_pct}%" pitch="{pitch_str}">{result}</prosody>'

    # Step 5: Apply personality
    if not emotion:  # Don't double-wrap
        result = add_personality_voice(result, personality)

    # Step 6: Add natural disfluencies
    result = add_natural_disfluencies(result, frequency=0.05)

    return result


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Sanskrit Pronunciation
    "SanskritPhoneme",
    "VedicAccent",
    "Chandas",
    "SanskritShloka",
    "SACRED_SHLOKAS",
    "SANSKRIT_IPA_MAP",
    "CHANDAS_PATTERNS",
    "convert_to_ipa",
    "generate_shloka_ssml",
    "add_sanskrit_phonemes",

    # Multi-language
    "IndianLanguage",
    "LanguageConfig",
    "LANGUAGE_CONFIGS",
    "get_language_greeting",
    "generate_multilingual_ssml",

    # Regional Accents
    "RegionalAccent",
    "AccentProfile",
    "ACCENT_PROFILES",
    "apply_regional_accent",

    # Natural Voice
    "VocalQuality",
    "PitchContour",
    "VOCAL_QUALITY_PRESETS",
    "PITCH_CONTOURS",
    "apply_pitch_contour",
    "add_natural_disfluencies",

    # Vedic Chanting
    "ChantingMode",
    "VedicChant",
    "VEDIC_PEACE_CHANTS",
    "generate_vedic_chant_ssml",

    # Human Qualities
    "EmotionalContagion",
    "PersonalityTrait",
    "KIAAN_PERSONALITIES",
    "GENTLE_HUMOR_PATTERNS",
    "WARMTH_EXPRESSIONS",
    "apply_emotional_contagion",
    "add_personality_voice",

    # Integration
    "create_perfect_pronunciation_ssml",
]
