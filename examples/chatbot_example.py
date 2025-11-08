#!/usr/bin/env python3
"""
Example usage of the AI Chatbot API

This script demonstrates how to interact with the MindVibe AI Chatbot
for mental health guidance based on Bhagavad Gita wisdom.

Usage:
    python examples/chatbot_example.py

Requirements:
    - Server running at http://localhost:8000
    - Database seeded with wisdom verses (python seed_wisdom.py)
"""


import requests


class ChatbotClient:
    """Simple client for interacting with the MindVibe chatbot API."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session_id: str | None = None

    def start_session(self) -> str:
        """Start a new chat session."""
        response = requests.post(f"{self.base_url}/api/chat/start")
        response.raise_for_status()
        data = response.json()
        self.session_id = data["session_id"]
        print(f"✓ Started new session: {self.session_id[:8]}...")
        return self.session_id

    def send_message(
        self, message: str, language: str = "english", include_sanskrit: bool = False
    ) -> dict:
        """Send a message to the chatbot."""
        payload = {
            "message": message,
            "language": language,
            "include_sanskrit": include_sanskrit,
        }

        if self.session_id:
            payload["session_id"] = self.session_id

        response = requests.post(f"{self.base_url}/api/chat/message", json=payload)
        response.raise_for_status()
        return response.json()

    def get_history(self) -> dict:
        """Get conversation history for current session."""
        if not self.session_id:
            raise ValueError("No active session")

        response = requests.get(f"{self.base_url}/api/chat/history/{self.session_id}")
        response.raise_for_status()
        return response.json()

    def clear_history(self) -> None:
        """Clear conversation history."""
        if not self.session_id:
            raise ValueError("No active session")

        response = requests.delete(
            f"{self.base_url}/api/chat/history/{self.session_id}"
        )
        response.raise_for_status()
        print("✓ Conversation history cleared")

    def check_health(self) -> dict:
        """Check chatbot health status."""
        response = requests.get(f"{self.base_url}/api/chat/health")
        response.raise_for_status()
        return response.json()


def print_response(response: dict) -> None:
    """Pretty print a chatbot response."""
    print("\n" + "=" * 80)
    print("CHATBOT RESPONSE:")
    print("=" * 80)
    print(f"\n{response['response']}\n")

    if response.get("verses"):
        print("-" * 80)
        print("REFERENCED WISDOM:")
        print("-" * 80)
        for i, verse in enumerate(response["verses"], 1):
            print(f"\n{i}. {verse['theme']}")
            print(f"   {verse['text'][:200]}...")
            print(f"   Applications: {', '.join(verse['applications'][:3])}")
            if verse.get("sanskrit"):
                print(f"   Sanskrit: {verse['sanskrit'][:100]}...")

    print("\n" + "=" * 80)
    print(
        f"Session: {response['session_id'][:8]}... | Messages: {response['conversation_length']} | Language: {response['language']}"
    )
    print("=" * 80 + "\n")


def example_single_message():
    """Example 1: Send a single message."""
    print("\n📝 EXAMPLE 1: Single Message\n")

    client = ChatbotClient()

    # Start session
    client.start_session()

    # Send a message
    response = client.send_message(
        "I'm feeling overwhelmed with work and don't know how to cope"
    )

    print_response(response)


def example_conversation():
    """Example 2: Multi-turn conversation."""
    print("\n💬 EXAMPLE 2: Multi-Turn Conversation\n")

    client = ChatbotClient()
    client.start_session()

    messages = [
        "I'm struggling with anxiety about my future",
        "How can I stop worrying about things I can't control?",
        "That's helpful. What about when I feel overwhelmed by daily tasks?",
    ]

    for msg in messages:
        print(f"\n🧑 USER: {msg}")
        response = client.send_message(msg)
        print(f"\n🤖 CHATBOT: {response['response'][:300]}...")
        print(f"   [Referenced {len(response['verses'])} wisdom teaching(s)]")

    # Show full conversation history
    print("\n📚 Full Conversation History:")
    history = client.get_history()
    for i, msg in enumerate(history["messages"], 1):
        role = "🧑 USER" if msg["role"] == "user" else "🤖 BOT"
        print(f"\n{i}. {role}: {msg['content'][:100]}...")


def example_multilingual():
    """Example 3: Multi-language support."""
    print("\n🌍 EXAMPLE 3: Multi-Language Support\n")

    client = ChatbotClient()
    client.start_session()

    # English
    print("\n--- English ---")
    response = client.send_message("How do I find inner peace?", language="english")
    print(f"Response: {response['response'][:200]}...")

    # Hindi (with Sanskrit)
    print("\n--- Hindi with Sanskrit ---")
    response = client.send_message(
        "मुझे शांति कैसे मिलेगी?", language="hindi", include_sanskrit=True
    )
    print(f"Response: {response['response'][:200]}...")
    if response["verses"] and response["verses"][0].get("sanskrit"):
        print(f"Sanskrit verse: {response['verses'][0]['sanskrit'][:100]}...")


def example_mental_health_scenarios():
    """Example 4: Various mental health scenarios."""
    print("\n🧠 EXAMPLE 4: Mental Health Scenarios\n")

    client = ChatbotClient()

    scenarios = [
        ("Anxiety", "I keep worrying about things that might go wrong"),
        ("Stress", "I'm feeling stressed and burned out from work"),
        ("Anger", "I get angry quickly and regret it later"),
        ("Self-doubt", "I don't feel confident in my abilities"),
        ("Depression", "I feel unmotivated and lack energy"),
    ]

    for topic, message in scenarios:
        client.start_session()
        print(f"\n--- {topic} ---")
        print(f"Query: {message}")

        response = client.send_message(message)

        print(f"\nGuidance: {response['response'][:250]}...")
        if response["verses"]:
            themes = [v["theme"] for v in response["verses"]]
            print(f"Themes: {', '.join(themes)}")

        client.clear_history()


def check_system_status():
    """Check chatbot system status."""
    print("\n🏥 SYSTEM HEALTH CHECK\n")

    client = ChatbotClient()
    health = client.check_health()

    print(f"Status: {health['status'].upper()}")
    print(f"OpenAI Enabled: {'✓' if health['openai_enabled'] else '✗'}")
    print(f"Mode: {health['fallback_mode']}")
    print(f"Active Sessions: {health['active_sessions']}")
    print(f"Supported Languages: {', '.join(health['supported_languages'])}")

    if not health["openai_enabled"]:
        print("\n⚠️  OpenAI not configured - using template-based responses")
        print("   To enable AI responses, set OPENAI_API_KEY in .env")


def main():
    """Run all examples."""
    print(
        """
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║          MindVibe AI Chatbot - Usage Examples                         ║
║                                                                        ║
║  AI-powered mental health guidance based on Bhagavad Gita wisdom      ║
║  Presented in a secular, universally applicable way                    ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    """
    )

    try:
        # Check system status first
        check_system_status()

        # Run examples
        example_single_message()
        input("\nPress Enter to continue to next example...")

        example_conversation()
        input("\nPress Enter to continue to next example...")

        example_multilingual()
        input("\nPress Enter to continue to next example...")

        example_mental_health_scenarios()

        print("\n✅ All examples completed successfully!\n")

    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to the server")
        print("   Make sure the server is running: uvicorn main:app --reload")
    except requests.exceptions.HTTPError as e:
        print(f"\n❌ HTTP Error: {e}")
        print("   Make sure the database is seeded: python seed_wisdom.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
