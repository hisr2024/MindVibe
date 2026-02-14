from backend.services.companion_voice_service import build_companion_ssml
from backend.services.elevenlabs_tts_service import get_elevenlabs_voice_for_persona
from backend.services.sarvam_tts_service import get_sarvam_speaker_for_companion


def test_voice_id_survives_ssml_proxy_payload():
    payload = build_companion_ssml(
        text="Hello friend",
        mood="neutral",
        voice_id="elevenlabs-nova",
        language="en",
    )

    assert payload["voice_id"] == "elevenlabs-nova"


def test_elevenlabs_mapping_supports_new_companion_ids():
    aura = get_elevenlabs_voice_for_persona("sarvam-aura")
    rishi = get_elevenlabs_voice_for_persona("sarvam-rishi")
    nova = get_elevenlabs_voice_for_persona("elevenlabs-nova")
    orion = get_elevenlabs_voice_for_persona("elevenlabs-orion")

    assert aura["name"] == "Sarah"
    assert rishi["name"] == "Adam"
    assert nova["name"] == "Rachel"
    assert orion["name"] == "Adam"


def test_sarvam_mapping_supports_new_companion_ids():
    assert get_sarvam_speaker_for_companion("sarvam-aura") == "meera"
    assert get_sarvam_speaker_for_companion("sarvam-rishi") == "arvind"
    assert get_sarvam_speaker_for_companion("elevenlabs-nova") == "pavithra"
    assert get_sarvam_speaker_for_companion("elevenlabs-orion") == "arvind"
