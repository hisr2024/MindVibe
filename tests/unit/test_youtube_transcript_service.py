"""
Unit tests for YouTubeTranscriptService.

Tests cover:
- YouTubeQuotaTracker (quota tracking, daily reset)
- Video ID extraction from various URL formats
- Transcript fetching (happy path, error handling, truncation)
- Wisdom extraction (OpenAI, keyword fallback)
- Input validation (SSRF prevention, language codes)
- Prompt sanitization and cooldown
"""

import json
import time
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest

from backend.services.youtube_transcript_service import (
    GITA_WISDOM_KEYWORDS,
    SHAD_RIPU,
    YouTubeQuotaTracker,
    YouTubeTranscriptService,
)


# =============================================================================
# YouTubeQuotaTracker Tests
# =============================================================================


class TestYouTubeQuotaTracker:
    """Tests for the YouTube API quota tracking system."""

    def test_initial_state(self):
        """Tracker starts with zero usage and full quota remaining."""
        tracker = YouTubeQuotaTracker()
        assert tracker.usage == 0
        assert tracker.remaining_quota == 10_000

    def test_record_search(self):
        """Recording a search increases usage by 100 units."""
        tracker = YouTubeQuotaTracker()
        tracker.record_search()
        assert tracker.usage == 100
        assert tracker.remaining_quota == 9_900

    def test_can_search_within_quota(self):
        """Can search when quota has not been exhausted."""
        tracker = YouTubeQuotaTracker()
        assert tracker.can_search() is True
        # Use up most of the quota
        for _ in range(99):
            tracker.record_search()
        assert tracker.can_search() is True

    def test_can_search_at_limit(self):
        """Cannot search when quota is exhausted."""
        tracker = YouTubeQuotaTracker()
        # Use all 10,000 units (100 searches * 100 units each)
        for _ in range(100):
            tracker.record_search()
        assert tracker.can_search() is False
        assert tracker.remaining_quota == 0

    def test_daily_reset(self):
        """Quota resets at midnight UTC when a new day begins."""
        tracker = YouTubeQuotaTracker()
        tracker.record_search()
        assert tracker.usage == 100

        # Simulate date advancing to tomorrow
        tracker._reset_date = date.today() - timedelta(days=1)
        assert tracker.usage == 0
        assert tracker.remaining_quota == 10_000


# =============================================================================
# Video ID Extraction Tests
# =============================================================================


