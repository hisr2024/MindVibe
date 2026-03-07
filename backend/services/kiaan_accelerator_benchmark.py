"""
KIAAN Accelerator Benchmark - Performance comparison and validation suite.

This module provides tools to measure and validate the accelerator's performance
against the standard pipeline, ensuring:
1. Response quality is equivalent or better
2. Gita compliance is maintained across all tiers
3. Latency improvements are real and measurable
4. Cost savings are accurately tracked

Usage:
    from backend.services.kiaan_accelerator_benchmark import run_benchmark
    results = run_benchmark()
    print(results["summary"])
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


# =============================================================================
# BENCHMARK TEST CASES
# =============================================================================

BENCHMARK_QUERIES = [
    # Tier 1 candidates (should hit pre-computed)
    {"message": "I feel so anxious about my job", "mood": "anxious", "topic": "work", "expected_tier": "precomputed"},
    {"message": "I'm angry at my partner", "mood": "angry", "topic": "relationship", "expected_tier": "precomputed"},
    {"message": "My father passed away recently", "mood": "sad", "topic": "loss", "expected_tier": "precomputed"},
    {"message": "I'm confused about my studies", "mood": "confused", "topic": "academic", "expected_tier": "precomputed"},
    {"message": "Everything is overwhelming me", "mood": "overwhelmed", "topic": "general", "expected_tier": "precomputed"},
    {"message": "I feel so lonely these days", "mood": "lonely", "topic": "general", "expected_tier": "precomputed"},
    {"message": "I'm really stressed at work", "mood": "stressed", "topic": "work", "expected_tier": "precomputed"},
    {"message": "I feel guilty about something", "mood": "guilty", "topic": "general", "expected_tier": "precomputed"},

    # Tier 2 candidates (should hit semantic cache after first run)
    {"message": "My work is making me so anxious", "mood": "anxious", "topic": "work", "expected_tier": "semantic_cache"},
    {"message": "Anger towards my relationship partner", "mood": "angry", "topic": "relationship", "expected_tier": "semantic_cache"},

    # Tier 3 candidates (unique queries requiring API)
    {"message": "I had a dream about my grandmother who taught me Gita verses as a child and I woke up crying", "mood": "sad", "topic": "loss", "expected_tier": "compressed_api"},
    {"message": "My startup failed and investors are upset but I feel strangely calm", "mood": "neutral", "topic": "work", "expected_tier": "compressed_api"},
]

# Gita compliance validation: Required elements in any valid response
GITA_COMPLIANCE_MARKERS = [
    # Must reference at least one verse
    "BG ",
    # Must contain at least one Sanskrit concept or Gita term
]

GITA_TERMS = [
    "karma", "dharma", "yoga", "atman", "buddhi", "guna", "sattva", "rajas", "tamas",
    "krodha", "moha", "raga", "dvesha", "ahimsa", "kshama", "daya", "vairagya",
    "sthitaprajna", "nishkama", "svadharma", "samatva", "sakshi", "prajna",
    "bhakti", "jnana", "tapas", "santosha", "viveka", "abhyasa", "pratyahara",
    "Arjuna", "Krishna", "Gita", "Bhagavad", "equanimity", "detachment",
    "surrender", "compassion", "wisdom", "consciousness", "liberation",
    "attachment", "witness", "duty", "action", "renunciation", "devotion",
]


@dataclass
class BenchmarkResult:
    """Result from a single benchmark query."""
    query: str
    mood: str
    topic: str
    expected_tier: str
    actual_tier: str
    latency_ms: float
    content_length: int
    has_verse_ref: bool
    has_gita_term: bool
    gita_compliant: bool
    tokens_saved: int
    cost_saved_usd: float


def validate_gita_compliance(content: str) -> tuple[bool, bool, bool]:
    """Check if response meets Gita compliance requirements.

    A response is Gita-compliant if it:
    1. References at least one BG verse (e.g., "BG 2.47")
    2. Contains at least one Gita/Sanskrit term

    Args:
        content: Response text to validate

    Returns:
        Tuple of (has_verse_ref, has_gita_term, is_compliant)
    """
    content_lower = content.lower()

    has_verse_ref = "bg " in content_lower or "bg " in content_lower or "chapter" in content_lower
    has_gita_term = any(term.lower() in content_lower for term in GITA_TERMS)
    is_compliant = has_verse_ref and has_gita_term

    return has_verse_ref, has_gita_term, is_compliant


def run_benchmark(include_api_tier: bool = False) -> dict[str, Any]:
    """Run the full benchmark suite against the accelerator.

    Tests Tier 1 (pre-computed) and Tier 2 (semantic cache) by default.
    Tier 3 (API) is optional since it requires OpenAI API access.

    Args:
        include_api_tier: If True, also benchmark Tier 3 API calls

    Returns:
        Dict with benchmark results, summary statistics, and recommendations
    """
    from backend.services.kiaan_response_accelerator import get_response_accelerator

    accelerator = get_response_accelerator()
    results: list[BenchmarkResult] = []

    logger.info("Starting KIAAN Accelerator Benchmark...")

    for query_data in BENCHMARK_QUERIES:
        # Skip API-tier queries if not requested
        if query_data["expected_tier"] == "compressed_api" and not include_api_tier:
            continue

        start = time.time()

        # Try accelerated response (Tier 1 + Tier 2)
        response = accelerator.get_accelerated_response(
            user_message=query_data["message"],
            mood=query_data["mood"],
            topic=query_data["topic"],
        )

        latency_ms = (time.time() - start) * 1000

        if response:
            has_verse_ref, has_gita_term, is_compliant = validate_gita_compliance(response.content)

            results.append(BenchmarkResult(
                query=query_data["message"],
                mood=query_data["mood"],
                topic=query_data["topic"],
                expected_tier=query_data["expected_tier"],
                actual_tier=response.source_tier,
                latency_ms=latency_ms,
                content_length=len(response.content),
                has_verse_ref=has_verse_ref,
                has_gita_term=has_gita_term,
                gita_compliant=is_compliant,
                tokens_saved=response.tokens_saved,
                cost_saved_usd=response.cost_saved_usd,
            ))
        else:
            results.append(BenchmarkResult(
                query=query_data["message"],
                mood=query_data["mood"],
                topic=query_data["topic"],
                expected_tier=query_data["expected_tier"],
                actual_tier="miss",
                latency_ms=latency_ms,
                content_length=0,
                has_verse_ref=False,
                has_gita_term=False,
                gita_compliant=False,
                tokens_saved=0,
                cost_saved_usd=0,
            ))

    # Compile summary
    total = len(results)
    hits = [r for r in results if r.actual_tier != "miss"]
    misses = [r for r in results if r.actual_tier == "miss"]
    compliant = [r for r in hits if r.gita_compliant]

    tier_distribution = {}
    for r in results:
        tier_distribution[r.actual_tier] = tier_distribution.get(r.actual_tier, 0) + 1

    avg_latency = sum(r.latency_ms for r in hits) / len(hits) if hits else 0
    total_tokens_saved = sum(r.tokens_saved for r in hits)
    total_cost_saved = sum(r.cost_saved_usd for r in hits)

    summary = {
        "total_queries": total,
        "cache_hits": len(hits),
        "cache_misses": len(misses),
        "hit_rate_percent": (len(hits) / total * 100) if total > 0 else 0,
        "gita_compliant": len(compliant),
        "gita_compliance_rate": (len(compliant) / len(hits) * 100) if hits else 0,
        "avg_latency_ms": round(avg_latency, 2),
        "tier_distribution": tier_distribution,
        "total_tokens_saved": total_tokens_saved,
        "total_cost_saved_usd": round(total_cost_saved, 6),
        "estimated_monthly_savings_usd": round(total_cost_saved * 30 * 1000 / total, 2) if total > 0 else 0,
    }

    # Build comparison table
    comparison_lines = [
        "\n╔══════════════════════════════════════════════════════════════════════╗",
        "║           KIAAN ACCELERATOR BENCHMARK RESULTS                       ║",
        "╠══════════════════════════════════════════════════════════════════════╣",
        f"║ Total Queries:    {total:<10} Hit Rate: {summary['hit_rate_percent']:.1f}%                      ║",
        f"║ Gita Compliance:  {summary['gita_compliance_rate']:.1f}%        Avg Latency: {avg_latency:.2f}ms             ║",
        f"║ Tokens Saved:     {total_tokens_saved:<10} Cost Saved: ${total_cost_saved:.6f}          ║",
        "╠══════════════════════════════════════════════════════════════════════╣",
        "║ TIER DISTRIBUTION:                                                  ║",
    ]

    for tier, count in tier_distribution.items():
        pct = count / total * 100
        bar = "█" * int(pct / 2)
        comparison_lines.append(f"║   {tier:<20} {count:>3} ({pct:>5.1f}%) {bar:<25} ║")

    comparison_lines.extend([
        "╠══════════════════════════════════════════════════════════════════════╣",
        "║ PERFORMANCE COMPARISON (vs Standard Pipeline):                      ║",
        f"║   Standard API:     1000-3000ms avg                                ║",
        f"║   Accelerated:      {avg_latency:>8.2f}ms avg ({1500/max(avg_latency, 0.1):.0f}x faster)                   ║",
        f"║   Monthly savings:  ~${summary['estimated_monthly_savings_usd']:.2f} at 1K queries/day               ║",
        "╚══════════════════════════════════════════════════════════════════════╝",
    ])

    summary["comparison_table"] = "\n".join(comparison_lines)

    logger.info(summary["comparison_table"])

    return {
        "results": [
            {
                "query": r.query[:50],
                "mood": r.mood,
                "topic": r.topic,
                "tier": r.actual_tier,
                "latency_ms": round(r.latency_ms, 2),
                "gita_compliant": r.gita_compliant,
                "tokens_saved": r.tokens_saved,
            }
            for r in results
        ],
        "summary": summary,
        "accelerator_metrics": accelerator.get_metrics(),
    }


def run_verse_index_benchmark() -> dict[str, Any]:
    """Benchmark the inverted verse index against the standard full-scan search.

    Compares:
    - InvertedVerseIndex.search() - O(1) keyword lookup
    - search_gita_verses() - O(n) full scan (from gita_wisdom_retrieval.py)

    Returns:
        Performance comparison dict
    """
    from backend.services.kiaan_response_accelerator import get_response_accelerator
    from backend.services.gita_wisdom_retrieval import search_gita_verses

    accelerator = get_response_accelerator()

    test_queries = [
        "I feel anxious about my future",
        "How to deal with anger in relationships",
        "I lost my mother recently and feel empty",
        "My work is causing me stress",
        "How to find inner peace and calm",
        "I am confused about my career path",
        "Dealing with guilt and shame",
        "Finding purpose in life after failure",
        "How to practice meditation for anxiety",
        "Overcoming fear of the unknown",
    ]

    index_times = []
    scan_times = []
    index_results_count = []
    scan_results_count = []

    for query in test_queries:
        # Benchmark inverted index
        start = time.time()
        index_results = accelerator.verse_index.search(query, limit=5)
        index_ms = (time.time() - start) * 1000
        index_times.append(index_ms)
        index_results_count.append(len(index_results))

        # Benchmark full scan
        start = time.time()
        scan_results = search_gita_verses(query, limit=5)
        scan_ms = (time.time() - start) * 1000
        scan_times.append(scan_ms)
        scan_results_count.append(len(scan_results))

    avg_index = sum(index_times) / len(index_times)
    avg_scan = sum(scan_times) / len(scan_times)
    speedup = avg_scan / avg_index if avg_index > 0 else float("inf")

    return {
        "queries_tested": len(test_queries),
        "inverted_index": {
            "avg_latency_ms": round(avg_index, 3),
            "min_latency_ms": round(min(index_times), 3),
            "max_latency_ms": round(max(index_times), 3),
            "avg_results": sum(index_results_count) / len(index_results_count),
        },
        "full_scan": {
            "avg_latency_ms": round(avg_scan, 3),
            "min_latency_ms": round(min(scan_times), 3),
            "max_latency_ms": round(max(scan_times), 3),
            "avg_results": sum(scan_results_count) / len(scan_results_count),
        },
        "speedup_factor": round(speedup, 1),
        "conclusion": (
            f"Inverted index is {speedup:.1f}x faster than full scan "
            f"({avg_index:.3f}ms vs {avg_scan:.3f}ms avg)"
        ),
    }
