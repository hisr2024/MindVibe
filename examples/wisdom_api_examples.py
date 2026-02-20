#!/usr/bin/env python3
"""
Example usage of the MindVibe Wisdom API

This script demonstrates how to use the various wisdom API endpoints
to retrieve verses, perform searches, and get AI-powered guidance.
"""

import asyncio

import httpx

BASE_URL = "http://localhost:8000"


async def example_list_verses() -> None:
    """Example: List wisdom verses with filtering."""
    print("\n" + "=" * 60)
    print("Example 1: List wisdom verses")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        # List first 5 verses
        response = await client.get(f"{BASE_URL}/api/wisdom/verses?limit=5")
        data = response.json()

        print(f"\nTotal verses available: {data['total']}")
        print(f"Showing {len(data['verses'])} verses:")

        for verse in data["verses"]:
            print(f"\n  - {verse['verse_id']}: {verse['theme']}")
            print(f"    Applications: {', '.join(verse['applications'][:2])}...")


async def example_filter_by_theme() -> None:
    """Example: Filter verses by theme."""
    print("\n" + "=" * 60)
    print("Example 2: Filter verses by theme")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/wisdom/verses",
            params={"theme": "action_without_attachment", "limit": 3},
        )
        data = response.json()

        print(f"\nFound {len(data['verses'])} verses on 'action without attachment':")
        for verse in data["verses"]:
            print(f"\n  {verse['verse_id']}: {verse['text'][:100]}...")


async def example_filter_by_application() -> None:
    """Example: Filter verses by spiritual wellness application."""
    print("\n" + "=" * 60)
    print("Example 3: Filter verses by spiritual wellness application")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/wisdom/verses",
            params={"application": "anxiety_management", "limit": 3},
        )
        data = response.json()

        print(f"\nFound {len(data['verses'])} verses for anxiety management:")
        for verse in data["verses"]:
            print(f"\n  {verse['verse_id']}: {verse['theme']}")
            print(f"    {verse['text'][:80]}...")


async def example_get_specific_verse() -> None:
    """Example: Get a specific verse by ID."""
    print("\n" + "=" * 60)
    print("Example 4: Get a specific verse")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/wisdom/verses/2.47", params={"include_sanskrit": True}
        )

        if response.status_code == 200:
            verse = response.json()
            print(f"\nVerse {verse['verse_id']}: {verse['theme']}")
            print(f"\nEnglish: {verse['text']}")
            if "sanskrit" in verse:
                print(f"Sanskrit: {verse['sanskrit']}")
            print(f"\nContext: {verse['context']}")
            print(f"Applications: {', '.join(verse['applications'])}")
        else:
            print(f"Error: {response.status_code}")


async def example_semantic_search() -> None:
    """Example: Perform semantic search."""
    print("\n" + "=" * 60)
    print("Example 5: Semantic search")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/wisdom/search",
            params={"limit": 3},
            json={"query": "how to manage stress and anxiety"},
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\nSearch query: '{data['query']}'")
            print(f"Found {data['total_results']} relevant verses:\n")

            for result in data["results"]:
                print(
                    f"  {result['verse_id']} (relevance: {result['relevance_score']:.3f})"
                )
                print(f"  Theme: {result['theme']}")
                print(f"  Text: {result['text'][:100]}...")
                print()
        else:
            print(f"Error: {response.status_code}")


async def example_search_with_filter() -> None:
    """Example: Search with theme filter."""
    print("\n" + "=" * 60)
    print("Example 6: Search with theme filter")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/wisdom/search",
            params={"theme": "control_of_mind", "limit": 2},
            json={"query": "controlling my thoughts"},
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\nSearch query: '{data['query']}'")
            print("Filter: control_of_mind theme")
            print("Results:\n")

            for result in data["results"]:
                print(f"  {result['verse_id']}: {result['theme']}")
                print(f"  Relevance: {result['relevance_score']:.3f}")
                print(f"  {result['text'][:100]}...\n")


async def example_wisdom_query() -> None:
    """Example: Get AI-powered wisdom guidance."""
    print("\n" + "=" * 60)
    print("Example 7: AI-powered wisdom query")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/wisdom/query",
            json={
                "query": "I'm feeling overwhelmed by work stress",
                "language": "english",
                "include_sanskrit": False,
            },
        )

        if response.status_code == 200:
            data = response.json()
            print("\nQuestion: I'm feeling overwhelmed by work stress")
            print(f"\nGuidance:\n{data['response'][:200]}...")
            print(f"\nBased on {len(data['verses'])} wisdom verses")
        else:
            print(f"Error: {response.status_code}")


async def example_list_themes() -> None:
    """Example: List all available themes."""
    print("\n" + "=" * 60)
    print("Example 8: List all themes")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/wisdom/themes")
        data = response.json()

        print(f"\nAvailable themes ({len(data['themes'])}):")
        for theme in data["themes"]:
            print(f"  - {theme['id']}: {theme['name']}")


async def example_list_applications() -> None:
    """Example: List all spiritual wellness applications."""
    print("\n" + "=" * 60)
    print("Example 9: List all spiritual wellness applications")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/wisdom/applications")
        data = response.json()

        print(f"\nAvailable spiritual wellness applications ({data['total']}):")
        for app in data["applications"]:
            print(f"  - {app}")


async def example_multilingual() -> None:
    """Example: Get verse in different languages."""
    print("\n" + "=" * 60)
    print("Example 10: Multi-language support")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        verse_id = "2.47"

        # Get in English
        response_en = await client.get(
            f"{BASE_URL}/api/wisdom/verses/{verse_id}", params={"language": "english"}
        )

        # Get in Hindi
        response_hi = await client.get(
            f"{BASE_URL}/api/wisdom/verses/{verse_id}", params={"language": "hindi"}
        )

        # Get in Sanskrit
        response_sa = await client.get(
            f"{BASE_URL}/api/wisdom/verses/{verse_id}", params={"language": "sanskrit"}
        )

        if all(r.status_code == 200 for r in [response_en, response_hi, response_sa]):
            print(f"\nVerse {verse_id} in multiple languages:")
            print(f"\nEnglish: {response_en.json()['text'][:100]}...")
            print(f"\nHindi: {response_hi.json()['text'][:100]}...")
            print(f"\nSanskrit: {response_sa.json()['text'][:100]}...")


async def main() -> None:
    """Run all examples."""
    print("\n" + "=" * 60)
    print("MindVibe Wisdom API - Usage Examples")
    print("=" * 60)
    print("\nMake sure the server is running:")
    print("  uvicorn main:app --reload")
    print("\nNote: Some examples may fail if the database is not seeded.")
    print("Run: python seed_wisdom.py")

    try:
        # Run examples
        await example_list_verses()
        await example_filter_by_theme()
        await example_filter_by_application()
        await example_get_specific_verse()
        await example_semantic_search()
        await example_search_with_filter()
        await example_list_themes()
        await example_list_applications()
        await example_multilingual()
        # Note: Skipping example_wisdom_query as it requires OpenAI API key

        print("\n" + "=" * 60)
        print("Examples completed successfully!")
        print("=" * 60)

    except httpx.ConnectError:
        print("\n" + "=" * 60)
        print("Error: Could not connect to the API server")
        print("=" * 60)
        print("\nMake sure the server is running:")
        print("  uvicorn main:app --reload")
        print("\nAnd the database is seeded:")
        print("  python seed_wisdom.py")
    except Exception as e:
        print(f"\nError: {type(e).__name__}: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())