class TestVideoIdExtraction:
    """Tests for extracting video IDs from various YouTube URL formats."""

    def test_standard_url(self):
        """Extract ID from standard youtube.com/watch?v= URL."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert YouTubeTranscriptService.extract_video_id(url) == "dQw4w9WgXcQ"

    def test_short_url(self):
        """Extract ID from youtu.be short URL."""
        url = "https://youtu.be/dQw4w9WgXcQ"
        assert YouTubeTranscriptService.extract_video_id(url) == "dQw4w9WgXcQ"

    def test_embed_url(self):
        """Extract ID from youtube.com/embed/ URL."""
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        assert YouTubeTranscriptService.extract_video_id(url) == "dQw4w9WgXcQ"

    def test_shorts_url(self):
        """Extract ID from youtube.com/shorts/ URL."""
        url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"
        assert YouTubeTranscriptService.extract_video_id(url) == "dQw4w9WgXcQ"

    def test_url_with_extra_params(self):
        """Extract ID when URL has additional query parameters."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"
        assert YouTubeTranscriptService.extract_video_id(url) == "dQw4w9WgXcQ"

    def test_bare_id(self):
        """Accept a bare 11-character video ID string."""
        assert YouTubeTranscriptService.extract_video_id("dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    def test_bare_id_with_whitespace(self):
        """Accept bare ID with surrounding whitespace."""
        assert YouTubeTranscriptService.extract_video_id("  dQw4w9WgXcQ  ") == "dQw4w9WgXcQ"

    def test_invalid_url(self):
        """Return None for non-YouTube URLs."""
        assert YouTubeTranscriptService.extract_video_id("https://example.com/video") is None

    def test_empty_input(self):
        """Return None for empty string."""
        assert YouTubeTranscriptService.extract_video_id("") is None

    def test_none_input(self):
        """Return None for None input."""
        assert YouTubeTranscriptService.extract_video_id(None) is None

    def test_too_short_id(self):
        """Return None for ID shorter than 11 characters."""
        assert YouTubeTranscriptService.extract_video_id("abc123") is None


# =============================================================================
# Transcript Fetching Tests
# =============================================================================


class TestTranscriptFetching:
    """Tests for YouTube transcript fetching with proper error handling."""

    def _make_service(self):
        """Create a service with mocked dependencies."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
            service = YouTubeTranscriptService()
        return service

    def test_happy_path(self):
        """Successfully fetch and join transcript segments."""
        service = self._make_service()
        service._transcript_api_available = True

        mock_api = MagicMock()
        mock_api.get_transcript.return_value = [
            {"text": "Bhagavad Gita teaches us"},
            {"text": "about karma yoga and dharma."},
        ]
        service._yt_api = mock_api

        result = service.fetch_transcript("dQw4w9WgXcQ")
        assert result == "Bhagavad Gita teaches us about karma yoga and dharma."

    def test_transcript_truncation(self):
        """Long transcripts are truncated to configured max length."""
        service = self._make_service()
        service._transcript_api_available = True
        service._max_transcript_length = 50

        mock_api = MagicMock()
        mock_api.get_transcript.return_value = [
            {"text": "A" * 100},
        ]
        service._yt_api = mock_api

        result = service.fetch_transcript("dQw4w9WgXcQ")
        assert len(result) == 50

    def test_api_not_installed(self):
        """Return None gracefully when youtube-transcript-api is not installed."""
        service = self._make_service()
        service._transcript_api_available = False

        result = service.fetch_transcript("dQw4w9WgXcQ")
        assert result is None

    def test_empty_video_id(self):
        """Return None for empty video ID."""
        service = self._make_service()
        assert service.fetch_transcript("") is None
        assert service.fetch_transcript(None) is None


# =============================================================================
# Wisdom Extraction Tests
# =============================================================================


class TestWisdomExtraction:
    """Tests for AI-powered and keyword-based wisdom extraction."""

    def _make_service(self):
        """Create a service with mocked dependencies."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
            service = YouTubeTranscriptService()
        return service

    def test_keyword_extraction_finds_gita_content(self):
        """Keyword fallback extracts chunks with 2+ Gita keywords."""
        service = self._make_service()

        transcript = (
            "Krishna teaches Arjuna about dharma and karma yoga on the battlefield. "
            "The path of selfless action leads to moksha and liberation. "
            "Detachment from the fruits of action is the key teaching of the Gita."
        )

        nuggets = service.extract_wisdom_nuggets(transcript, "Gita Lecture", "ISKCON")
        assert len(nuggets) >= 1
        # Verify structure
        for nugget in nuggets:
            assert "content" in nugget
            assert "keywords" in nugget
            assert "quality_score" in nugget
            assert 0.0 <= nugget["quality_score"] <= 1.0

    def test_keyword_extraction_rejects_non_gita(self):
        """Keyword fallback returns empty for content without Gita keywords."""
        service = self._make_service()

        transcript = (
            "Today we will discuss modern cooking techniques. "
            "The best way to prepare pasta is with fresh ingredients. "
            "Italian cuisine has a long and rich tradition."
        )

        nuggets = service.extract_wisdom_nuggets(transcript, "Cooking Show", "Food Channel")
        assert len(nuggets) == 0

    def test_keyword_extraction_detects_shad_ripu(self):
        """Shad Ripu (six inner enemies) are detected and tagged."""
        service = self._make_service()

        transcript = (
            "Krishna speaks about krodha the inner enemy of anger and how karma "
            "yoga helps us overcome this obstacle on the path to dharma. "
            "The Gita teaches detachment and selfless action as the way forward."
        )

        nuggets = service.extract_wisdom_nuggets(transcript, "Krodha Talk", "Guru")
        matching = [n for n in nuggets if "krodha" in n.get("shad_ripu_tags", [])]
        assert len(matching) >= 1

    def test_empty_transcript_returns_empty(self):
        """Empty or whitespace-only transcript returns no nuggets."""
        service = self._make_service()
        assert service.extract_wisdom_nuggets("", "Title", "Channel") == []
        assert service.extract_wisdom_nuggets("   ", "Title", "Channel") == []

    def test_keyword_extraction_caps_at_10(self):
        """Keyword extraction returns at most 10 nuggets."""
        service = self._make_service()

        # Generate a long transcript with many Gita-keyword-dense chunks
        chunk = "Krishna teaches Arjuna about dharma and karma yoga. "
        transcript = chunk * 200

        nuggets = service.extract_wisdom_nuggets(transcript, "Long Lecture", "Channel")
        assert len(nuggets) <= 10

    @patch("openai.OpenAI")
    def test_openai_extraction_happy_path(self, mock_openai_cls):
        """OpenAI extraction parses valid JSON response into validated nuggets."""
        service = self._make_service()
        service._openai_available = True

        mock_client = MagicMock()
        service._openai_client = mock_client

        nuggets_json = json.dumps([
            {
                "content": "The path of nishkama karma teaches us to act without attachment.",
                "chapter_refs": [2, 3],
                "verse_refs": [[2, 47]],
                "themes": ["karma yoga", "detachment"],
                "shad_ripu_tags": ["kama"],
                "keywords": ["karma", "detachment", "action"],
                "quality_score": 0.9,
            }
        ])

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = nuggets_json
        mock_client.chat.completions.create.return_value = mock_response

        result = service.extract_wisdom_nuggets("transcript text", "Title", "Channel")
        assert len(result) == 1
        assert result[0]["chapter_refs"] == [2, 3]
        assert result[0]["verse_refs"] == [[2, 47]]
        assert result[0]["shad_ripu_tags"] == ["kama"]
        assert result[0]["quality_score"] == 0.9

    @patch("openai.OpenAI")
    def test_openai_invalid_json_falls_back(self, mock_openai_cls):
        """Invalid JSON from OpenAI triggers fallback to keyword extraction."""
        service = self._make_service()
        service._openai_available = True

        mock_client = MagicMock()
        service._openai_client = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "not valid json {{"
        mock_client.chat.completions.create.return_value = mock_response

        # Should not raise, should fall back to keyword extraction
        result = service.extract_wisdom_nuggets(
            "Krishna teaches dharma and karma yoga", "Title", "Channel"
        )
        assert isinstance(result, list)

    @patch("openai.OpenAI")
    def test_openai_validates_chapter_refs(self, mock_openai_cls):
        """Invalid chapter references (>18) are filtered out."""
        service = self._make_service()
        service._openai_available = True

        mock_client = MagicMock()
        service._openai_client = mock_client

        nuggets_json = json.dumps([
            {
                "content": "Teaching about dharma.",
                "chapter_refs": [2, 99, -1, 18],
                "verse_refs": [],
                "themes": [],
                "shad_ripu_tags": [],
                "keywords": [],
                "quality_score": 0.5,
            }
        ])

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = nuggets_json
        mock_client.chat.completions.create.return_value = mock_response

        result = service.extract_wisdom_nuggets("transcript", "Title", "Channel")
        # Only valid chapters 2 and 18 should remain
        assert result[0]["chapter_refs"] == [2, 18]

    @patch("openai.OpenAI")
    def test_openai_validates_shad_ripu_tags(self, mock_openai_cls):
        """Invalid shad ripu tags are filtered out."""
        service = self._make_service()
        service._openai_available = True

        mock_client = MagicMock()
        service._openai_client = mock_client

        nuggets_json = json.dumps([
            {
                "content": "Teaching about anger.",
                "chapter_refs": [],
                "verse_refs": [],
                "themes": [],
                "shad_ripu_tags": ["krodha", "invalid_tag", "kama"],
                "keywords": [],
                "quality_score": 0.5,
            }
        ])

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = nuggets_json
        mock_client.chat.completions.create.return_value = mock_response

        result = service.extract_wisdom_nuggets("transcript", "Title", "Channel")
        assert set(result[0]["shad_ripu_tags"]) == {"krodha", "kama"}


# =============================================================================
# Prompt Sanitization Tests
# =============================================================================


class TestPromptSanitization:
    """Tests for prompt injection prevention."""

    def test_strips_control_characters(self):
        """Control characters are removed from prompt inputs."""
        result = YouTubeTranscriptService._sanitize_for_prompt(
            "Hello\x00World\x1fTest\x7f"
        )
        assert "\x00" not in result
        assert "\x1f" not in result
        assert "\x7f" not in result
        assert "HelloWorldTest" in result

    def test_collapses_whitespace(self):
        """Multiple whitespace characters are collapsed to single space."""
        result = YouTubeTranscriptService._sanitize_for_prompt(
            "Hello    World  \n\n  Test"
        )
        assert result == "Hello World Test"

    def test_truncates_long_input(self):
        """Input longer than max_length is truncated."""
        result = YouTubeTranscriptService._sanitize_for_prompt(
            "A" * 500, max_length=100
        )
        assert len(result) == 100

    def test_handles_empty_string(self):
        """Empty string returns empty string."""
        assert YouTubeTranscriptService._sanitize_for_prompt("") == ""

    def test_handles_whitespace_only(self):
        """Whitespace-only input returns empty string."""
        assert YouTubeTranscriptService._sanitize_for_prompt("   \n\t  ") == ""


# =============================================================================
# Cooldown Tests
# =============================================================================


class TestCooldown:
    """Tests for per-video processing cooldown."""

    def _make_service(self):
        with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
            service = YouTubeTranscriptService()
        return service

    def test_first_process_allowed(self):
        """First processing of a video is always allowed."""
        service = self._make_service()
        assert service.check_cooldown("video123") is True

    def test_rapid_reprocess_blocked(self):
        """Reprocessing same video within cooldown is blocked."""
        service = self._make_service()
        assert service.check_cooldown("video123") is True
        assert service.check_cooldown("video123") is False

    def test_different_videos_not_blocked(self):
        """Different video IDs have independent cooldowns."""
        service = self._make_service()
        assert service.check_cooldown("video_A") is True
        assert service.check_cooldown("video_B") is True

    def test_cooldown_expires(self):
        """Video can be reprocessed after cooldown expires."""
        service = self._make_service()
        assert service.check_cooldown("video123", cooldown_seconds=1) is True
        time.sleep(1.1)
        assert service.check_cooldown("video123", cooldown_seconds=1) is True

    def test_eviction_on_overflow(self):
        """Old entries are evicted when cache exceeds 1000 entries."""
        service = self._make_service()
        # Fill up the cache
        for i in range(1001):
            service.check_cooldown(f"video_{i}")
        # Cache should have been trimmed to 500
        assert len(service._processed_videos) <= 501


# =============================================================================
# Input Validation (Pydantic Model) Tests
# =============================================================================


class TestInputValidation:
    """Tests for ProcessYouTubeVideoRequest validation (SSRF, language)."""

    def test_valid_youtube_url(self):
        """Standard YouTube URL is accepted."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        req = ProcessYouTubeVideoRequest(video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        assert req.video_url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    def test_valid_bare_id(self):
        """Bare 11-char video ID is accepted."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        req = ProcessYouTubeVideoRequest(video_url="dQw4w9WgXcQ")
        assert req.video_url == "dQw4w9WgXcQ"

    def test_ssrf_non_youtube_url_rejected(self):
        """Non-YouTube URLs are rejected to prevent SSRF."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        with pytest.raises(Exception) as exc_info:
            ProcessYouTubeVideoRequest(video_url="https://evil.com/malicious")
        assert "YouTube URL" in str(exc_info.value)

    def test_ssrf_internal_url_rejected(self):
        """Internal/localhost URLs are rejected."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        with pytest.raises(Exception):
            ProcessYouTubeVideoRequest(video_url="http://127.0.0.1:8080/admin")

    def test_ftp_scheme_rejected(self):
        """Non-http(s) schemes are rejected."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        with pytest.raises(Exception):
            ProcessYouTubeVideoRequest(video_url="ftp://youtube.com/watch?v=abc12345678")

    def test_valid_language_codes(self):
        """Valid language codes are accepted."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        req = ProcessYouTubeVideoRequest(
            video_url="dQw4w9WgXcQ",
            languages=["en", "hi", "sa"],
        )
        assert req.languages == ["en", "hi", "sa"]

    def test_invalid_language_code_rejected(self):
        """Unknown language codes are rejected."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        with pytest.raises(Exception) as exc_info:
            ProcessYouTubeVideoRequest(
                video_url="dQw4w9WgXcQ",
                languages=["en", "xx_inject"],
            )
        assert "Unsupported language" in str(exc_info.value)

    def test_youtu_be_url_accepted(self):
        """Short youtu.be URLs are accepted."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        req = ProcessYouTubeVideoRequest(video_url="https://youtu.be/dQw4w9WgXcQ")
        assert req.video_url == "https://youtu.be/dQw4w9WgXcQ"

    def test_mobile_youtube_url_accepted(self):
        """Mobile m.youtube.com URLs are accepted."""
        from backend.routes.kiaan_learning import ProcessYouTubeVideoRequest
        req = ProcessYouTubeVideoRequest(
            video_url="https://m.youtube.com/watch?v=dQw4w9WgXcQ"
        )
        assert "m.youtube.com" in req.video_url


