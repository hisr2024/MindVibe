"""Microsoft Edge TTS Service - Free High-Quality Neural Voices

Completely free TTS using Microsoft Edge's online neural voice service.
No API key, no subscription, no cost. Quality ~8.5-9/10.

Supports 400+ voices across 100+ languages including:
- Hindi (hi-IN): SwaraNeural (female), MadhurNeural (male)
- Tamil (ta-IN): PallaviNeural (female), ValluvarNeural (male)
- Telugu (te-IN): ShrutiNeural (female), MohanNeural (male)
- Bengali (bn-IN): TanishaaNeural (female), BashkarNeural (male)
- Kannada (kn-IN): SapnaNeural (female), GaganNeural (male)
- Malayalam (ml-IN): SobhanaNeural (female), MidhunNeural (male)
- Marathi (mr-IN): AarohiNeural (female), ManoharNeural (male)
- Gujarati (gu-IN): DhwaniNeural (female), NiranjanNeural (male)
- English Indian (en-IN): NeerjaNeural (female), PrabhatNeural (male)
- English US (en-US): JennyNeural, AriaNeural, GuyNeural, etc.
- Spanish (es-ES), French (fr-FR), German (de-DE), Portuguese (pt-BR)
- Italian (it-IT), Dutch (nl-NL), Polish (pl-PL), Swedish (sv-SE)
- Russian (ru-RU), Japanese (ja-JP), Chinese (zh-CN), Korean (ko-KR)
- Thai (th-TH), Vietnamese (vi-VN), Indonesian (id-ID), Arabic (ar-SA)
- Turkish (tr-TR), Swahili (sw-KE), Punjabi (pa-IN)

Provider Priority in MindVibe:
  ElevenLabs → Sarvam AI → Edge TTS → Browser
"""

import io
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ─── Edge TTS Voice Catalog ──────────────────────────────────────────────────
# Best neural voices selected for MindVibe's spiritual wellness context.
# Each voice is chosen for warmth, clarity, and emotional expressiveness.

