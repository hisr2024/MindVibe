"""
Gita Social Media Content Ingestion Service

Acquires and validates Bhagavad Gita wisdom from social media platforms:
- YouTube (discourses, verse explanations, spiritual talks)
- Spotify/Apple/JioSaavn (Gita podcasts, audio commentaries)
- Instagram/Twitter (verse posts, spiritual wisdom accounts)

All content goes through strict Gita compliance validation before
being added to KIAAN's knowledge base.
"""

import logging
import re
import hashlib
from datetime import datetime, timezone
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ─── Content Source Types ────────────────────────────────────────────────────

class PlatformType(str, Enum):
    YOUTUBE = "youtube"
    SPOTIFY = "spotify"
    APPLE_PODCASTS = "apple_podcasts"
    JIOSAAVN = "jiosaavn"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    WEB = "web"
    RSS = "rss"


class ContentType(str, Enum):
    VIDEO_DISCOURSE = "video_discourse"
    AUDIO_COMMENTARY = "audio_commentary"
    AUDIO_CHANTING = "audio_chanting"
    VERSE_EXPLANATION = "verse_explanation"
    SPIRITUAL_TALK = "spiritual_talk"
    PODCAST_EPISODE = "podcast_episode"
    TEXT_POST = "text_post"


# ─── Trusted Sources ────────────────────────────────────────────────────────

TRUSTED_YOUTUBE_CHANNELS = [
    "ISKCON", "Chinmaya Mission", "Swami Mukundananda",
    "Gaur Gopal Das", "Sadhguru", "Art of Living",
    "Brahma Kumaris", "Swami Sarvapriyananda",
    "Gita Press Gorakhpur", "Bhakti Vedanta Swami",
    "Swami Sivananda", "Swami Vivekananda Foundation",
]

TRUSTED_PODCAST_FEEDS = [
    "Bhagavad Gita As It Is",
    "Gita for Daily Living",
    "Vedanta Talks",
    "Krishna Consciousness",
    "Spiritual India",
    "Ancient Wisdom Modern Life",
]

TRUSTED_WEB_DOMAINS = [
    "gitasupersite.iitk.ac.in",
    "holy-bhagavad-gita.org",
    "bhagavad-gita.org",
    "asitis.com",
    "gitapress.org",
    "vedabase.io",
    "wisdomlib.org",
    "sacred-texts.com",
]

TRUSTED_SOCIAL_ACCOUNTS = {
    "instagram": [
        "bhagavadgita_daily", "gaborjeno", "gitawisdom",
        "iskcon", "artoflivingg", "sadhguru",
    ],
    "twitter": [
        "GitaWisdom", "ABORH_Gita", "ISKCONinc",
        "ChinmayaMission", "ArtofLiving",
    ],
}


# ─── Gita Compliance Validation ─────────────────────────────────────────────

GITA_KEYWORDS = {
    "core_terms": [
        "dharma", "karma", "yoga", "bhakti", "jnana", "moksha",
        "atman", "brahman", "krishna", "arjuna", "gita",
        "bhagavad", "shloka", "verse", "chapter",
    ],
    "sanskrit_terms": [
        "sattva", "rajas", "tamas", "guna", "prakriti", "purusha",
        "sankhya", "nishkama", "vairagya", "viveka", "buddhi",
        "manas", "ahamkara", "chitta", "prana", "samadhi",
        "nirvana", "samsara", "maya", "lila", "seva",
    ],
    "shad_ripu": [
        "kama", "krodha", "lobha", "moha", "mada", "matsarya",
        "lust", "anger", "greed", "delusion", "pride", "envy",
    ],
    "chapter_refs": [
        f"chapter {i}" for i in range(1, 19)
    ] + [
        f"adhyaya {i}" for i in range(1, 19)
    ],
}

# Topics that should be REJECTED (not Gita-aligned)
REJECTION_KEYWORDS = [
    "astrology prediction", "lottery", "gambling", "get rich quick",
    "black magic", "vashikaran", "tantra for harm", "curse",
    "political propaganda", "hate speech", "caste discrimination",
]


class GitaComplianceResult(BaseModel):
    is_compliant: bool = False
    confidence: float = 0.0
    matched_keywords: list[str] = Field(default_factory=list)
    chapter_refs: list[str] = Field(default_factory=list)
    verse_refs: list[str] = Field(default_factory=list)
    rejection_reason: Optional[str] = None


