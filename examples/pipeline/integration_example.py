#!/usr/bin/env python3
"""
Integration Example: Context Transformation Pipeline with Wisdom Database

This example demonstrates how to use the Context Transformation Pipeline
to process and enrich existing wisdom verses for the MindVibe application.

It shows:
1. Loading raw verse data
2. Transforming through the pipeline
3. Preparing data for database insertion
4. Quality assessment and reporting
"""

import json
import os
import sys
import traceback
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from services.pipeline import ContextTransformationPipeline


def load_wisdom_verses(filepath: str = None):
    """Load wisdom verses from JSON file."""
    if filepath is None:
        # Default to the actual wisdom verses file
        filepath = (
            Path(__file__).parent.parent.parent / "data" / "wisdom" / "verses.json"
        )

    if not os.path.exists(filepath):
        print(f"Warning: Verses file not found at {filepath}")
        return []

    with open(filepath, encoding="utf-8") as f:
        verses = json.load(f)

    return verses


def transform_wisdom_database():
    """Transform all wisdom verses through the pipeline."""
    print("=" * 80)
    print("Context Transformation Pipeline - Wisdom Database Integration")
    print("=" * 80)

    # Load verses
    print("\n1. Loading wisdom verses...")
    verses = load_wisdom_verses()
    print(f"   Loaded {len(verses)} verses from database")

    # Create pipeline with full features
    print("\n2. Creating transformation pipeline...")
    pipeline = ContextTransformationPipeline.create_full_pipeline(strict=False)
    config = pipeline.export_configuration()
    print("   Pipeline configuration:")
    for key, value in config.items():
        print(f"     - {key}: {value}")

    # Transform all verses
    print("\n3. Transforming verses...")
    transformed_verses = pipeline.transform_batch(verses, continue_on_error=True)

    # Get statistics
    stats = pipeline.get_statistics()
    print("\n4. Transformation Statistics:")
    print(f"   - Total processed: {stats['processed']}")
    print(f"   - Validated: {stats['validated']}")
    print(f"   - Sanitized: {stats['sanitized']}")
    print(f"   - Enriched: {stats['enriched']}")
    print(f"   - Errors: {stats['errors']}")

    # Quality assessment
    print("\n5. Quality Assessment:")
    assess_quality(transformed_verses)

    # Show examples
    print("\n6. Sample Transformations:")
    show_sample_transformations(verses[:3], transformed_verses[:3])

    return transformed_verses


def assess_quality(verses):
    """Assess the quality of transformed verses."""
    if not verses:
        print("   No verses to assess")
        return

    # Calculate average metadata score
    scores = [v.get("metadata_score", 0) for v in verses]
    avg_score = sum(scores) / len(scores) if scores else 0

    # Count verses with various features
    with_principles = sum(1 for v in verses if v.get("principles"))
    with_keywords = sum(1 for v in verses if v.get("keywords"))
    with_suggestions = sum(1 for v in verses if v.get("suggested_applications"))

    print(f"   - Average metadata score: {avg_score:.2f}")
    print(
        f"   - Verses with principles: {with_principles}/{len(verses)} ({with_principles/len(verses)*100:.1f}%)"
    )
    print(
        f"   - Verses with keywords: {with_keywords}/{len(verses)} ({with_keywords/len(verses)*100:.1f}%)"
    )
    print(
        f"   - Verses with suggestions: {with_suggestions}/{len(verses)} ({with_suggestions/len(verses)*100:.1f}%)"
    )

    # Find best and worst scores
    if scores:
        best_idx = scores.index(max(scores))
        worst_idx = scores.index(min(scores))
        print(
            f"   - Best score: {max(scores):.2f} (Verse {verses[best_idx].get('verse_id', 'unknown')})"
        )
        print(
            f"   - Lowest score: {min(scores):.2f} (Verse {verses[worst_idx].get('verse_id', 'unknown')})"
        )


def show_sample_transformations(original, transformed):
    """Show sample transformations."""
    for i, (orig, trans) in enumerate(zip(original, transformed, strict=False), 1):
        print(f"\n   Sample {i}: Verse {trans.get('verse_id', 'unknown')}")
        print("   ------------")

        # Show sanitization
        orig_context = orig.get("context", "")[:80]
        trans_context = trans.get("context", "")[:80]
        if orig_context != trans_context:
            print(f"   Original context: {orig_context}...")
            print(f"   Sanitized: {trans_context}...")

        # Show enrichment
        principles = trans.get("principles", [])
        keywords = trans.get("keywords", [])[:5]

        print(f"   Principles: {', '.join(principles)}")
        print(f"   Keywords: {', '.join(keywords)}")
        print(f"   Chapter theme: {trans.get('chapter_theme', 'N/A')}")
        print(f"   Metadata score: {trans.get('metadata_score', 0):.2f}")


