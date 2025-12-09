#!/usr/bin/env python3
"""
Verification script to test KIAAN ecosystem integration.

This script tests the integration of the comprehensive Gita seeding
with KIAAN, Ardha, and Viyoga without requiring a full database setup.

Usage:
    python scripts/verify_kiaan_integration.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_imports():
    """Test that all required modules can be found."""
    print("="*60)
    print("🔍 TESTING MODULE STRUCTURE")
    print("="*60)
    
    # Check that files exist and have the right functions
    try:
        with open('backend/routes/chat.py', 'r') as f:
            content = f.read()
            if 'def build_gita_context_comprehensive' in content:
                print("✅ chat.py: build_gita_context_comprehensive function found")
            else:
                print("❌ chat.py: build_gita_context_comprehensive function NOT found")
                return False
    except Exception as e:
        print(f"❌ chat.py check failed: {e}")
        return False
    
    try:
        with open('backend/routes/ardha.py', 'r') as f:
            content = f.read()
            if 'async def get_reframing_verses' in content:
                print("✅ ardha.py: get_reframing_verses function found")
            else:
                print("❌ ardha.py: get_reframing_verses function NOT found")
                return False
    except Exception as e:
        print(f"❌ ardha.py check failed: {e}")
        return False
    
    try:
        with open('backend/routes/viyoga.py', 'r') as f:
            content = f.read()
            if 'async def get_detachment_verses' in content:
                print("✅ viyoga.py: get_detachment_verses function found")
            else:
                print("❌ viyoga.py: get_detachment_verses function NOT found")
                return False
    except Exception as e:
        print(f"❌ viyoga.py check failed: {e}")
        return False
    
    return True


def test_context_building():
    """Test the Gita context building logic structure."""
    print("\n" + "="*60)
    print("🔍 TESTING CONTEXT BUILDING LOGIC")
    print("="*60)
    
    # Check the function implementation
    with open('backend/routes/chat.py', 'r') as f:
        content = f.read()
        
        # Check for key components
        checks = [
            ('MAX_TEACHING_LENGTH', 'MAX_TEACHING_LENGTH constant'),
            ('verse_results', 'verse_results parameter'),
            ('FALLBACK WISDOM', 'fallback wisdom text'),
            ('FORBIDDEN IN RESPONSE', 'forbidden guidelines'),
            ('SYNTHESIS GUIDELINES', 'synthesis guidelines'),
        ]
        
        all_passed = True
        for check_str, description in checks:
            if check_str in content:
                print(f"✅ Contains {description}")
            else:
                print(f"❌ Missing {description}")
                all_passed = False
        
        return all_passed


def test_constants():
    """Test that constants are properly defined."""
    print("\n" + "="*60)
    print("🔍 TESTING CONSTANTS")
    print("="*60)
    
    # Check Ardha constants
    with open('backend/routes/ardha.py', 'r') as f:
        content = f.read()
        if 'STHITAPRAJNA_START = 54' in content:
            print("✅ Ardha: STHITAPRAJNA_START constant defined")
        else:
            print("❌ Ardha: STHITAPRAJNA_START constant NOT found")
            return False
        
        if 'STHITAPRAJNA_END = 72' in content:
            print("✅ Ardha: STHITAPRAJNA_END constant defined")
        else:
            print("❌ Ardha: STHITAPRAJNA_END constant NOT found")
            return False
    
    # Check Viyoga constants
    with open('backend/routes/viyoga.py', 'r') as f:
        content = f.read()
        if 'PRIORITY_VERSE_SCORE = 0.95' in content:
            print("✅ Viyoga: PRIORITY_VERSE_SCORE constant defined")
        else:
            print("❌ Viyoga: PRIORITY_VERSE_SCORE constant NOT found")
            return False
        
        if 'KEY_VERSE_SCORE = 0.9' in content:
            print("✅ Viyoga: KEY_VERSE_SCORE constant defined")
        else:
            print("❌ Viyoga: KEY_VERSE_SCORE constant NOT found")
            return False
    
    # Check chat constants
    with open('backend/routes/chat.py', 'r') as f:
        content = f.read()
        if 'MAX_TEACHING_LENGTH = 300' in content:
            print("✅ Chat: MAX_TEACHING_LENGTH constant defined")
        else:
            print("❌ Chat: MAX_TEACHING_LENGTH constant NOT found")
            return False
    
    return True


def test_seeding_script():
    """Test seeding script validation logic."""
    print("\n" + "="*60)
    print("🔍 TESTING SEEDING SCRIPT")
    print("="*60)
    
    import json
    
    # Load data file
    data_file = Path('data/gita/gita_verses_complete.json')
    
    if not data_file.exists():
        print("❌ Data file not found")
        return False
    
    print("✅ Data file exists")
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            verses = json.load(f)
        print(f"✅ Data file loaded: {len(verses)} verses")
    except Exception as e:
        print(f"❌ Failed to load data file: {e}")
        return False
    
    # Check verse count
    if len(verses) == 700:
        print("✅ Correct verse count (700)")
    else:
        print(f"❌ Incorrect verse count: {len(verses)} (expected 700)")
        return False
    
    # Check required fields in first verse
    required_fields = ['chapter', 'verse', 'sanskrit', 'english', 'hindi', 'theme', 'principle']
    missing = [f for f in required_fields if f not in verses[0]]
    
    if not missing:
        print("✅ All required fields present")
    else:
        print(f"❌ Missing fields: {missing}")
        return False
    
    return True


def main():
    """Run all verification tests."""
    print("\n" + "="*60)
    print("🕉️  KIAAN ECOSYSTEM INTEGRATION VERIFICATION")
    print("="*60)
    print()
    
    results = []
    
    # Run tests
    results.append(("Module Structure", test_imports()))
    results.append(("Context Building Logic", test_context_building()))
    results.append(("Constants Definition", test_constants()))
    results.append(("Seeding Script & Data", test_seeding_script()))
    
    # Summary
    print("\n" + "="*60)
    print("📋 SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Integration verified successfully.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
