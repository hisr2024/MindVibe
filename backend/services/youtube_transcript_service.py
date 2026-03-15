"""
YouTube Transcript Service - Extract Gita Wisdom from Video Transcripts

Fetches transcripts from YouTube videos using the youtube-transcript-api
library and extracts structured Gita wisdom nuggets using OpenAI GPT-4o-mini.

Key capabilities:
- Transcript fetching (no API key required - uses public caption data)
- AI-powered wisdom extraction with structured output
- Fallback to keyword-based extraction when OpenAI is unavailable
- YouTube Data API quota tracking (10,000 units/day)

Integration:
    Used by ContentFetcher.fetch_youtube_gita_content() to enrich
    video metadata with actual lecture transcript content.
"""

import json
import logging
import os
import re
import time
from datetime import datetime, date
from typing import Any, Optional

logger = logging.getLogger(__name__)


# =============================================================================
# YOUTUBE API QUOTA TRACKER
# =============================================================================

class YouTubeQuotaTracker:
    """
    Tracks YouTube Data API v3 quota usage to stay within daily limits.

    YouTube grants 10,000 units/day. Each search.list call costs 100 units.
    Transcript fetching via youtube-transcript-api does NOT consume quota.
    """

    DAILY_QUOTA = 10_000
    SEARCH_COST = 100

    def __init__(self):
        self._usage: int = 0
        self._reset_date: date = datetime.utcnow().date()

    def can_search(self) -> bool:
        """Check if we have enough quota for a search API call."""
        self._maybe_reset()
        return self._usage + self.SEARCH_COST <= self.DAILY_QUOTA

    def record_search(self) -> None:
        """Record a search API call (100 units)."""
        self._maybe_reset()
        self._usage += self.SEARCH_COST
        logger.debug(f"YouTube quota used: {self._usage}/{self.DAILY_QUOTA}")

    def _maybe_reset(self) -> None:
        """Reset counter at midnight UTC."""
        today = datetime.utcnow().date()
        if today > self._reset_date:
            self._usage = 0
            self._reset_date = today
            logger.info("YouTube API quota counter reset for new day")

    @property
    def remaining_quota(self) -> int:
        """Return remaining quota units for today."""
        self._maybe_reset()
        return max(0, self.DAILY_QUOTA - self._usage)

    @property
    def usage(self) -> int:
        """Return current usage for today."""
        self._maybe_reset()
        return self._usage


# =============================================================================
# GITA KEYWORDS FOR FALLBACK EXTRACTION
# =============================================================================

GITA_WISDOM_KEYWORDS = {
    "dharma", "karma", "yoga", "atman", "brahman", "moksha", "samsara",
    "guna", "sattva", "rajas", "tamas", "bhakti", "jnana", "sankhya",
    "arjuna", "krishna", "kurukshetra", "bhagavad gita", "gita",
    "detachment", "selfless action", "equanimity", "surrender",
    "self-realization", "liberation", "devotion", "inner peace",
    "duty", "righteousness", "divine", "chapter", "verse", "shloka",
}

# Shad Ripu (six inner enemies) for tagging
SHAD_RIPU = {"kama", "krodha", "lobha", "moha", "mada", "matsarya"}


# =============================================================================
# YOUTUBE TRANSCRIPT SERVICE
# =============================================================================