EDGE_VOICES: dict[str, dict[str, Any]] = {
    # ─── Hindi ────────────────────────────────────────────────────────
    "hi_female_warm": {
        "voice_id": "hi-IN-SwaraNeural",
        "gender": "female",
        "style": "warm",
        "language": "hi-IN",
        "quality_score": 8.8,
        "description": "Warm, expressive Hindi female voice",
    },
    "hi_male_deep": {
        "voice_id": "hi-IN-MadhurNeural",
        "gender": "male",
        "style": "deep",
        "language": "hi-IN",
        "quality_score": 8.7,
        "description": "Deep, resonant Hindi male voice",
    },
    # ─── Tamil ────────────────────────────────────────────────────────
    "ta_female_clear": {
        "voice_id": "ta-IN-PallaviNeural",
        "gender": "female",
        "style": "clear",
        "language": "ta-IN",
        "quality_score": 8.6,
        "description": "Clear, articulate Tamil female voice",
    },
    "ta_male_wise": {
        "voice_id": "ta-IN-ValluvarNeural",
        "gender": "male",
        "style": "wise",
        "language": "ta-IN",
        "quality_score": 8.5,
        "description": "Wise, grounded Tamil male voice",
    },
    # ─── Telugu ───────────────────────────────────────────────────────
    "te_female_soft": {
        "voice_id": "te-IN-ShrutiNeural",
        "gender": "female",
        "style": "soft",
        "language": "te-IN",
        "quality_score": 8.6,
        "description": "Soft, melodic Telugu female voice",
    },
    "te_male_calm": {
        "voice_id": "te-IN-MohanNeural",
        "gender": "male",
        "style": "calm",
        "language": "te-IN",
        "quality_score": 8.5,
        "description": "Calm, steady Telugu male voice",
    },
    # ─── Bengali ──────────────────────────────────────────────────────
    "bn_female_gentle": {
        "voice_id": "bn-IN-TanishaaNeural",
        "gender": "female",
        "style": "gentle",
        "language": "bn-IN",
        "quality_score": 8.5,
        "description": "Gentle, soothing Bengali female voice",
    },
    "bn_male_warm": {
        "voice_id": "bn-IN-BashkarNeural",
        "gender": "male",
        "style": "warm",
        "language": "bn-IN",
        "quality_score": 8.4,
        "description": "Warm, engaging Bengali male voice",
    },
    # ─── Kannada ──────────────────────────────────────────────────────
    "kn_female_bright": {
        "voice_id": "kn-IN-SapnaNeural",
        "gender": "female",
        "style": "bright",
        "language": "kn-IN",
        "quality_score": 8.5,
        "description": "Bright, cheerful Kannada female voice",
    },
    "kn_male_steady": {
        "voice_id": "kn-IN-GaganNeural",
        "gender": "male",
        "style": "steady",
        "language": "kn-IN",
        "quality_score": 8.4,
        "description": "Steady, reliable Kannada male voice",
    },
    # ─── Malayalam ─────────────────────────────────────────────────────
    "ml_female_serene": {
        "voice_id": "ml-IN-SobhanaNeural",
        "gender": "female",
        "style": "serene",
        "language": "ml-IN",
        "quality_score": 8.5,
        "description": "Serene, flowing Malayalam female voice",
    },
    "ml_male_calm": {
        "voice_id": "ml-IN-MidhunNeural",
        "gender": "male",
        "style": "calm",
        "language": "ml-IN",
        "quality_score": 8.4,
        "description": "Calm, measured Malayalam male voice",
    },
    # ─── Marathi ──────────────────────────────────────────────────────
    "mr_female_warm": {
        "voice_id": "mr-IN-AarohiNeural",
        "gender": "female",
        "style": "warm",
        "language": "mr-IN",
        "quality_score": 8.5,
        "description": "Warm, expressive Marathi female voice",
    },
    "mr_male_strong": {
        "voice_id": "mr-IN-ManoharNeural",
        "gender": "male",
        "style": "strong",
        "language": "mr-IN",
        "quality_score": 8.4,
        "description": "Strong, authoritative Marathi male voice",
    },
    # ─── Gujarati ─────────────────────────────────────────────────────
    "gu_female_sweet": {
        "voice_id": "gu-IN-DhwaniNeural",
        "gender": "female",
        "style": "sweet",
        "language": "gu-IN",
        "quality_score": 8.5,
        "description": "Sweet, melodious Gujarati female voice",
    },
    "gu_male_calm": {
        "voice_id": "gu-IN-NiranjanNeural",
        "gender": "male",
        "style": "calm",
        "language": "gu-IN",
        "quality_score": 8.4,
        "description": "Calm, composed Gujarati male voice",
    },
    # ─── English (Indian) ─────────────────────────────────────────────
    "en_in_female_warm": {
        "voice_id": "en-IN-NeerjaNeural",
        "gender": "female",
        "style": "warm",
        "language": "en-IN",
        "quality_score": 8.8,
        "description": "Warm, natural Indian English female voice",
    },
    "en_in_male_clear": {
        "voice_id": "en-IN-PrabhatNeural",
        "gender": "male",
        "style": "clear",
        "language": "en-IN",
        "quality_score": 8.7,
        "description": "Clear, professional Indian English male voice",
    },
    # ─── English (US) ─────────────────────────────────────────────────
    "en_us_female_friendly": {
        "voice_id": "en-US-JennyNeural",
        "gender": "female",
        "style": "friendly",
        "language": "en-US",
        "quality_score": 9.0,
        "description": "Friendly, natural US English female voice",
    },
    "en_us_female_expressive": {
        "voice_id": "en-US-AriaNeural",
        "gender": "female",
        "style": "expressive",
        "language": "en-US",
        "quality_score": 9.0,
        "description": "Expressive, dynamic US English female voice",
    },
    "en_us_male_warm": {
        "voice_id": "en-US-GuyNeural",
        "gender": "male",
        "style": "warm",
        "language": "en-US",
        "quality_score": 8.9,
        "description": "Warm, conversational US English male voice",
    },
    # ─── Spanish ─────────────────────────────────────────────────────
    "es_female_warm": {
        "voice_id": "es-ES-ElviraNeural",
        "gender": "female",
        "style": "warm",
        "language": "es-ES",
        "quality_score": 8.6,
        "description": "Warm, expressive Spanish female voice",
    },
    "es_male_calm": {
        "voice_id": "es-ES-AlvaroNeural",
        "gender": "male",
        "style": "calm",
        "language": "es-ES",
        "quality_score": 8.5,
        "description": "Calm, steady Spanish male voice",
    },
    # ─── French ──────────────────────────────────────────────────────
    "fr_female_clear": {
        "voice_id": "fr-FR-DeniseNeural",
        "gender": "female",
        "style": "clear",
        "language": "fr-FR",
        "quality_score": 8.7,
        "description": "Clear, elegant French female voice",
    },
    "fr_male_warm": {
        "voice_id": "fr-FR-HenriNeural",
        "gender": "male",
        "style": "warm",
        "language": "fr-FR",
        "quality_score": 8.5,
        "description": "Warm, articulate French male voice",
    },
    # ─── German ──────────────────────────────────────────────────────
    "de_female_clear": {
        "voice_id": "de-DE-KatjaNeural",
        "gender": "female",
        "style": "clear",
        "language": "de-DE",
        "quality_score": 8.6,
        "description": "Clear, professional German female voice",
    },
    "de_male_calm": {
        "voice_id": "de-DE-ConradNeural",
        "gender": "male",
        "style": "calm",
        "language": "de-DE",
        "quality_score": 8.5,
        "description": "Calm, composed German male voice",
    },
    # ─── Portuguese ──────────────────────────────────────────────────
    "pt_female_warm": {
        "voice_id": "pt-BR-FranciscaNeural",
        "gender": "female",
        "style": "warm",
        "language": "pt-BR",
        "quality_score": 8.7,
        "description": "Warm, natural Portuguese female voice",
    },
    "pt_male_calm": {
        "voice_id": "pt-BR-AntonioNeural",
        "gender": "male",
        "style": "calm",
        "language": "pt-BR",
        "quality_score": 8.5,
        "description": "Calm, clear Portuguese male voice",
    },
    # ─── Italian ─────────────────────────────────────────────────────
    "it_female_warm": {
        "voice_id": "it-IT-ElsaNeural",
        "gender": "female",
        "style": "warm",
        "language": "it-IT",
        "quality_score": 8.6,
        "description": "Warm, expressive Italian female voice",
    },
    "it_male_calm": {
        "voice_id": "it-IT-DiegoNeural",
        "gender": "male",
        "style": "calm",
        "language": "it-IT",
        "quality_score": 8.5,
        "description": "Calm, measured Italian male voice",
    },
    # ─── Dutch ───────────────────────────────────────────────────────
    "nl_female_clear": {
        "voice_id": "nl-NL-ColetteNeural",
        "gender": "female",
        "style": "clear",
        "language": "nl-NL",
        "quality_score": 8.5,
        "description": "Clear, friendly Dutch female voice",
    },
    "nl_male_calm": {
        "voice_id": "nl-NL-MaartenNeural",
        "gender": "male",
        "style": "calm",
        "language": "nl-NL",
        "quality_score": 8.4,
        "description": "Calm, steady Dutch male voice",
    },
    # ─── Polish ──────────────────────────────────────────────────────
    "pl_female_clear": {
        "voice_id": "pl-PL-AgnieszkaNeural",
        "gender": "female",
        "style": "clear",
        "language": "pl-PL",
        "quality_score": 8.5,
        "description": "Clear, articulate Polish female voice",
    },
    "pl_male_calm": {
        "voice_id": "pl-PL-MarekNeural",
        "gender": "male",
        "style": "calm",
        "language": "pl-PL",
        "quality_score": 8.4,
        "description": "Calm, measured Polish male voice",
    },
    # ─── Swedish ─────────────────────────────────────────────────────
    "sv_female_soft": {
        "voice_id": "sv-SE-SofieNeural",
        "gender": "female",
        "style": "soft",
        "language": "sv-SE",
        "quality_score": 8.5,
        "description": "Soft, gentle Swedish female voice",
    },
    "sv_male_calm": {
        "voice_id": "sv-SE-MattiasNeural",
        "gender": "male",
        "style": "calm",
        "language": "sv-SE",
        "quality_score": 8.4,
        "description": "Calm, composed Swedish male voice",
    },
    # ─── Russian ─────────────────────────────────────────────────────
    "ru_female_warm": {
        "voice_id": "ru-RU-SvetlanaNeural",
        "gender": "female",
        "style": "warm",
        "language": "ru-RU",
        "quality_score": 8.6,
        "description": "Warm, expressive Russian female voice",
    },
    "ru_male_calm": {
        "voice_id": "ru-RU-DmitryNeural",
        "gender": "male",
        "style": "calm",
        "language": "ru-RU",
        "quality_score": 8.5,
        "description": "Calm, deep Russian male voice",
    },
    # ─── Japanese ────────────────────────────────────────────────────
    "ja_female_soft": {
        "voice_id": "ja-JP-NanamiNeural",
        "gender": "female",
        "style": "soft",
        "language": "ja-JP",
        "quality_score": 8.7,
        "description": "Soft, gentle Japanese female voice",
    },
    "ja_male_calm": {
        "voice_id": "ja-JP-KeitaNeural",
        "gender": "male",
        "style": "calm",
        "language": "ja-JP",
        "quality_score": 8.5,
        "description": "Calm, composed Japanese male voice",
    },
    # ─── Chinese ─────────────────────────────────────────────────────
    "zh_female_warm": {
        "voice_id": "zh-CN-XiaoxiaoNeural",
        "gender": "female",
        "style": "warm",
        "language": "zh-CN",
        "quality_score": 8.8,
        "description": "Warm, natural Chinese female voice",
    },
    "zh_male_calm": {
        "voice_id": "zh-CN-YunxiNeural",
        "gender": "male",
        "style": "calm",
        "language": "zh-CN",
        "quality_score": 8.6,
        "description": "Calm, clear Chinese male voice",
    },
    # ─── Korean ──────────────────────────────────────────────────────
    "ko_female_warm": {
        "voice_id": "ko-KR-SunHiNeural",
        "gender": "female",
        "style": "warm",
        "language": "ko-KR",
        "quality_score": 8.6,
        "description": "Warm, friendly Korean female voice",
    },
    "ko_male_calm": {
        "voice_id": "ko-KR-InJoonNeural",
        "gender": "male",
        "style": "calm",
        "language": "ko-KR",
        "quality_score": 8.5,
        "description": "Calm, steady Korean male voice",
    },
    # ─── Thai ────────────────────────────────────────────────────────
    "th_female_warm": {
        "voice_id": "th-TH-PremwadeeNeural",
        "gender": "female",
        "style": "warm",
        "language": "th-TH",
        "quality_score": 8.5,
        "description": "Warm, gentle Thai female voice",
    },
    "th_male_calm": {
        "voice_id": "th-TH-NiwatNeural",
        "gender": "male",
        "style": "calm",
        "language": "th-TH",
        "quality_score": 8.4,
        "description": "Calm, clear Thai male voice",
    },
    # ─── Vietnamese ──────────────────────────────────────────────────
    "vi_female_warm": {
        "voice_id": "vi-VN-HoaiMyNeural",
        "gender": "female",
        "style": "warm",
        "language": "vi-VN",
        "quality_score": 8.5,
        "description": "Warm, expressive Vietnamese female voice",
    },
    "vi_male_calm": {
        "voice_id": "vi-VN-NamMinhNeural",
        "gender": "male",
        "style": "calm",
        "language": "vi-VN",
        "quality_score": 8.4,
        "description": "Calm, steady Vietnamese male voice",
    },
    # ─── Indonesian ──────────────────────────────────────────────────
    "id_female_warm": {
        "voice_id": "id-ID-GadisNeural",
        "gender": "female",
        "style": "warm",
        "language": "id-ID",
        "quality_score": 8.5,
        "description": "Warm, natural Indonesian female voice",
    },
    "id_male_calm": {
        "voice_id": "id-ID-ArdiNeural",
        "gender": "male",
        "style": "calm",
        "language": "id-ID",
        "quality_score": 8.4,
        "description": "Calm, clear Indonesian male voice",
    },
    # ─── Arabic ──────────────────────────────────────────────────────
    "ar_female_warm": {
        "voice_id": "ar-SA-ZariyahNeural",
        "gender": "female",
        "style": "warm",
        "language": "ar-SA",
        "quality_score": 8.5,
        "description": "Warm, graceful Arabic female voice",
    },
    "ar_male_calm": {
        "voice_id": "ar-SA-HamedNeural",
        "gender": "male",
        "style": "calm",
        "language": "ar-SA",
        "quality_score": 8.5,
        "description": "Calm, authoritative Arabic male voice",
    },
    # ─── Turkish ─────────────────────────────────────────────────────
    "tr_female_warm": {
        "voice_id": "tr-TR-EmelNeural",
        "gender": "female",
        "style": "warm",
        "language": "tr-TR",
        "quality_score": 8.5,
        "description": "Warm, expressive Turkish female voice",
    },
    "tr_male_calm": {
        "voice_id": "tr-TR-AhmetNeural",
        "gender": "male",
        "style": "calm",
        "language": "tr-TR",
        "quality_score": 8.4,
        "description": "Calm, steady Turkish male voice",
    },
    # ─── Swahili ─────────────────────────────────────────────────────
    "sw_female_warm": {
        "voice_id": "sw-KE-ZuriNeural",
        "gender": "female",
        "style": "warm",
        "language": "sw-KE",
        "quality_score": 8.4,
        "description": "Warm, friendly Swahili female voice",
    },
    "sw_male_calm": {
        "voice_id": "sw-KE-RafikiNeural",
        "gender": "male",
        "style": "calm",
        "language": "sw-KE",
        "quality_score": 8.3,
        "description": "Calm, steady Swahili male voice",
    },
    # ─── Punjabi ─────────────────────────────────────────────────────
    "pa_female_warm": {
        "voice_id": "pa-IN-OjasNeural",
        "gender": "female",
        "style": "warm",
        "language": "pa-IN",
        "quality_score": 8.4,
        "description": "Warm, expressive Punjabi female voice",
    },
    "pa_male_calm": {
        "voice_id": "pa-IN-OjasNeural",
        "gender": "male",
        "style": "calm",
        "language": "pa-IN",
        "quality_score": 8.3,
        "description": "Calm, steady Punjabi male voice",
    },
}


