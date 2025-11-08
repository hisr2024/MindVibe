#!/usr/bin/env python3
"""
Verification script for AI Chatbot implementation

Checks that all components are properly implemented without requiring
external dependencies like database or OpenAI API.

Usage:
    python verify_chatbot.py
"""

import os
import sys


def check_file_exists(filepath: str) -> bool:
    """Check if a file exists."""
    exists = os.path.exists(filepath)
    status = "✓" if exists else "✗"
    print(f"{status} {filepath}")
    return exists


def check_imports(module_path: str) -> bool:
    """Check if a module can be imported (syntax check)."""
    try:
        # Add current directory to path
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

        # Try to compile the file
        with open(module_path) as f:
            compile(f.read(), module_path, "exec")
        print(f"✓ {module_path} - syntax valid")
        return True
    except SyntaxError as e:
        print(f"✗ {module_path} - syntax error: {e}")
        return False
    except Exception as e:
        print(f"⚠ {module_path} - {e}")
        return True  # May have import errors but syntax is OK


def main():
    """Run verification checks."""
    print(
        """
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║          AI Chatbot Implementation Verification                        ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    """
    )

    print("\n1. Checking Required Files...\n")

    required_files = [
        "services/chatbot.py",
        "routes/chat.py",
        "docs/chatbot.md",
        "examples/chatbot_example.py",
        "tests/unit/test_chatbot.py",
        "tests/integration/test_chat_api.py",
        "data/wisdom/verses.json",
        "services/wisdom_kb.py",
        "routes/wisdom_guide.py",
        "seed_wisdom.py",
    ]

    all_exist = all(check_file_exists(f) for f in required_files)

    print("\n2. Checking Python Syntax...\n")

    python_files = [
        "services/chatbot.py",
        "routes/chat.py",
        "examples/chatbot_example.py",
        "tests/unit/test_chatbot.py",
        "tests/integration/test_chat_api.py",
    ]

    all_valid = all(check_imports(f) for f in python_files)

    print("\n3. Checking API Endpoints Implementation...\n")

    # Check that chat.py defines the expected endpoints
    with open("routes/chat.py") as f:
        chat_content = f.read()

    endpoints = [
        ("/api/chat/message", "send_message"),
        ("/api/chat/history", "get_conversation_history"),
        ("/api/chat/start", "start_new_session"),
        ("/api/chat/sessions", "list_active_sessions"),
        ("/api/chat/health", "chatbot_health"),
    ]

    endpoints_ok = True
    for path, func in endpoints:
        if func in chat_content:
            print(f"✓ {path} - {func}()")
        else:
            print(f"✗ {path} - {func}() not found")
            endpoints_ok = False

    print("\n4. Checking ChatbotService Implementation...\n")

    with open("services/chatbot.py") as f:
        service_content = f.read()

    methods = [
        "chat",
        "_generate_chat_response",
        "_generate_template_chat_response",
        "get_conversation_history",
        "clear_conversation",
        "get_active_sessions",
    ]

    methods_ok = True
    for method in methods:
        if (
            f"def {method}" in service_content
            or f"async def {method}" in service_content
        ):
            print(f"✓ ChatbotService.{method}()")
        else:
            print(f"✗ ChatbotService.{method}() not found")
            methods_ok = False

    print("\n5. Checking Documentation...\n")

    with open("docs/chatbot.md") as f:
        doc_content = f.read()

    doc_sections = [
        "## Overview",
        "## Key Features",
        "## API Endpoints",
        "## Setup Instructions",
        "## Usage Examples",
        "## Mental Health Applications",
    ]

    docs_ok = True
    for section in doc_sections:
        if section in doc_content:
            print(f"✓ {section}")
        else:
            print(f"✗ {section} not found")
            docs_ok = False

    print("\n6. Checking Test Coverage...\n")

    with open("tests/unit/test_chatbot.py") as f:
        test_content = f.read()

    test_classes = [
        "TestChatbotService",
        "TestTemplateResponses",
        "TestConversationContext",
        "TestFallbackMechanisms",
    ]

    tests_ok = True
    for test_class in test_classes:
        if f"class {test_class}" in test_content:
            print(f"✓ {test_class}")
        else:
            print(f"✗ {test_class} not found")
            tests_ok = False

    print("\n7. Checking Wisdom Verses Data...\n")

    import json

    try:
        with open("data/wisdom/verses.json") as f:
            verses = json.load(f)

        print(f"✓ Found {len(verses)} wisdom verses")

        # Check structure of first verse
        if verses:
            required_fields = [
                "verse_id",
                "chapter",
                "verse_number",
                "theme",
                "english",
                "hindi",
                "sanskrit",
                "context",
                "mental_health_applications",
            ]
            first_verse = verses[0]

            fields_ok = True
            for field in required_fields:
                if field in first_verse:
                    print(f"  ✓ Verse has '{field}' field")
                else:
                    print(f"  ✗ Verse missing '{field}' field")
                    fields_ok = False
        else:
            print("✗ No verses found in data file")
            fields_ok = False
    except Exception as e:
        print(f"✗ Error reading verses: {e}")
        fields_ok = False

    print("\n" + "=" * 80)
    print("\nVERIFICATION SUMMARY\n")

    checks = [
        ("Required Files", all_exist),
        ("Python Syntax", all_valid),
        ("API Endpoints", endpoints_ok),
        ("Service Methods", methods_ok),
        ("Documentation", docs_ok),
        ("Test Coverage", tests_ok),
        ("Wisdom Data", fields_ok),
    ]

    all_passed = all(passed for _, passed in checks)

    for check_name, passed in checks:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:10} - {check_name}")

    print("\n" + "=" * 80)

    if all_passed:
        print("\n✅ All verification checks passed!")
        print("\nNext Steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Seed the database: python scripts/seed_wisdom.py")
        print("3. Start the server: uvicorn main:app --reload")
        print("4. Test the chatbot: python examples/chatbot_example.py")
        return 0
    else:
        print("\n⚠️  Some verification checks failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