def save_transformed_verses(verses, output_path):
    """Save transformed verses to JSON file."""
    output = {
        "version": "1.0.0",
        "pipeline": "ContextTransformationPipeline",
        "total_verses": len(verses),
        "verses": verses,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n   Saved {len(verses)} transformed verses to {output_path}")


def compare_before_after():
    """Compare specific verses before and after transformation."""
    print("\n" + "=" * 80)
    print("Before/After Comparison")
    print("=" * 80)

    # Sample verse with religious references
    verse = {
        "chapter": 2,
        "verse_number": 47,
        "verse_id": "2.47",
        "theme": "action_without_attachment",
        "english": "You have the right to perform your duties, but you are not entitled to the fruits of your actions.",
        "hindi": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।",
        "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥",
        "context": "Lord Krishna teaches Arjuna about performing duty without attachment to outcomes.",
        "mental_health_applications": [
            "anxiety_management",
            "stress_reduction",
            "letting_go",
        ],
    }

    pipeline = ContextTransformationPipeline.create_full_pipeline()
    transformed = pipeline.transform(verse)

    print("\nBEFORE TRANSFORMATION:")
    print(f"  Context: {verse['context']}")
    print(f"  Theme: {verse['theme']}")
    print(f"  Applications: {verse['mental_health_applications']}")

    print("\nAFTER TRANSFORMATION:")
    print(f"  Context: {transformed['context']}")
    print(f"  Theme: {transformed['theme']}")
    print(f"  Applications: {transformed['mental_health_applications']}")
    print("\nENRICHED DATA:")
    print(f"  Verse ID: {transformed['verse_id']}")
    print(f"  Principles: {transformed.get('principles', [])}")
    print(f"  Keywords: {transformed.get('keywords', [])[:10]}")
    print(f"  Chapter Theme: {transformed.get('chapter_theme', 'N/A')}")
    print(f"  Metadata Score: {transformed.get('metadata_score', 0):.2f}")
    print(f"  Suggested Applications: {transformed.get('suggested_applications', [])}")


def demonstrate_validation():
    """Demonstrate validation capabilities."""
    print("\n" + "=" * 80)
    print("Validation Demonstration")
    print("=" * 80)

    pipeline = ContextTransformationPipeline()

    # Valid verse
    valid_verse = {
        "chapter": 2,
        "verse_number": 47,
        "theme": "action",
        "english": "You have the right to work.",
        "hindi": "तुम्हारा अधिकार है।",
        "sanskrit": "कर्मण्येवाधिकारस्ते॥",
        "context": "About duty",
        "mental_health_applications": ["anxiety"],
    }

    # Invalid verse
    invalid_verse = {
        "chapter": 99,  # Invalid chapter
        "verse_number": -1,  # Invalid verse number
        # Missing required fields
    }

    print("\n1. Validating COMPLETE verse:")
    report1 = pipeline.validate_only(valid_verse)
    print(f"   Valid: {report1['is_valid']}")
    print(f"   Completeness: {report1['completeness']['completeness_score']:.1f}%")
    print(f"   Missing fields: {report1['completeness']['missing_recommended']}")

    print("\n2. Validating INCOMPLETE verse:")
    report2 = pipeline.validate_only(invalid_verse)
    print(f"   Valid: {report2['is_valid']}")
    print(f"   Errors found: {len(report2['errors'])}")
    for error in report2["errors"][:3]:  # Show first 3 errors
        print(f"     - {error}")


def main():
    """Run all integration examples."""
    try:
        # Main transformation
        transformed = transform_wisdom_database()

        # Save results (optional)
        output_dir = Path(__file__).parent
        output_file = output_dir / "transformed_wisdom.json"
        save_transformed_verses(transformed, output_file)

        # Additional demonstrations
        compare_before_after()
        demonstrate_validation()

        print("\n" + "=" * 80)
        print("Integration Example Completed Successfully!")
        print("=" * 80)

    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