class YouTubeTranscriptService:
    """
    Service for extracting and processing YouTube video transcripts
    into structured Gita wisdom nuggets.

    Uses youtube-transcript-api for transcript fetching (no API key needed)
    and OpenAI GPT-4o-mini for wisdom extraction.

    Usage:
        service = YouTubeTranscriptService()
        nuggets = await service.process_video("dQw4w9WgXcQ", {"title": "..."})
    """

    # Regex to extract 11-char YouTube video ID from various URL formats
    VIDEO_ID_PATTERN = re.compile(
        r'(?:v=|youtu\.be/|embed/|shorts/|watch\?.*v=)([a-zA-Z0-9_-]{11})'
    )

    # Prompt template for GPT-4o-mini wisdom extraction
    WISDOM_EXTRACTION_PROMPT = """You are a Bhagavad Gita scholar. From the following YouTube video transcript,
extract distinct wisdom nuggets that teach authentic Bhagavad Gita philosophy.

Video: "{title}" by {channel}
Transcript:
{transcript_text}

For each wisdom nugget, provide a JSON object with:
- "content": The teaching rewritten clearly (100-500 words, not verbatim copy)
- "chapter_refs": Gita chapters referenced (list of integers 1-18, empty if uncertain)
- "verse_refs": Specific verses as [[chapter, verse], ...] pairs (empty if uncertain)
- "themes": Relevant themes (e.g. "detachment", "karma yoga", "devotion")
- "shad_ripu_tags": Inner enemies addressed from: kama, krodha, lobha, moha, mada, matsarya
- "keywords": Searchable keywords (5-10 terms)
- "quality_score": 0.0-1.0 based on depth, accuracy, and authenticity

Return a JSON array. Maximum 10 nuggets. Only include authentically Gita-rooted teachings.
Reject generic self-help content that merely mentions Gita without substance.

Return ONLY valid JSON, no markdown fences or extra text."""

    def __init__(self):
        # Check youtube-transcript-api availability
        self._transcript_api_available = False
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            self._yt_api = YouTubeTranscriptApi
            self._transcript_api_available = True
        except ImportError:
            logger.warning(
                "youtube-transcript-api not installed. "
                "Install with: pip install youtube-transcript-api"
            )

        # Check OpenAI availability
        self._openai_available = False
        self._openai_client = None
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your-api-key-here":
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=api_key)
                self._openai_available = True
            except ImportError:
                logger.warning("openai package not installed, AI wisdom extraction disabled")

        # Configuration from environment
        self._languages = os.getenv(
            "YOUTUBE_TRANSCRIPT_LANGUAGES", "en,hi,sa"
        ).split(",")
        self._max_transcript_length = int(
            os.getenv("YOUTUBE_MAX_TRANSCRIPT_LENGTH", "50000")
        )

        # Quota tracker
        self.quota_tracker = YouTubeQuotaTracker()

        # Per-video cooldown to prevent rapid reprocessing
        self._processed_videos: dict[str, float] = {}

        logger.info(
            f"YouTubeTranscriptService initialized: "
            f"transcript_api={'available' if self._transcript_api_available else 'missing'}, "
            f"openai={'available' if self._openai_available else 'missing'}, "
            f"languages={self._languages}"
        )

    def check_cooldown(self, video_id: str, cooldown_seconds: int = 300) -> bool:
        """Check if a video can be processed (not on cooldown).

        Returns True if the video can be processed, False if it was
        recently processed and should wait.
        """
        now = time.time()
        last = self._processed_videos.get(video_id, 0)
        if now - last < cooldown_seconds:
            return False
        self._processed_videos[video_id] = now
        # Evict old entries to prevent memory growth
        if len(self._processed_videos) > 1000:
            sorted_items = sorted(
                self._processed_videos.items(), key=lambda x: x[1]
            )
            self._processed_videos = dict(sorted_items[-500:])
        return True

    @staticmethod
    def _sanitize_for_prompt(text: str, max_length: int = 200) -> str:
        """Strip control characters and limit length to prevent prompt injection."""
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned[:max_length]

    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """
        Extract YouTube video ID from various URL formats.

        Supports:
            - https://www.youtube.com/watch?v=VIDEO_ID
            - https://youtu.be/VIDEO_ID
            - https://www.youtube.com/embed/VIDEO_ID
            - https://www.youtube.com/shorts/VIDEO_ID
            - Plain 11-character video ID

        Args:
            url: YouTube URL or video ID string.

        Returns:
            11-character video ID, or None if not parseable.

        Example:
            >>> YouTubeTranscriptService.extract_video_id("https://youtu.be/dQw4w9WgXcQ")
            'dQw4w9WgXcQ'
        """
        if not url:
            return None

        # If it's already a bare 11-char ID
        if re.match(r'^[a-zA-Z0-9_-]{11}$', url.strip()):
            return url.strip()

        match = YouTubeTranscriptService.VIDEO_ID_PATTERN.search(url)
        return match.group(1) if match else None

    def fetch_transcript(
        self,
        video_id: str,
        languages: Optional[list[str]] = None
    ) -> Optional[str]:
        """
        Fetch transcript text for a YouTube video.

        Tries manually-created captions first, then falls back to
        auto-generated captions. Returns None if no transcript available.

        Args:
            video_id: 11-character YouTube video ID.
            languages: Preferred language codes (default: from env config).

        Returns:
            Joined transcript text (timestamps stripped), or None on failure.
            Truncated to YOUTUBE_MAX_TRANSCRIPT_LENGTH if too long.
        """
        if not self._transcript_api_available:
            logger.warning("Cannot fetch transcript: youtube-transcript-api not installed")
            return None

        if not video_id:
            return None

        langs = languages or self._languages

        try:
            from youtube_transcript_api import (
                CouldNotRetrieveTranscript,
                NoTranscriptFound,
                TranscriptsDisabled,
                VideoUnavailable,
            )
        except ImportError:
            return None

        try:
            # Try manually-created transcripts in preferred languages
            transcript_segments = self._yt_api.get_transcript(
                video_id, languages=langs
            )
        except NoTranscriptFound:
            # Fall back to auto-generated captions
            logger.info(
                f"No manual transcript for {video_id} in {langs}, "
                f"trying auto-generated captions"
            )
            try:
                transcript_list = self._yt_api.list_transcripts(video_id)
                # Find any auto-generated transcript
                for transcript in transcript_list:
                    if transcript.is_generated:
                        transcript_segments = transcript.fetch()
                        break
                else:
                    logger.warning(
                        f"No auto-generated transcript found for {video_id}"
                    )
                    return None
            except Exception as e:
                logger.warning(f"Failed to list transcripts for {video_id}: {e}")
                return None
        except TranscriptsDisabled:
            logger.warning(f"Transcripts disabled for video {video_id}")
            return None
        except VideoUnavailable:
            logger.warning(f"Video {video_id} is unavailable (private/deleted)")
            return None
        except (CouldNotRetrieveTranscript, Exception) as e:
            logger.warning(f"Failed to fetch transcript for {video_id}: {e}")
            return None

        # Join transcript segments into plain text (strip timestamps)
        full_text = " ".join(
            segment.get("text", "") for segment in transcript_segments
        )

        # Truncate if too long to control processing costs
        if len(full_text) > self._max_transcript_length:
            logger.info(
                f"Transcript for {video_id} truncated from {len(full_text)} "
                f"to {self._max_transcript_length} chars"
            )
            full_text = full_text[:self._max_transcript_length]

        return full_text if full_text.strip() else None

    def extract_wisdom_nuggets(
        self,
        transcript: str,
        video_title: str,
        channel_name: str
    ) -> list[dict[str, Any]]:
        """
        Extract structured Gita wisdom nuggets from a transcript.

        Uses OpenAI GPT-4o-mini for AI-powered extraction. Falls back to
        keyword-based extraction when OpenAI is unavailable.

        Args:
            transcript: Raw transcript text.
            video_title: Title of the YouTube video.
            channel_name: Name of the YouTube channel.

        Returns:
            List of wisdom nugget dicts, each with: content, chapter_refs,
            verse_refs, themes, shad_ripu_tags, keywords, quality_score.
        """
        if not transcript or not transcript.strip():
            return []

        if self._openai_available and self._openai_client:
            return self._extract_with_openai(transcript, video_title, channel_name)

        logger.info("OpenAI unavailable, using keyword-based wisdom extraction")
        return self._extract_with_keywords(transcript, video_title, channel_name)

    def _extract_with_openai(
        self,
        transcript: str,
        video_title: str,
        channel_name: str
    ) -> list[dict[str, Any]]:
        """Extract wisdom using OpenAI GPT-4o-mini."""
        # Sanitize title/channel to prevent prompt injection
        prompt = self.WISDOM_EXTRACTION_PROMPT.format(
            title=self._sanitize_for_prompt(video_title),
            channel=self._sanitize_for_prompt(channel_name),
            transcript_text=transcript[:30000],  # Limit input tokens
        )

        try:
            response = self._openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=4000,
            )

            raw_content = response.choices[0].message.content
            if not raw_content:
                logger.warning("OpenAI returned empty response for wisdom extraction")
                return self._extract_with_keywords(transcript, video_title, channel_name)

            # Parse JSON response
            # Strip markdown code fences if present
            cleaned = raw_content.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
                cleaned = re.sub(r'\s*```$', '', cleaned)

            nuggets = json.loads(cleaned)

            if not isinstance(nuggets, list):
                logger.warning("OpenAI returned non-list response, wrapping")
                nuggets = [nuggets]

            # Validate and sanitize each nugget
            validated = []
            for nugget in nuggets[:10]:  # Cap at 10
                validated.append({
                    "content": str(nugget.get("content", ""))[:2000],
                    "chapter_refs": [
                        ref for ref in nugget.get("chapter_refs", [])
                        if isinstance(ref, int) and 1 <= ref <= 18
                    ],
                    "verse_refs": [
                        ref for ref in nugget.get("verse_refs", [])
                        if isinstance(ref, list) and len(ref) == 2
                    ],
                    "themes": [
                        str(t) for t in nugget.get("themes", [])
                    ][:10],
                    "shad_ripu_tags": [
                        t for t in nugget.get("shad_ripu_tags", [])
                        if t in SHAD_RIPU
                    ],
                    "keywords": [
                        str(k) for k in nugget.get("keywords", [])
                    ][:15],
                    "quality_score": min(1.0, max(0.0, float(
                        nugget.get("quality_score", 0.5)
                    ))),
                })

            logger.info(
                f"Extracted {len(validated)} wisdom nuggets from "
                f"'{video_title}' via OpenAI"
            )
            return validated

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse OpenAI wisdom JSON: {e}")
            return self._extract_with_keywords(transcript, video_title, channel_name)
        except Exception as e:
            logger.error(f"OpenAI wisdom extraction failed: {e}")
            return self._extract_with_keywords(transcript, video_title, channel_name)

    def _extract_with_keywords(
        self,
        transcript: str,
        video_title: str,
        channel_name: str
    ) -> list[dict[str, Any]]:
        """
        Fallback: extract wisdom using keyword matching.

        Splits transcript into paragraphs and keeps those containing
        Gita-related keywords. Less accurate than AI extraction but
        works without OpenAI.
        """
        # Split into sentences (rough paragraph boundaries)
        sentences = re.split(r'[.!?]+', transcript)

        # Group into chunks of ~3 sentences
        chunks = []
        for i in range(0, len(sentences), 3):
            chunk = ". ".join(sentences[i:i + 3]).strip()
            if len(chunk) > 50:  # Skip very short chunks
                chunks.append(chunk)

        nuggets = []
        for chunk in chunks:
            chunk_lower = chunk.lower()
            # Count Gita keyword matches
            matched_keywords = [
                kw for kw in GITA_WISDOM_KEYWORDS
                if kw in chunk_lower
            ]

            # Require at least 2 keyword matches for relevance
            if len(matched_keywords) >= 2:
                # Detect shad ripu tags
                shad_ripu_found = [
                    tag for tag in SHAD_RIPU
                    if tag in chunk_lower
                ]

                # Try to detect chapter references
                chapter_refs = []
                chapter_matches = re.findall(
                    r'chapter\s*(\d{1,2})', chunk_lower
                )
                for ch in chapter_matches:
                    ch_int = int(ch)
                    if 1 <= ch_int <= 18:
                        chapter_refs.append(ch_int)

                nuggets.append({
                    "content": chunk[:1000],
                    "chapter_refs": chapter_refs,
                    "verse_refs": [],
                    "themes": matched_keywords[:5],
                    "shad_ripu_tags": shad_ripu_found,
                    "keywords": matched_keywords,
                    "quality_score": min(1.0, len(matched_keywords) * 0.15),
                })

            if len(nuggets) >= 10:
                break

        logger.info(
            f"Keyword extraction found {len(nuggets)} nuggets from "
            f"'{video_title}'"
        )
        return nuggets

    async def process_video(
        self,
        video_id: str,
        video_metadata: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        Full pipeline: fetch transcript, extract wisdom, return enriched items.

        Each returned item is a dict compatible with the daemon's
        _process_single_item_with_db() method.

        Args:
            video_id: 11-character YouTube video ID.
            video_metadata: Original metadata dict from YouTube API response.

        Returns:
            List of enriched content dicts ready for the daemon pipeline.
            Returns empty list if transcript extraction fails entirely.
        """
        title = video_metadata.get("title", "Unknown Video")
        channel = video_metadata.get("channel", "Unknown Channel")
        url = video_metadata.get("url", f"https://youtube.com/watch?v={video_id}")
        language = video_metadata.get("language", "en")

        # Fetch transcript
        transcript = self.fetch_transcript(video_id)
        if not transcript:
            logger.info(f"No transcript available for {video_id} ({title})")
            return []

        logger.info(
            f"Fetched transcript for '{title}' ({len(transcript)} chars)"
        )

        # Extract wisdom nuggets
        nuggets = self.extract_wisdom_nuggets(transcript, title, channel)
        if not nuggets:
            # Return raw transcript as single item if no nuggets extracted
            return [{
                "type": video_metadata.get("type", "video"),
                "title": title,
                "description": video_metadata.get("description", ""),
                "url": url,
                "channel": channel,
                "language": language,
                "source": channel,
                "transcript_text": transcript[:2000],
                "transcript_available": True,
            }]

        # Build enriched items from nuggets
        enriched_items = []
        for i, nugget in enumerate(nuggets):
            enriched_items.append({
                "type": video_metadata.get("type", "video"),
                "title": f"{title} - Wisdom {i + 1}",
                "description": video_metadata.get("description", ""),
                "url": url,
                "channel": channel,
                "language": language,
                "source": channel,
                "transcript_wisdom": nugget["content"],
                "transcript_available": True,
                "extracted_chapter_refs": nugget.get("chapter_refs", []),
                "extracted_verse_refs": nugget.get("verse_refs", []),
                "extracted_themes": nugget.get("themes", []),
                "extracted_shad_ripu_tags": nugget.get("shad_ripu_tags", []),
                "extracted_keywords": nugget.get("keywords", []),
                "extracted_quality_score": nugget.get("quality_score", 0.5),
            })

        logger.info(
            f"Processed video '{title}': {len(enriched_items)} wisdom items"
        )
        return enriched_items
