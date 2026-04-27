"""Unit tests for backend/services/voice/ routers (Part 5b/5c/5d).

Exercises the STT router, TTS router + AudioCache, and LLM router in
isolation — no WSS endpoint, no FastAPI. Covers the contract every
caller (orchestrator + WSS handler) relies on.
"""

from __future__ import annotations

import asyncio
import base64
import os

# Force mock-only mode
os.environ.setdefault("KIAAN_VOICE_MOCK_PROVIDERS", "1")

from backend.services.voice.llm_provider import (  # noqa: E402
    LLMRouter,
    OpenAILLMProvider,
)
from backend.services.voice.orchestrator_types import (  # noqa: E402
    VoiceTurnContext,
    VoiceTurnResult,
)
from backend.services.voice.retrieval_and_fallback import (  # noqa: E402
    retrieve_verses_for_turn,
    tier_3_template,
    tier_4_verse_only,
)
from backend.services.voice.stt_router import (  # noqa: E402
    MockSTTProvider,
    STTRouter,
)
from backend.services.voice.tts_router import (  # noqa: E402
    DEFAULT_VOICE_IDS,
    AudioCache,
    MockTTSProvider,
    TTSRouter,
    get_voice_id,
)
from backend.services.voice.wss_frames import (  # noqa: E402
    SCHEMA_VERSION,
    SUBPROTOCOL,
    ClientStartFrame,
    HelplineEntry,
    ServerCrisisFrame,
    ServerDoneFrame,
    ValidationError,
    parse_client_frame,
    parse_server_frame,
    serialize_frame,
)

# ─── Frame protocol round-trip ────────────────────────────────────────────


class TestWSSFrameProtocol:
    def test_subprotocol_constants(self):
        assert SUBPROTOCOL == "kiaan-voice-v1"
        assert SCHEMA_VERSION == "1.0.0"

    def test_client_start_round_trip(self):
        f = ClientStartFrame(session_id="s", persona_version="1.0.0")
        assert parse_client_frame(serialize_frame(f)) == f

    def test_server_done_round_trip(self):
        f = ServerDoneFrame(
            conversation_id="c", total_ms=1000, persona_version="1.0.0",
        )
        assert parse_server_frame(serialize_frame(f)) == f

    def test_extras_forbidden(self):
        import pytest
        with pytest.raises(ValidationError):
            parse_client_frame(
                '{"type":"start","session_id":"s","persona_version":"1.0.0","hacker":"!"}'
            )

    def test_unknown_type_rejected(self):
        import pytest
        with pytest.raises(ValidationError):
            parse_client_frame('{"type":"hack"}')

    def test_chapter_above_18_rejected(self):
        import pytest
        with pytest.raises(ValidationError):
            parse_server_frame(
                '{"type":"verse","chapter":22,"verse":1,'
                '"text_sa":"x","text_en":"x","citation":"BG 22.1"}'
            )

    def test_intensity_out_of_range_rejected(self):
        import pytest
        with pytest.raises(ValidationError):
            parse_server_frame(
                '{"type":"mood","label":"x","intensity":2.5,"trend":"up"}'
            )

    def test_crisis_frame_with_helpline(self):
        f = ServerCrisisFrame(
            incident_id="inc-1",
            helpline=[HelplineEntry(name="988", number="988", region="US")],
            audio_url="/x.opus", region="US", language="en",
        )
        round_tripped = parse_server_frame(serialize_frame(f))
        assert round_tripped == f


# ─── STT routing ──────────────────────────────────────────────────────────


class TestSTTRouter:
    def test_decide_mock_forced(self):
        r = STTRouter()
        d = r.decide("hi")
        assert d.provider_name == "mock"

    def test_mock_provider_emits_partials_then_final(self):
        async def run():
            MockSTTProvider.set_script("s-stt", ["i", "i feel anxious"])
            r = STTRouter()
            provider, _ = r.build_provider("en")
            await provider.start_session(session_id="s-stt", lang_hint="en")
            chunk = base64.b64encode(b"\x00" * 3000).decode()
            partials = []
            async for ev in provider.feed_audio_chunk(seq=0, opus_b64=chunk):
                partials.append(ev)
            finals = []
            async for ev in provider.end_of_speech():
                finals.append(ev)
            await provider.close()
            return partials, finals

        partials, finals = asyncio.run(run())
        assert all(not p.is_final for p in partials)
        assert len(finals) == 1
        assert finals[0].is_final
        assert finals[0].text == "i feel anxious"
        MockSTTProvider.clear_scripts()

    def test_decide_for_indic_falls_back_to_mock_without_key(self):
        # Bypass mock-forced flag for this test
        old = os.environ.pop("KIAAN_VOICE_MOCK_PROVIDERS", None)
        try:
            r = STTRouter()
            d = r.decide("hi")
            assert d.provider_name == "mock"
            assert d.fell_back_to_mock is True
            assert "Sarvam" in d.reason
        finally:
            if old is not None:
                os.environ["KIAAN_VOICE_MOCK_PROVIDERS"] = old


