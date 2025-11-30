import asyncio
import os

# Use an async-friendly driver to satisfy SQLAlchemy's async engine setup during imports.
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/testdb"
)

from backend.routes.chat import KIAAN


def test_crisis_keywords_from_env(monkeypatch):
    monkeypatch.setenv("CRISIS_KEYWORDS", "distress, emergency")
    bot = KIAAN()

    assert "distress" in bot.crisis_keywords
    assert "emergency" in bot.crisis_keywords


def test_crisis_response_bypasses_model_with_custom_keywords():
    bot = KIAAN(crisis_keywords=["red alert"])

    response = asyncio.run(
        bot.generate_response_with_gita(
            "This is a RED ALERT situation and I need help", db=None
        )
    )

    assert "Please reach out for help" in response


def test_crisis_response_is_rate_limited(monkeypatch):
    bot = KIAAN(crisis_keywords=["self-harm"], crisis_cooldown_seconds=30)

    first = asyncio.run(bot.generate_response_with_gita("I feel like self-harm", db=None))
    assert "Please reach out for help" in first

    second = asyncio.run(
        bot.generate_response_with_gita("self-harm thoughts again", db=None)
    )
    assert "already provided" in second

    # Simulate cooldown expiry
    bot._last_crisis_response_at = bot._last_crisis_response_at - 40  # type: ignore[operator]
    third = asyncio.run(
        bot.generate_response_with_gita("thinking about self-harm", db=None)
    )
    assert "Please reach out for help" in third