# =============================================================================
# Process Video Pipeline Tests
# =============================================================================


class TestProcessVideo:
    """Tests for the full process_video pipeline."""

    def _make_service(self):
        with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
            service = YouTubeTranscriptService()
        return service

    @pytest.mark.asyncio
    async def test_no_transcript_returns_empty(self):
        """When no transcript is available, return empty list."""
        service = self._make_service()
        service._transcript_api_available = False

        result = await service.process_video("dQw4w9WgXcQ", {"title": "Test"})
        assert result == []

    @pytest.mark.asyncio
    async def test_no_nuggets_returns_raw_transcript(self):
        """When no wisdom nuggets are extracted, return raw transcript item."""
        service = self._make_service()
        service._transcript_api_available = True

        with patch.object(service, "fetch_transcript", return_value="some raw text"):
            with patch.object(service, "extract_wisdom_nuggets", return_value=[]):
                result = await service.process_video(
                    "dQw4w9WgXcQ",
                    {"title": "Test Video", "channel": "Test Channel"},
                )

        assert len(result) == 1
        assert result[0]["transcript_text"] == "some raw text"
        assert result[0]["transcript_available"] is True

    @pytest.mark.asyncio
    async def test_full_pipeline_with_nuggets(self):
        """Full pipeline produces enriched items from wisdom nuggets."""
        service = self._make_service()
        service._transcript_api_available = True

        mock_nuggets = [
            {
                "content": "Teaching about dharma.",
                "chapter_refs": [2],
                "verse_refs": [],
                "themes": ["dharma"],
                "shad_ripu_tags": [],
                "keywords": ["dharma"],
                "quality_score": 0.8,
            },
        ]

        with patch.object(service, "fetch_transcript", return_value="transcript text"):
            with patch.object(service, "extract_wisdom_nuggets", return_value=mock_nuggets):
                result = await service.process_video(
                    "dQw4w9WgXcQ",
                    {"title": "Gita Lecture", "channel": "ISKCON"},
                )

        assert len(result) == 1
        assert result[0]["transcript_wisdom"] == "Teaching about dharma."
        assert result[0]["extracted_chapter_refs"] == [2]
        assert result[0]["extracted_quality_score"] == 0.8
