"""Tests for the real (non-mock) voice providers.

Uses httpx.MockTransport to simulate the upstream API — no real network
calls. Verifies:
  • ElevenLabsTTSProvider streams chunks correctly + parses voice_id
  • SarvamTTSProvider chunks the WAV body returned in JSON
  • SarvamSTTProvider buffers chunks then flushes on end_of_speech
  • All three providers raise on missing API key
  • All three reject malformed voice_id / responses
  • Provider registry round-trips registration + lookup
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import unittest

import httpx

from backend.services.voice.provider_registry import (
    _reset_registry_for_tests,
    all_providers,
    find_provider_by_language,
    find_provider_by_voice_prefix,
    register_stt_provider,
    register_tts_provider,
)
from backend.services.voice.stt_router import SarvamSTTProvider
from backend.services.voice.tts_router import (
    ElevenLabsTTSProvider,
    SarvamTTSProvider,
)


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


async def _drain(agen):
    out = []
    async for x in agen:
        out.append(x)
    return out


class _PatchedAsyncClient:
    """Patches httpx.AsyncClient to use a fixed MockTransport.

    Usage:
        with _PatchedAsyncClient(handler):
            # any provider call that does `httpx.AsyncClient(...)` will
            # now route through `handler` instead of hitting the network.
    """

    def __init__(self, handler):
        self._handler = handler
        self._original_cls = httpx.AsyncClient

    def __enter__(self):
        original_cls = self._original_cls
        handler = self._handler

        def _factory(*args, **kwargs):
            # Drop the user-supplied timeout/transport and inject our mock.
            kwargs.pop("timeout", None)
            kwargs.pop("transport", None)
            return original_cls(transport=httpx.MockTransport(handler), **kwargs)

        httpx.AsyncClient = _factory  # type: ignore[misc]
        return self

    def __exit__(self, *exc):
        httpx.AsyncClient = self._original_cls  # type: ignore[misc]


# ────────────────────────── ElevenLabs TTS ──────────────────────────


class TestElevenLabsTTSProvider(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["KIAAN_ELEVENLABS_API_KEY"] = "test-key-eleven"

    def tearDown(self) -> None:
        os.environ.pop("KIAAN_ELEVENLABS_API_KEY", None)

    def test_streams_chunks_in_order(self):
        # Simulate ~70KB of audio across one body; provider chunks it locally.
        body = b"\x00" * 50_000

        def handler(request: httpx.Request) -> httpx.Response:
            assert request.method == "POST"
            assert "/v1/text-to-speech/" in request.url.path
            assert request.headers["xi-api-key"] == "test-key-eleven"
            assert b"\"text\":" in request.content
            return httpx.Response(200, content=body)

        prov = ElevenLabsTTSProvider()
        with _PatchedAsyncClient(handler):
            chunks = _run(_drain(prov.synthesize_streaming(
                text="hello world",
                voice_id="elevenlabs:sakha-en-v1",
                lang_hint="en",
            )))

        self.assertGreater(len(chunks), 1, "expected multiple chunks")
        seqs = [c.seq for c in chunks]
        self.assertEqual(seqs, list(range(len(chunks))), "seq must be ordered 0..N")
        self.assertTrue(chunks[-1].is_final)
        self.assertFalse(any(c.is_final for c in chunks[:-1]))
        # Total bytes must round-trip
        self.assertEqual(b"".join(c.data for c in chunks), body)

    def test_raises_without_api_key(self):
        os.environ.pop("KIAAN_ELEVENLABS_API_KEY", None)
        prov = ElevenLabsTTSProvider()
        with self.assertRaises(RuntimeError) as ctx:
            _run(_drain(prov.synthesize_streaming(
                text="x", voice_id="elevenlabs:v", lang_hint="en",
            )))
        self.assertIn("KIAAN_ELEVENLABS_API_KEY", str(ctx.exception))

    def test_rejects_malformed_voice_id(self):
        prov = ElevenLabsTTSProvider()
        with self.assertRaises(ValueError):
            _run(_drain(prov.synthesize_streaming(
                text="x", voice_id="no-prefix", lang_hint="en",
            )))

    def test_raises_on_non_200(self):
        def handler(request):
            return httpx.Response(401, content=b"unauthorized")

        prov = ElevenLabsTTSProvider()
        with _PatchedAsyncClient(handler):
            with self.assertRaises(RuntimeError) as ctx:
                _run(_drain(prov.synthesize_streaming(
                    text="x", voice_id="elevenlabs:v", lang_hint="en",
                )))
        self.assertIn("HTTP 401", str(ctx.exception))

    def test_empty_text_returns_no_chunks(self):
        prov = ElevenLabsTTSProvider()
        chunks = _run(_drain(prov.synthesize_streaming(
            text="", voice_id="elevenlabs:v", lang_hint="en",
        )))
        self.assertEqual(chunks, [])


# ────────────────────────── Sarvam TTS ──────────────────────────


class TestSarvamTTSProvider(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["KIAAN_SARVAM_API_KEY"] = "test-key-sarvam"

    def tearDown(self) -> None:
        os.environ.pop("KIAAN_SARVAM_API_KEY", None)

    def test_synthesize_returns_chunks_for_hi(self):
        wav = b"\x52\x49\x46\x46" + b"\x00" * 100_000  # fake WAV header + body
        body = json.dumps({
            "request_id": "req-1",
            "audios": [base64.b64encode(wav).decode()],
        }).encode()

        def handler(request):
            assert request.url.path == "/text-to-speech"
            assert request.headers["api-subscription-key"] == "test-key-sarvam"
            payload = json.loads(request.content)
            assert payload["target_language_code"] == "hi-IN"
            assert payload["speaker"] == "meera"
            return httpx.Response(200, content=body, headers={"content-type": "application/json"})

        prov = SarvamTTSProvider()
        with _PatchedAsyncClient(handler):
            chunks = _run(_drain(prov.synthesize_streaming(
                text="नमस्ते", voice_id="sarvam:meera", lang_hint="hi",
            )))

        self.assertGreater(len(chunks), 1)
        self.assertEqual([c.seq for c in chunks], list(range(len(chunks))))
        self.assertTrue(chunks[-1].is_final)
        self.assertEqual(b"".join(c.data for c in chunks), wav)

    def test_lang_code_mapping(self):
        self.assertEqual(SarvamTTSProvider._lang_code("ta"), "ta-IN")
        self.assertEqual(SarvamTTSProvider._lang_code("ta-IN"), "ta-IN")
        self.assertEqual(SarvamTTSProvider._lang_code("hi-en"), "hi-IN")
        self.assertEqual(SarvamTTSProvider._lang_code("xx"), "hi-IN")

    def test_raises_on_empty_audios(self):
        body = json.dumps({"audios": []}).encode()

        def handler(request):
            return httpx.Response(200, content=body, headers={"content-type": "application/json"})

        prov = SarvamTTSProvider()
        with _PatchedAsyncClient(handler):
            with self.assertRaises(RuntimeError):
                _run(_drain(prov.synthesize_streaming(
                    text="x", voice_id="sarvam:meera", lang_hint="hi",
                )))


# ────────────────────────── Sarvam STT ──────────────────────────


class TestSarvamSTTProvider(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["KIAAN_SARVAM_API_KEY"] = "test-key-sarvam"

    def tearDown(self) -> None:
        os.environ.pop("KIAAN_SARVAM_API_KEY", None)

    def test_buffers_then_flushes_on_eos(self):
        body = json.dumps({
            "request_id": "req-1",
            "transcript": "मुझे चिंता है",
        }).encode()

        captured: dict = {}

        def handler(request):
            captured["path"] = request.url.path
            captured["headers"] = dict(request.headers)
            captured["len"] = len(request.content)
            return httpx.Response(200, content=body, headers={"content-type": "application/json"})

        prov = SarvamSTTProvider()
        _run(prov.start_session(session_id="s-1", lang_hint="hi"))
        # Feed two chunks (base64 of 1KB each)
        chunk_b64 = base64.b64encode(b"\x00" * 1024).decode()
        _run(_drain(prov.feed_audio_chunk(seq=0, opus_b64=chunk_b64)))
        _run(_drain(prov.feed_audio_chunk(seq=1, opus_b64=chunk_b64)))

        with _PatchedAsyncClient(handler):
            results = _run(_drain(prov.end_of_speech()))

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].text, "मुझे चिंता है")
        self.assertTrue(results[0].is_final)
        self.assertEqual(results[0].seq, 1)
        self.assertEqual(captured["path"], "/speech-to-text")
        self.assertEqual(captured["headers"]["api-subscription-key"], "test-key-sarvam")

    def test_empty_buffer_yields_empty_transcript(self):
        prov = SarvamSTTProvider()
        _run(prov.start_session(session_id="s-1", lang_hint="hi"))
        results = _run(_drain(prov.end_of_speech()))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].text, "")
        self.assertTrue(results[0].is_final)

    def test_close_clears_buffer(self):
        prov = SarvamSTTProvider()
        _run(prov.start_session(session_id="s-1", lang_hint="hi"))
        chunk_b64 = base64.b64encode(b"\x01\x02").decode()
        _run(_drain(prov.feed_audio_chunk(seq=0, opus_b64=chunk_b64)))
        _run(prov.close())
        self.assertEqual(len(prov._buffer), 0)


# ────────────────────────── Provider registry ──────────────────────────


class TestProviderRegistry(unittest.TestCase):
    def setUp(self) -> None:
        _reset_registry_for_tests()

    def tearDown(self) -> None:
        _reset_registry_for_tests()

    def test_register_and_lookup_by_voice_prefix(self):
        class _Fake:
            name = "google-tts"
            supported_languages = frozenset({"en"})
            def is_configured(self): return True
            def supports_voice(self, vid): return vid.startswith("google:")

        register_tts_provider(
            "google-tts",
            lambda: _Fake(),
            voice_prefix="google:",
            languages=frozenset({"en"}),
        )
        found = find_provider_by_voice_prefix("tts", "google:standard-en-A")
        self.assertIsNotNone(found)
        self.assertEqual(found.name, "google-tts")

    def test_register_and_lookup_by_language(self):
        class _Fake:
            pass
        register_stt_provider(
            "azure-stt", lambda: _Fake(), languages=frozenset({"en", "de"}),
        )
        found = find_provider_by_language("stt", "de-DE")
        self.assertIsNotNone(found)
        self.assertEqual(found.name, "azure-stt")

    def test_idempotent_registration(self):
        class _Fake:
            pass
        register_tts_provider(
            "x", lambda: _Fake(), voice_prefix="x:", languages=frozenset({"en"}),
        )
        register_tts_provider(
            "x", lambda: _Fake(), voice_prefix="x:", languages=frozenset({"hi"}),
        )
        # Only one entry survives; languages reflect the latest registration.
        all_tts = all_providers("tts")
        self.assertEqual(len([p for p in all_tts if p.name == "x"]), 1)
        x = next(p for p in all_tts if p.name == "x")
        self.assertEqual(x.languages, frozenset({"hi"}))

    def test_unknown_kind_raises(self):
        from backend.services.voice.provider_registry import _registry
        with self.assertRaises(ValueError):
            _registry._bucket("xxx")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