# ─── Language → Voice Mapping ─────────────────────────────────────────────────
# Default voice selection per language (female preferred for warmth).

EDGE_LANGUAGE_VOICES: dict[str, str] = {
    "hi": "hi-IN-SwaraNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "ta": "ta-IN-PallaviNeural",
    "ta-IN": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "te-IN": "te-IN-ShrutiNeural",
    "bn": "bn-IN-TanishaaNeural",
    "bn-IN": "bn-IN-TanishaaNeural",
    "kn": "kn-IN-SapnaNeural",
    "kn-IN": "kn-IN-SapnaNeural",
    "ml": "ml-IN-SobhanaNeural",
    "ml-IN": "ml-IN-SobhanaNeural",
    "mr": "mr-IN-AarohiNeural",
    "mr-IN": "mr-IN-AarohiNeural",
    "gu": "gu-IN-DhwaniNeural",
    "gu-IN": "gu-IN-DhwaniNeural",
    "pa": "pa-IN-GurpreetNeural",
    "pa-IN": "pa-IN-GurpreetNeural",
    "en": "en-IN-NeerjaNeural",
    "en-IN": "en-IN-NeerjaNeural",
    "en-US": "en-US-JennyNeural",
    "sa": "hi-IN-SwaraNeural",  # Sanskrit → Hindi voice (closest match)
    # International languages
    "es": "es-ES-ElviraNeural",
    "es-ES": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "fr-FR": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "de-DE": "de-DE-KatjaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "pt-BR": "pt-BR-FranciscaNeural",
    "it": "it-IT-ElsaNeural",
    "it-IT": "it-IT-ElsaNeural",
    "nl": "nl-NL-ColetteNeural",
    "nl-NL": "nl-NL-ColetteNeural",
    "pl": "pl-PL-AgnieszkaNeural",
    "pl-PL": "pl-PL-AgnieszkaNeural",
    "sv": "sv-SE-SofieNeural",
    "sv-SE": "sv-SE-SofieNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "ru-RU": "ru-RU-SvetlanaNeural",
    "ja": "ja-JP-NanamiNeural",
    "ja-JP": "ja-JP-NanamiNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "zh-CN": "zh-CN-XiaoxiaoNeural",
    "ko": "ko-KR-SunHiNeural",
    "ko-KR": "ko-KR-SunHiNeural",
    "th": "th-TH-PremwadeeNeural",
    "th-TH": "th-TH-PremwadeeNeural",
    "vi": "vi-VN-HoaiMyNeural",
    "vi-VN": "vi-VN-HoaiMyNeural",
    "id": "id-ID-GadisNeural",
    "id-ID": "id-ID-GadisNeural",
    "ar": "ar-SA-ZariyahNeural",
    "ar-SA": "ar-SA-ZariyahNeural",
    "tr": "tr-TR-EmelNeural",
    "tr-TR": "tr-TR-EmelNeural",
    "sw": "sw-KE-ZuriNeural",
    "sw-KE": "sw-KE-ZuriNeural",
}

