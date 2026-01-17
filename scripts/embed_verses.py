#!/usr/bin/env python3
"""
Generate embeddings for all Bhagavad Gita verses
This script should be run once to populate the embedding column
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import async_session
from backend.services.rag_service import rag_service


async def main():
    """Embed all verses."""
    print("=" * 70)
    print("🧠 MINDVIBE - RAG EMBEDDING GENERATION")
    print("=" * 70)
    print()

    if not rag_service.ready:
        print("❌ ERROR: OpenAI API key not configured")
        print("   Please set OPENAI_API_KEY in your .env file")
        sys.exit(1)

    print(f"✅ RAG Service ready")
    print(f"   Model: {rag_service.embedding_model}")
    print(f"   Dimensions: {rag_service.embedding_dim}")
    print()
    print("🚀 Starting verse embedding generation...")
    print()

    async with async_session() as db:
        count = await rag_service.embed_all_verses(db)

    print()
    print("=" * 70)
    print(f"✅ EMBEDDING COMPLETE!")
    print(f"   Total verses embedded: {count}")
    print(f"   Cost estimate: ${(count * 100 / 1_000_000) * 0.02:.4f}")
    print("=" * 70)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Embedding interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
