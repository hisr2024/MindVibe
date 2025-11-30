#!/usr/bin/env python3
"""
Example usage of the Context Transformation Pipeline.

This script demonstrates how to use the pipeline to transform
Bhagavad Gita verses from raw data to structured, searchable content.
"""

import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.pipeline import ContextTransformationPipeline


def example_single_verse():
    """Example: Transform a single verse."""
    print("=" * 80)
    print("Example 1: Transforming a Single Verse")
    print("=" * 80)

    # Create pipeline instance
    pipeline = ContextTransformationPipeline.create_full_pipeline()

    # Raw verse data
    raw_verse = {
        "chapter": 2,
        "verse_number": 47,
        "theme": "action_without_attachment",
        "english": "You have the right to perform your duties, but you are not entitled to the fruits of your actions.",
        "hindi": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।",
        "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥",
        "context": "Lord Krishna teaches Arjuna about performing duty without attachment.",
        "mental_health_applications": ["anxiety_management", "stress_reduction"],
    }

    # Transform the verse
    transformed = pipeline.transform(raw_verse)

    # Display results
    print("\n--- Original Data ---")
    print(f"Context: {raw_verse['context']}")

    print("\n--- Transformed Data ---")
    print(f"Verse ID: {transformed['verse_id']}")
    print(f"Context (sanitized): {transformed['context']}")
    print(f"Principles: {', '.join(transformed['principles'])}")
    print(f"Metadata Score: {transformed['metadata_score']}")
    print(f"Chapter Theme: {transformed['chapter_theme']}")

    return transformed


def example_batch_processing():
    """Example: Transform multiple verses in batch."""
    print("\n" + "=" * 80)
    print("Example 2: Batch Processing Multiple Verses")
    print("=" * 80)

    # Create pipeline
    pipeline = ContextTransformationPipeline.create_full_pipeline()

    # Multiple verses
    verses = [
        {
            "chapter": 6,
            "verse_number": 5,
            "theme": "self_empowerment",
            "english": "Elevate yourself through the power of your mind.",
            "hindi": "अपने मन की शक्ति से अपना उद्धार करो।",
            "sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्॥",
            "context": "About self-mastery and personal growth.",
            "mental_health_applications": ["self_empowerment", "personal_growth"],
        },
        {
            "chapter": 2,
            "verse_number": 56,
            "theme": "equanimity",
            "english": "One whose mind remains undisturbed amidst misery.",
            "hindi": "जो दुःख में भी विचलित नहीं होता।",
            "sanskrit": "दुःखेष्वनुद्विग्नमनाः॥",
            "context": "About emotional stability and resilience.",
            "mental_health_applications": ["emotional_regulation", "resilience"],
        },
    ]

    # Transform batch
    transformed_verses = pipeline.transform_batch(verses)

    # Display summary
    print(f"\nProcessed {len(transformed_verses)} verses")
    for verse in transformed_verses:
        print(f"\n- Verse {verse['verse_id']}")
        print(f"  Theme: {verse['theme']}")
        print(f"  Principles: {', '.join(verse['principles'])}")
        print(
            f"  Applications: {len(verse['mental_health_applications']['applications'])}"
        )

    # Show statistics
    stats = pipeline.get_statistics()
    print("\n--- Pipeline Statistics ---")
    for key, value in stats.items():
        print(f"{key}: {value}")

    return transformed_verses


def example_validation_only():
    """Example: Validate verse data without transformation."""
    print("\n" + "=" * 80)
    print("Example 3: Validation Only")
    print("=" * 80)

    pipeline = ContextTransformationPipeline()

    # Complete verse
    complete_verse = {
        "chapter": 1,
        "verse_number": 1,
        "theme": "inner_conflict",
        "english": "Dhritarashtra said: What did my people do?",
        "hindi": "धृतराष्ट्र ने कहा।",
        "sanskrit": "धृतराष्ट्र उवाच॥",
        "context": "The beginning of the dialogue.",
        "mental_health_applications": ["anxiety"],
    }

    # Incomplete verse
    incomplete_verse = {
        "chapter": 1,
        "verse_number": 2,
        "english": "Some text here",
        # Missing theme and other fields
    }

    # Validate complete verse
    report1 = pipeline.validate_only(complete_verse)
    print("\n--- Complete Verse Validation ---")
    print(f"Valid: {report1['is_valid']}")
    print(f"Completeness: {report1['completeness']['completeness_score']}%")
    print(f"Missing recommended: {report1['completeness']['missing_recommended']}")

    # Validate incomplete verse
    report2 = pipeline.validate_only(incomplete_verse)
    print("\n--- Incomplete Verse Validation ---")
    print(f"Valid: {report2['is_valid']}")
    print(f"Errors: {report2['errors']}")
    print(f"Completeness: {report2['completeness']['completeness_score']}%")


def example_custom_pipeline():
    """Example: Create a custom pipeline configuration."""
    print("\n" + "=" * 80)
    print("Example 4: Custom Pipeline Configuration")
    print("=" * 80)

    # Create pipeline with sanitization but no enrichment
    pipeline = ContextTransformationPipeline(
        enable_validation=True,
        enable_sanitization=True,
        enable_enrichment=False,  # Skip enrichment
        strict_mode=False,
    )

    verse = {
        "chapter": 3,
        "verse_number": 1,
        "theme": "action",
        "english": "Arjuna said: If you consider knowledge superior to action.",
        "hindi": "अर्जुन ने कहा।",
        "sanskrit": "अर्जुन उवाच॥",
        "context": "Arjuna questions Krishna about knowledge and action.",
        "mental_health_applications": ["confusion"],
    }

    transformed = pipeline.transform(verse)

    print("\n--- Configuration ---")
    config = pipeline.export_configuration()
    for key, value in config.items():
        print(f"{key}: {value}")

    print("\n--- Result ---")
    print(f"Has principles field: {'principles' in transformed}")
    print(f"Has metadata_score: {'metadata_score' in transformed}")
    print(f"Context (sanitized): {transformed['context']}")


def example_from_json_file():
    """Example: Process verses from JSON file."""
    print("\n" + "=" * 80)
    print("Example 5: Processing from JSON File")
    print("=" * 80)

    # Get the path to the example input file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(current_dir, "raw_input.json")

    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
        return

    # Load verses from JSON
    with open(input_file, encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data['verses'])} verses from {input_file}")

    # Create pipeline and transform
    pipeline = ContextTransformationPipeline.create_full_pipeline()
    transformed_verses = pipeline.transform_batch(data["verses"])

    # Save to output file
    output_file = os.path.join(current_dir, "example_output.json")
    output_data = {
        "description": "Transformed verses",
        "pipeline_version": "1.0.0",
        "verses": transformed_verses,
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(transformed_verses)} transformed verses to {output_file}")

    # Show first verse summary
    if transformed_verses:
        first = transformed_verses[0]
        print("\n--- First Verse Summary ---")
        print(f"Verse ID: {first['verse_id']}")
        print(f"Theme: {first['theme']}")
        print(f"Principles: {', '.join(first['principles'])}")
        print(f"Metadata Score: {first['metadata_score']}")


def main():
    """Run all examples."""
    print("\nContext Transformation Pipeline Examples\n")

    try:
        example_single_verse()
        example_batch_processing()
        example_validation_only()
        example_custom_pipeline()
        example_from_json_file()

        print("\n" + "=" * 80)
        print("All examples completed successfully!")
        print("=" * 80)

    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