# ─── TTS routing + audio cache ────────────────────────────────────────────


class TestTTSRouterAndCache:
    def test_voice_id_resolution(self):
        assert get_voice_id("en").startswith("elevenlabs:")
        assert get_voice_id("hi").startswith("sarvam:")
        assert get_voice_id("unknown").startswith("elevenlabs:")  # English fallback

    def test_voice_id_env_override(self, monkeypatch):
        monkeypatch.setenv("KIAAN_VOICE_ID_EN", "custom:abc")
        assert get_voice_id("en") == "custom:abc"

    def test_default_voice_ids_cover_supported_languages(self):
        for lang in ("en", "hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml"):
            assert lang in DEFAULT_VOICE_IDS

    def test_cache_key_is_deterministic_and_order_invariant(self):
        a = AudioCache.build_key(
            verse_refs=["BG 2.47", "BG 6.5"], mood_label="anxious",
            render_mode="voice", lang_hint="en",
            voice_id="elevenlabs:x", persona_version="1.0.0",
        )
        b = AudioCache.build_key(
            verse_refs=["BG 6.5", "BG 2.47"], mood_label="anxious",
            render_mode="voice", lang_hint="en",
            voice_id="elevenlabs:x", persona_version="1.0.0",
        )
        assert a == b
        assert len(a) == 64  # sha256 hex

    def test_cache_key_changes_when_dimension_changes(self):
        base = {
            "verse_refs": ["BG 2.47"], "mood_label": "anxious",
            "render_mode": "voice", "lang_hint": "en",
            "voice_id": "elevenlabs:x", "persona_version": "1.0.0",
        }
        k = AudioCache.build_key(**base)
        for field, new_value in [
            ("mood_label", "lonely"),
            ("render_mode", "text"),
            ("lang_hint", "hi"),
            ("voice_id", "sarvam:y"),
            ("persona_version", "1.0.1"),
            ("verse_refs", ["BG 6.5"]),
        ]:
            kw = base | {field: new_value}
            assert AudioCache.build_key(**kw) != k, f"{field} should change key"

    def test_synthesize_with_cache_miss_then_hit(self):
        async def run():
            r = TTSRouter()
            r.cache.clear()
            args = {
                "text": "Krishna teaches", "lang_hint": "en",
                "verse_refs": ["BG 2.47"], "mood_label": "anxious",
                "render_mode": "voice", "persona_version": "1.0.0",
            }
            chunks1, hit1, _ = await r.synthesize_with_cache(**args)
            chunks2, hit2, _ = await r.synthesize_with_cache(**args)
            return chunks1, hit1, chunks2, hit2

        c1, h1, c2, h2 = asyncio.run(run())
        assert h1 is False
        assert h2 is True
        assert c1 == c2

    def test_mock_tts_emits_n_chunks_with_final(self):
        async def run():
            provider = MockTTSProvider()
            chunks = []
            async for c in provider.synthesize_streaming(
                text="hello", voice_id="mock:test", lang_hint="en",
            ):
                chunks.append(c)
            return chunks

        chunks = asyncio.run(run())
        assert len(chunks) == MockTTSProvider.chunks_per_sentence
        assert chunks[-1].is_final is True
        assert all(not c.is_final for c in chunks[:-1])


# ─── LLM provider ─────────────────────────────────────────────────────────


