#!/usr/bin/env python3
"""
Simple verification script to test the wisdom guide implementation.
This script validates that all components can be imported and basic functionality works.
"""

import sys
import os

# Add parent directory to path for imports to ensure compatibility across execution contexts
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

print("=" * 60)
print("Wisdom Guide Implementation Verification")
print("=" * 60)

# Test 1: Import models
print("\n[1/5] Testing model imports...")
try:
    from models import WisdomVerse
    print("✓ WisdomVerse model imported successfully")
except Exception as e:
    print(f"✗ Failed to import WisdomVerse model: {e}")
    sys.exit(1)

# Test 2: Import wisdom knowledge base service
print("\n[2/5] Testing service imports...")
try:
    from services.wisdom_kb import WisdomKnowledgeBase
    print("✓ WisdomKnowledgeBase service imported successfully")
except Exception as e:
    print(f"✗ Failed to import WisdomKnowledgeBase service: {e}")
    sys.exit(1)

# Test 3: Test sanitization function
print("\n[3/5] Testing text sanitization...")
try:
    test_text = "Krishna told Arjuna that the Lord is divine"
    sanitized = WisdomKnowledgeBase.sanitize_text(test_text)
    
    # Check that religious terms were replaced
    if "krishna" in sanitized.lower() or "arjuna" in sanitized.lower() or "lord" in sanitized.lower():
        print(f"✗ Sanitization failed: '{sanitized}'")
        sys.exit(1)
    
    print(f"✓ Text sanitization works correctly")
    print(f"  Original:  {test_text}")
    print(f"  Sanitized: {sanitized}")
except Exception as e:
    print(f"✗ Sanitization test failed: {e}")
    sys.exit(1)

# Test 4: Test text similarity
print("\n[4/5] Testing text similarity...")
try:
    text1 = "I am feeling anxious and stressed"
    text2 = "anxiety management and stress reduction"
    score = WisdomKnowledgeBase.compute_text_similarity(text1, text2)
    
    if score < 0 or score > 1:
        print(f"✗ Similarity score out of range: {score}")
        sys.exit(1)
    
    print(f"✓ Text similarity computation works")
    print(f"  Similarity between texts: {score:.3f}")
except Exception as e:
    print(f"✗ Text similarity test failed: {e}")
    sys.exit(1)

# Test 5: Load and validate verse data
print("\n[5/5] Testing verse data loading...")
try:
    import json
    
    verses_path = os.path.join(
        os.path.dirname(__file__),
        'data',
        'wisdom',
        'verses.json'
    )
    
    if not os.path.exists(verses_path):
        print(f"✗ Verse data file not found: {verses_path}")
        sys.exit(1)
    
    with open(verses_path, 'r', encoding='utf-8') as f:
        verses = json.load(f)
    
    if not isinstance(verses, list) or len(verses) == 0:
        print("✗ Verse data is not a valid list or is empty")
        sys.exit(1)
    
    # Validate structure of first verse
    required_fields = ['verse_id', 'chapter', 'verse_number', 'theme', 
                      'english', 'hindi', 'sanskrit', 'context', 
                      'mental_health_applications']
    
    first_verse = verses[0]
    missing_fields = [field for field in required_fields if field not in first_verse]
    
    if missing_fields:
        print(f"✗ Verse data missing required fields: {missing_fields}")
        sys.exit(1)
    
    print(f"✓ Verse data loaded and validated")
    print(f"  Total verses: {len(verses)}")
    print(f"  Sample verse: {first_verse['verse_id']} - {first_verse['theme']}")
    
except Exception as e:
    print(f"✗ Verse data validation failed: {e}")
    sys.exit(1)

# Test 6: Import routes
print("\n[6/6] Testing route imports...")
try:
    from routes import wisdom_guide
    print("✓ Wisdom guide route imported successfully")
except Exception as e:
    print(f"✗ Failed to import wisdom guide route: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("All verification tests passed! ✓")
print("=" * 60)
print("\nNext steps:")
print("1. Set OPENAI_API_KEY in your .env file for AI responses")
print("2. Run: python seed_wisdom.py (to populate database)")
print("3. Start the API server and test the endpoints")
print("\nAPI Endpoints:")
print("  POST /api/wisdom/query")
print("  GET  /api/wisdom/themes")
print("  GET  /api/wisdom/verses/{verse_id}")