# Supported languages for Edge TTS
EDGE_SUPPORTED_LANGUAGES = set(EDGE_LANGUAGE_VOICES.keys())


# ─── Companion Voice → Edge Voice Mapping ────────────────────────────────────
# Maps KIAAN companion voice personas to the best Edge voice for that persona.

COMPANION_TO_EDGE_VOICE: dict[str, dict[str, str]] = {
    # Warm female personas → warm female voices per language
    "sarvam-aura": {"hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural", "ta": "ta-IN-PallaviNeural", "te": "te-IN-ShrutiNeural", "bn": "bn-IN-TanishaaNeural", "default": "en-IN-NeerjaNeural"},
    "priya": {"hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural", "default": "en-IN-NeerjaNeural"},
    "meera": {"hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural", "default": "en-IN-NeerjaNeural"},
    "maya": {"hi": "hi-IN-SwaraNeural", "en": "en-US-AriaNeural", "default": "en-US-AriaNeural"},
    "kavya": {"hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural", "default": "hi-IN-SwaraNeural"},
    # Deep male personas → deep male voices per language
    "sarvam-rishi": {"hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural", "ta": "ta-IN-ValluvarNeural", "te": "te-IN-MohanNeural", "default": "en-IN-PrabhatNeural"},
    "arjun": {"hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural", "default": "en-IN-PrabhatNeural"},
    "arvind": {"hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural", "default": "en-IN-PrabhatNeural"},
    "vikram": {"hi": "hi-IN-MadhurNeural", "en": "en-US-GuyNeural", "default": "hi-IN-MadhurNeural"},
    # Conversational personas
    "elevenlabs-nova": {"hi": "hi-IN-SwaraNeural", "en": "en-US-JennyNeural", "default": "en-US-JennyNeural"},
    "elevenlabs-orion": {"hi": "hi-IN-MadhurNeural", "en": "en-US-GuyNeural", "default": "en-US-GuyNeural"},
    "rohan": {"hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural", "default": "en-IN-PrabhatNeural"},
    "karthik": {"hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural", "default": "en-IN-PrabhatNeural"},
    # Divine personas
    "divine-krishna": {"hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural", "default": "hi-IN-MadhurNeural"},
    "divine-saraswati": {"hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural", "default": "hi-IN-SwaraNeural"},
    "divine-ganga": {"hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural", "default": "hi-IN-SwaraNeural"},
    "divine-shiva": {"hi": "hi-IN-MadhurNeural", "en": "en-US-GuyNeural", "default": "hi-IN-MadhurNeural"},
}


