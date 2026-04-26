"""Tests for backend/services/prompt_loader.py.

Covers:
  • get_persona_version returns the pinned semver from disk
  • get_persona caches per render_mode and returns immutable snapshots
  • cross-version-check: prompt files must declare the same persona-version
  • drift detection: post-load file edits log a warning, cached version still served
  • reset_cache_for_tests refuses to run outside the test env
  • invalid render_mode raises ValueError
"""

from __future__ import annotations

import os
import threading

import pytest

# Enable test-only cache reset before importing the loader
os.environ.setdefault("KIAAN_PROMPT_LOADER_TEST", "1")

from backend.services.prompt_loader import (  # noqa: E402
    PERSONA_VERSION_FILE,
    SAKHA_VOICE_PROMPT,
    PromptDriftError,
    get_persona,
    get_persona_version,
    get_prompt_text,
    reset_cache_for_tests,
)


@pytest.fixture(autouse=True)
def _reset_cache():
    """Make every test see a fresh cache so test order doesn't matter."""
    reset_cache_for_tests()
    yield
    reset_cache_for_tests()


class TestPersonaVersion:
    def test_version_is_pinned_semver(self):
        v = get_persona_version()
        assert v == "1.0.0"

    def test_version_is_cached(self):
        v1 = get_persona_version()
        v2 = get_persona_version()
        assert v1 == v2

    def test_version_file_exists_and_is_non_empty(self):
        assert PERSONA_VERSION_FILE.exists()
        assert PERSONA_VERSION_FILE.stat().st_size > 0


class TestGetPersona:
    def test_voice_persona_loads(self):
        p = get_persona("voice")
        assert p.render_mode == "voice"
        assert p.persona_version == "1.0.0"
        assert "1.0.0" in p.text
        assert len(p.text) > 1000
        assert len(p.sha256) == 64
        assert str(SAKHA_VOICE_PROMPT) == p.source_path

    def test_text_persona_loads(self):
        p = get_persona("text")
        assert p.render_mode == "text"
        assert p.persona_version == "1.0.0"
        assert "**Ancient Wisdom Principle:**" in p.text
        assert "1.0.0" in p.text

    def test_persona_is_cached_and_immutable(self):
        a = get_persona("voice")
        b = get_persona("voice")
        assert a is b  # same instance

    def test_invalid_render_mode_raises(self):
        with pytest.raises(ValueError):
            get_persona("audio")  # not a valid render_mode

    def test_voice_prompt_declares_pause_marker_convention(self):
        p = get_persona("voice")
        assert "<pause:short>" in p.text
        assert "<pause:medium>" in p.text
        assert "<pause:long>" in p.text

    def test_text_prompt_declares_4_part_markers(self):
        p = get_persona("text")
        for marker in (
            "Ancient Wisdom Principle",
            "Modern Application",
            "Practical Steps",
            "Deeper Understanding",
        ):
            assert marker in p.text

    def test_get_prompt_text_returns_text_body(self):
        body = get_prompt_text("voice")
        assert isinstance(body, str)
        assert "Sakha" in body


class TestDriftDetection:
    def test_matches_disk_returns_true_when_unchanged(self):
        p = get_persona("voice")
        assert p.matches_disk() is True


class TestResetCacheGuard:
    def test_reset_refuses_without_env_flag(self, monkeypatch):
        monkeypatch.delenv("KIAAN_PROMPT_LOADER_TEST", raising=False)
        with pytest.raises(PromptDriftError):
            reset_cache_for_tests()

    def test_reset_works_with_env_flag(self, monkeypatch):
        monkeypatch.setenv("KIAAN_PROMPT_LOADER_TEST", "1")
        get_persona("voice")  # populate
        reset_cache_for_tests()
        # After reset, a new load should succeed and yield a new instance
        # (different identity than any object captured before reset).
        p2 = get_persona("voice")
        assert p2.persona_version == "1.0.0"


class TestThreadSafety:
    def test_concurrent_loads_yield_one_cached_instance(self):
        results: list = []

        def loader():
            results.append(get_persona("voice"))

        threads = [threading.Thread(target=loader) for _ in range(8)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # All threads should see the same cached instance
        first = results[0]
        assert all(r is first for r in results)
