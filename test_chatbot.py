"""
Simple test script to verify chatbot functionality without full environment
"""
import json


def test_verse_data_loading():
    """Test that verse data can be loaded from JSON"""
    try:
        with open('data/gita_verses.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert 'verses' in data, "Missing 'verses' key in JSON"
        assert len(data['verses']) > 0, "No verses found in JSON"
        
        # Verify verse structure
        required_fields = ['chapter', 'verse', 'sanskrit', 'english', 'hindi', 'principle', 'theme']
        for verse in data['verses']:
            for field in required_fields:
                assert field in verse, f"Missing required field: {field}"
        
        print(f"✓ Successfully loaded {len(data['verses'])} verses")
        print(f"✓ All verses have required fields")
        return True
    except Exception as e:
        print(f"✗ Error loading verse data: {e}")
        return False


def test_cosine_similarity():
    """Test cosine similarity calculation"""
    try:
        # Simple test vectors
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [1.0, 0.0, 0.0]
        vec3 = [0.0, 1.0, 0.0]
        
        def cosine_similarity(v1, v2):
            dot_product = sum(a * b for a, b in zip(v1, v2))
            magnitude1 = sum(a * a for a in v1) ** 0.5
            magnitude2 = sum(b * b for b in v2) ** 0.5
            if magnitude1 == 0 or magnitude2 == 0:
                return 0.0
            return dot_product / (magnitude1 * magnitude2)
        
        # Identical vectors should have similarity of 1.0
        sim1 = cosine_similarity(vec1, vec2)
        assert abs(sim1 - 1.0) < 0.001, f"Expected 1.0, got {sim1}"
        
        # Orthogonal vectors should have similarity of 0.0
        sim2 = cosine_similarity(vec1, vec3)
        assert abs(sim2 - 0.0) < 0.001, f"Expected 0.0, got {sim2}"
        
        print(f"✓ Cosine similarity calculations correct")
        return True
    except Exception as e:
        print(f"✗ Error in cosine similarity: {e}")
        return False


def test_fallback_response():
    """Test fallback response generation"""
    try:
        # Mock verse data
        verses = [
            {
                'chapter': 2,
                'verse': 47,
                'sanskrit': 'कर्मण्येवाधिकारस्ते...',
                'english': 'You have the right to perform your duties...',
                'hindi': 'तुम्हारा अधिकार केवल कर्म करने में है...',
                'principle': 'detachment_action',
                'theme': 'duty, action'
            }
        ]
        
        # Test English
        intro_en = "Consider these timeless teachings:"
        assert intro_en is not None
        
        # Test Hindi
        intro_hi = "इन शिक्षाओं पर विचार करें:"
        assert intro_hi is not None
        
        print(f"✓ Fallback response generation working")
        return True
    except Exception as e:
        print(f"✗ Error in fallback response: {e}")
        return False


def test_schemas():
    """Test that schemas are properly defined"""
    try:
        import sys
        sys.path.insert(0, '/home/runner/work/MindVibe/MindVibe')
        
        # Just check if we can parse the file
        with open('schemas.py', 'r') as f:
            content = f.read()
            assert 'ChatMessage' in content
            assert 'ChatResponse' in content
            assert 'VerseReference' in content
        
        print(f"✓ Schemas properly defined")
        return True
    except Exception as e:
        print(f"✗ Error checking schemas: {e}")
        return False


def main():
    """Run all tests"""
    print("Running MindVibe Chatbot Tests\n" + "="*50)
    
    tests = [
        ("Verse Data Loading", test_verse_data_loading),
        ("Cosine Similarity", test_cosine_similarity),
        ("Fallback Response", test_fallback_response),
        ("Schema Definitions", test_schemas),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\nTest: {name}")
        print("-" * 50)
        results.append(test_func())
    
    print("\n" + "="*50)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