# ─── Emotion → Prosody Mapping ───────────────────────────────────────────────
# Edge TTS uses string prosody: rate="+0%", pitch="+0Hz", volume="+0%"

EDGE_EMOTION_PROSODY: dict[str, dict[str, str]] = {
    "neutral": {"rate": "+0%", "pitch": "+0Hz", "volume": "+0%"},
    "anxious": {"rate": "-15%", "pitch": "-2Hz", "volume": "-10%"},
    "sad": {"rate": "-12%", "pitch": "-2Hz", "volume": "-10%"},
    "angry": {"rate": "-8%", "pitch": "-4Hz", "volume": "+5%"},
    "confused": {"rate": "-5%", "pitch": "+0Hz", "volume": "+5%"},
    "lonely": {"rate": "-13%", "pitch": "+0Hz", "volume": "-10%"},
    "hopeful": {"rate": "+5%", "pitch": "+2Hz", "volume": "+10%"},
    "peaceful": {"rate": "-18%", "pitch": "-2Hz", "volume": "-15%"},
    "grateful": {"rate": "-5%", "pitch": "+2Hz", "volume": "+5%"},
    "overwhelmed": {"rate": "-20%", "pitch": "-2Hz", "volume": "-10%"},
    "excited": {"rate": "+10%", "pitch": "+4Hz", "volume": "+10%"},
    "hurt": {"rate": "-14%", "pitch": "-2Hz", "volume": "-10%"},
    "fearful": {"rate": "-16%", "pitch": "-2Hz", "volume": "-10%"},
    "frustrated": {"rate": "-9%", "pitch": "-2Hz", "volume": "+5%"},
    "stressed": {"rate": "-18%", "pitch": "-2Hz", "volume": "-10%"},
    "devotional": {"rate": "-22%", "pitch": "-4Hz", "volume": "-10%"},
    "meditative": {"rate": "-30%", "pitch": "-4Hz", "volume": "-20%"},
    "blissful": {"rate": "-18%", "pitch": "+2Hz", "volume": "+0%"},
}


