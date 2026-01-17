"""
Load testing for MindVibe API
Tests API performance under high concurrent load using Locust

Usage:
    locust -f tests/load/test_api_performance.py --host=http://localhost:8000
    locust -f tests/load/test_api_performance.py --host=http://localhost:8000 --headless --users 100 --spawn-rate 10 --run-time 5m
"""

from locust import HttpUser, task, between
import random

# Sample test data
SAMPLE_MESSAGES = [
    "I feel anxious about the future",
    "How do I find inner peace?",
    "Help me with stress management",
    "I'm struggling with relationships",
    "How do I stay motivated?",
    "Guide me through difficult emotions",
]

LANGUAGES = ["en", "hi", "es", "fr", "de", "ja"]


class MindVibeUser(HttpUser):
    """Simulated user for load testing."""

    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks

    def on_start(self):
        """Called when a simulated user starts."""
        self.user_id = f"load_test_user_{random.randint(1000, 9999)}"
        self.language = random.choice(LANGUAGES)

    @task(5)  # Weight 5 - most common task
    def send_chat_message(self):
        """Send a chat message to KIAAN."""
        message = random.choice(SAMPLE_MESSAGES)

        self.client.post(
            "/api/chat/message",
            json={
                "message": message,
                "user_id": self.user_id,
                "language": self.language,
                "context": "general"
            },
            headers={"Content-Type": "application/json"},
            name="/api/chat/message"
        )

    @task(2)  # Weight 2
    def search_verses(self):
        """Search for Gita verses."""
        keywords = ["karma", "dharma", "peace", "equanimity", "detachment"]
        keyword = random.choice(keywords)

        self.client.get(
            f"/api/wisdom/search?q={keyword}&limit=10",
            name="/api/wisdom/search"
        )

    @task(1)  # Weight 1
    def get_verse_by_id(self):
        """Get a specific verse."""
        chapter = random.randint(1, 18)
        verse = random.randint(1, 78)

        self.client.get(
            f"/api/wisdom/verse/{chapter}/{verse}",
            name="/api/wisdom/verse/[chapter]/[verse]"
        )

    @task(3)  # Weight 3
    def translate_message(self):
        """Test translation service."""
        message = random.choice(SAMPLE_MESSAGES)
        target_lang = random.choice(LANGUAGES)

        self.client.post(
            "/api/translate",
            json={
                "text": message,
                "target_language": target_lang,
                "source_language": "en"
            },
            headers={"Content-Type": "application/json"},
            name="/api/translate"
        )