class TestLLMRouter:
    def test_decide_mock_forced(self):
        d = LLMRouter().decide()
        assert d.provider_name == "mock"

    def test_mock_emits_deltas_terminating_with_is_final(self):
        async def run():
            r = LLMRouter()
            provider, _ = r.build_provider()
            payload = '{"engine":"GUIDANCE","retrieved_verses":[]}'
            deltas = []
            async for d in provider.stream(
                system_prompt="x",
                user_payload_json=payload,
                model="gpt-4o-mini",
            ):
                deltas.append(d)
            return deltas

        deltas = asyncio.run(run())
        assert deltas[-1].is_final is True
        assert all(not d.is_final for d in deltas[:-1])
        text = "".join(d.content for d in deltas)
        assert "Krishna" in text or "BG" in text or "कर्म" in text

    def test_set_response_for_test_overrides_next_stream(self):
        async def run():
            r = LLMRouter()
            r.mock_provider.set_response_for_test(
                "Buddha said all life is suffering."
            )
            provider, _ = r.build_provider()
            deltas = [
                d async for d in provider.stream(
                    system_prompt="x", user_payload_json="{}",
                    model="gpt-4o-mini",
                )
            ]
            return "".join(d.content for d in deltas)

        text = asyncio.run(run())
        assert "Buddha said" in text

    def test_openai_provider_unconfigured_raises(self):
        old = os.environ.pop("OPENAI_API_KEY", None)
        try:
            assert OpenAILLMProvider().is_configured() is False
        finally:
            if old is not None:
                os.environ["OPENAI_API_KEY"] = old


# ─── Verse retrieval + fallback ────────────────────────────────────────────


class TestVerseRetrieval:
    def test_guidance_gets_up_to_3_verses(self):
        async def run():
            return await retrieve_verses_for_turn(
                mood_label="anxious", engine="GUIDANCE",
                user_message="x", user_id="u", db=None,
            )
        v = asyncio.run(run())
        assert 1 <= len(v) <= 3

    def test_friend_gets_up_to_2_verses(self):
        async def run():
            return await retrieve_verses_for_turn(
                mood_label="lonely", engine="FRIEND",
                user_message="x", user_id="u", db=None,
            )
        v = asyncio.run(run())
        assert 1 <= len(v) <= 2

    def test_assistant_gets_exactly_1_verse(self):
        async def run():
            return await retrieve_verses_for_turn(
                mood_label="neutral", engine="ASSISTANT",
                user_message="x", user_id="u", db=None,
            )
        v = asyncio.run(run())
        assert len(v) == 1

    def test_unknown_mood_falls_back_to_neutral(self):
        async def run():
            return await retrieve_verses_for_turn(
                mood_label="ecstatic", engine="FRIEND",
                user_message="x", user_id="u", db=None,
            )
        v = asyncio.run(run())
        assert len(v) >= 1


class TestFallbackTemplates:
    def test_tier_3_template_contains_canonical_anchor(self):
        async def run():
            verses = await retrieve_verses_for_turn(
                mood_label="anxious", engine="GUIDANCE",
                user_message="x", user_id="u", db=None,
            )
            return tier_3_template(
                engine="GUIDANCE", mood_label="anxious", verse=verses[0],
            )
        text = asyncio.run(run())
        # Canonical anchor "Krishna" makes the streaming filter pass
        assert "Krishna" in text
        # Must include the Sanskrit + English from the verse
        assert "<pause:" in text

    def test_tier_4_verse_only_contains_bhagavad_gita_anchor(self):
        async def run():
            verses = await retrieve_verses_for_turn(
                mood_label="anxious", engine="GUIDANCE",
                user_message="x", user_id="u", db=None,
            )
            return tier_4_verse_only(verse=verses[0])
        text = asyncio.run(run())
        assert "Bhagavad Gita" in text


# ─── Orchestrator dataclasses ─────────────────────────────────────────────


class TestOrchestratorTypes:
    def test_voice_turn_context_immutable(self):
        import dataclasses

        import pytest
        ctx = VoiceTurnContext(
            session_id="s", user_id="u", conversation_id="c", user_latest="x",
        )
        with pytest.raises(dataclasses.FrozenInstanceError):
            ctx.session_id = "other"  # type: ignore[misc]

    def test_voice_turn_result_to_voice_specific_outcomes(self):
        r = VoiceTurnResult(
            conversation_id="c", completed=True, crisis_triggered=False,
            interrupted=False, cache_hit=False,
            engine_selected="GUIDANCE", mood_label="anxious",
            verse_refs=["BG 2.47"], first_audio_byte_ms=1100, total_ms=1500,
            sentences_emitted=4, audio_chunks_emitted=12, filter_pass_rate=1.0,
        )
        out = r.to_voice_specific_outcomes(completed_listening=True)
        assert set(out.keys()) == {
            "completed_listening", "session_continued",
            "barge_in_at_token_index", "filter_pass_rate",
            "first_audio_byte_ms", "tier_used", "cache_hit",
        }
        assert out["completed_listening"] is True
        assert out["session_continued"] is True
        assert out["barge_in_at_token_index"] is None