def is_edge_tts_available() -> bool:
    """Check if edge-tts package is installed."""
    try:
        import edge_tts  # noqa: F401
        return True
    except ImportError:
        return False


def is_edge_supported_language(language: str) -> bool:
    """Check if Edge TTS supports this language."""
    return language in EDGE_SUPPORTED_LANGUAGES


def _get_edge_voice(voice_id: str, language: str) -> str:
    """Get the best Edge TTS voice for a companion persona + language."""
    persona_voices = COMPANION_TO_EDGE_VOICE.get(voice_id, {})
    if language in persona_voices:
        return persona_voices[language]
    if "default" in persona_voices:
        return persona_voices["default"]
    return EDGE_LANGUAGE_VOICES.get(language, "en-IN-NeerjaNeural")


# ─── Language Code → Edge TTS Locale Mapping ─────────────────────────────────
# Maps MindVibe short language codes to Edge TTS locale prefixes.

_LANG_TO_EDGE_LOCALE: dict[str, str] = {
    "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN", "bn": "bn-IN",
    "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN", "gu": "gu-IN",
    "pa": "pa-IN", "en": "en-IN",
    "es": "es-ES", "fr": "fr-FR", "de": "de-DE", "pt": "pt-BR",
    "it": "it-IT", "nl": "nl-NL", "pl": "pl-PL", "sv": "sv-SE",
    "ru": "ru-RU", "ja": "ja-JP", "zh": "zh-CN", "ko": "ko-KR",
    "th": "th-TH", "vi": "vi-VN", "id": "id-ID", "ar": "ar-SA",
    "tr": "tr-TR", "sw": "sw-KE",
}