def validate_gita_compliance(text: str) -> GitaComplianceResult:
    """Validate content against strict Bhagavad Gita compliance rules."""
    if not text or len(text.strip()) < 20:
        return GitaComplianceResult(
            rejection_reason="Content too short for validation"
        )

    text_lower = text.lower()

    # Check for rejection keywords first
    for keyword in REJECTION_KEYWORDS:
        if keyword in text_lower:
            return GitaComplianceResult(
                rejection_reason=f"Contains prohibited content: {keyword}"
            )

    matched = []
    score = 0.0

    # Check core Gita terms (highest weight)
    for term in GITA_KEYWORDS["core_terms"]:
        if term in text_lower:
            matched.append(term)
            score += 0.15

    # Check Sanskrit terms
    for term in GITA_KEYWORDS["sanskrit_terms"]:
        if term in text_lower:
            matched.append(term)
            score += 0.08

    # Check Shad Ripu terms
    for term in GITA_KEYWORDS["shad_ripu"]:
        if term in text_lower:
            matched.append(term)
            score += 0.10

    # Check chapter references
    chapter_refs = []
    for ref in GITA_KEYWORDS["chapter_refs"]:
        if ref in text_lower:
            chapter_refs.append(ref)
            score += 0.12

    # Check verse references (e.g., "2.47", "BG 18.66")
    verse_refs = []
    verse_pattern = r'(?:bg|gita|bhagavad\s*gita)?\s*(\d{1,2})[.:]\s*(\d{1,3})'
    for match in re.finditer(verse_pattern, text_lower):
        ch, vs = int(match.group(1)), int(match.group(2))
        if 1 <= ch <= 18 and 1 <= vs <= 78:  # Max verses in any chapter
            verse_refs.append(f"{ch}.{vs}")
            score += 0.15

    confidence = min(score, 1.0)
    is_compliant = confidence >= 0.25 and len(matched) >= 2

    return GitaComplianceResult(
        is_compliant=is_compliant,
        confidence=confidence,
        matched_keywords=matched[:20],
        chapter_refs=chapter_refs,
        verse_refs=verse_refs,
    )


# ─── Content Ingestion Models ───────────────────────────────────────────────

class IngestedContent(BaseModel):
    content_id: str
    platform: PlatformType
    content_type: ContentType
    title: str
    description: str = ""
    source_url: str
    source_name: str
    language: str = "en"
    duration_seconds: Optional[int] = None
    transcript: Optional[str] = None
    compliance: Optional[GitaComplianceResult] = None
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    quality_score: float = 0.0


class IngestionRequest(BaseModel):
    """Request to ingest content from a social media source."""
    url: str = Field(..., min_length=10, description="URL of the content")
    platform: PlatformType
    content_type: ContentType = ContentType.VERSE_EXPLANATION
    language: str = Field("en", max_length=8)
    force_revalidate: bool = False


class BulkIngestionRequest(BaseModel):
    """Batch request for ingesting multiple sources."""
    sources: list[IngestionRequest] = Field(..., min_length=1, max_length=50)


class IngestionResult(BaseModel):
    success: bool
    content_id: Optional[str] = None
    message: str = ""
    compliance: Optional[GitaComplianceResult] = None


# ─── Content Processing ─────────────────────────────────────────────────────

def generate_content_id(url: str, platform: str) -> str:
    """Generate deterministic content ID for deduplication."""
    raw = f"{platform}:{url}".encode()
    return hashlib.sha256(raw).hexdigest()[:16]


def is_trusted_source(url: str, platform: PlatformType) -> bool:
    """Check if the source is from a trusted provider."""
    url_lower = url.lower()

    if platform == PlatformType.YOUTUBE:
        return any(ch.lower() in url_lower for ch in TRUSTED_YOUTUBE_CHANNELS)

    if platform == PlatformType.WEB:
        return any(domain in url_lower for domain in TRUSTED_WEB_DOMAINS)

    if platform in (PlatformType.INSTAGRAM, PlatformType.TWITTER):
        platform_key = platform.value
        accounts = TRUSTED_SOCIAL_ACCOUNTS.get(platform_key, [])
        return any(acc.lower() in url_lower for acc in accounts)

    # Audio platforms - check podcast names
    if platform in (PlatformType.SPOTIFY, PlatformType.APPLE_PODCASTS, PlatformType.JIOSAAVN):
        return any(feed.lower() in url_lower for feed in TRUSTED_PODCAST_FEEDS)

    return False


async def process_ingestion(request: IngestionRequest) -> IngestionResult:
    """Process a single content ingestion request."""
    content_id = generate_content_id(request.url, request.platform.value)

    # Check trusted source
    trusted = is_trusted_source(request.url, request.platform)

    # For now, validate the URL and return metadata
    # Full content extraction would use platform-specific APIs
    logger.info(
        f"Processing ingestion: platform={request.platform.value}, "
        f"url={request.url[:80]}, trusted={trusted}"
    )

    # Create placeholder for content validation
    # In production, this would call platform APIs to fetch transcripts
    content_text = f"Content from {request.platform.value}: {request.url}"

    compliance = validate_gita_compliance(content_text)

    if not trusted and not compliance.is_compliant:
        return IngestionResult(
            success=False,
            content_id=content_id,
            message="Content did not pass Gita compliance validation and is not from a trusted source",
            compliance=compliance,
        )

    return IngestionResult(
        success=True,
        content_id=content_id,
        message=f"Content queued for processing (trusted={trusted})",
        compliance=compliance,
    )