def _get_edge_voice_for_language(language: str, gender: str = "female") -> Optional[str]:
    """Map a MindVibe language code to the correct Edge TTS voice_id.

    Searches EDGE_VOICES for a voice matching the target locale and gender.
    Falls back to any voice matching the locale if the requested gender
    is not available.

    Args:
        language: MindVibe language code (e.g. "es", "fr", "zh", "hi")
        gender: Preferred gender - "female" or "male" (default: "female")

    Returns:
        Edge TTS voice_id string (e.g. "es-ES-ElviraNeural") or None
        if no matching voice is found.

    Example:
        >>> _get_edge_voice_for_language("es", "female")
        'es-ES-ElviraNeural'
        >>> _get_edge_voice_for_language("zh", "male")
        'zh-CN-YunxiNeural'
    """
    # Resolve short language code to Edge locale prefix
    locale = _LANG_TO_EDGE_LOCALE.get(language, language)

    # Search EDGE_VOICES for matching locale + gender
    fallback_voice_id: Optional[str] = None
    for _key, voice_info in EDGE_VOICES.items():
        if voice_info["language"] == locale:
            if voice_info["gender"] == gender:
                return voice_info["voice_id"]
            # Track a fallback in case the requested gender isn't available
            if fallback_voice_id is None:
                fallback_voice_id = voice_info["voice_id"]

    # Return fallback (different gender) if exact match not found
    if fallback_voice_id:
        return fallback_voice_id

    return None


async def synthesize_edge_tts(
    text: str,
    language: str = "en",
    voice_id: str = "sarvam-aura",
    mood: str = "neutral",
) -> Optional[bytes]:
    """Synthesize speech using Microsoft Edge TTS (free, no API key).

    Uses Microsoft's Neural voice service via the edge-tts package.
    Quality is ~8.5-9/10 — close to Sarvam AI and ElevenLabs.

    Args:
        text: Text to synthesize (up to ~5000 chars)
        language: MindVibe language code (hi, ta, te, bn, en, etc.)
        voice_id: KIAAN companion voice persona
        mood: Detected user mood for prosody adaptation

    Returns:
        MP3 audio bytes or None if synthesis fails
    """
    try:
        import edge_tts
    except ImportError:
        logger.debug("Edge TTS: edge-tts package not installed")
        return None

    # Resolve voice
    edge_voice = _get_edge_voice(voice_id, language)

    # Get emotion prosody
    prosody = EDGE_EMOTION_PROSODY.get(mood, EDGE_EMOTION_PROSODY["neutral"])

    # Truncate text
    if len(text) > 5000:
        text = text[:4997] + "..."

    try:
        communicate = edge_tts.Communicate(
            text,
            edge_voice,
            rate=prosody["rate"],
            pitch=prosody["pitch"],
            volume=prosody["volume"],
        )

        # Collect audio chunks into bytes
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_bytes = audio_buffer.getvalue()

        if len(audio_bytes) > 100:
            logger.info(
                f"Edge TTS success: voice={edge_voice}, lang={language}, "
                f"mood={mood}, size={len(audio_bytes)} bytes"
            )
            return audio_bytes

        logger.warning("Edge TTS: Empty audio returned")
        return None

    except Exception as e:
        logger.warning(f"Edge TTS failed: {e}")
        return None


def get_edge_health_status() -> dict[str, Any]:
    """Get health status of Edge TTS service."""
    available = is_edge_tts_available()
    return {
        "provider": "edge_tts",
        "available": available,
        "cost": "free",
        "quality_score": 8.8 if available else 0,
        "supported_languages": list(EDGE_LANGUAGE_VOICES.keys()),
        "voices_count": len(EDGE_VOICES),
        "features": [
            "Free, no API key required",
            "Microsoft Neural voices",
            "10+ Indian languages + 18 international languages",
            "Emotion-adaptive prosody",
            "400+ voices worldwide",
        ] if available else [],
    }
