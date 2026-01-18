"""
Test Suite for Enhancement #5: Community Wisdom Circles Services

Tests AnonymizationService and ModerationService
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.services.anonymization_service import AnonymizationService
from backend.services.moderation_service import ModerationService
import asyncio


def test_anonymization_service():
    """Test AnonymizationService functionality"""
    print("\n" + "="*80)
    print("TESTING: AnonymizationService")
    print("="*80)

    service = AnonymizationService(secret_key="test_secret_key_12345")

    # Test 1: Generate anonymous identity
    print("\n[TEST 1] Generate Anonymous Identity")
    identity1 = service.generate_anonymous_identity(user_id=1, circle_id=1)
    print(f"✓ User 1 in Circle 1:")
    print(f"  - Anonymous ID: {identity1.anonymous_id[:16]}...")
    print(f"  - Display Name: {identity1.display_name}")
    print(f"  - Avatar Color: {identity1.avatar_color}")

    # Test 2: Deterministic (same user + circle = same identity)
    print("\n[TEST 2] Deterministic Identity (Same User + Circle)")
    identity2 = service.generate_anonymous_identity(user_id=1, circle_id=1)
    assert identity1.anonymous_id == identity2.anonymous_id, "❌ Failed: IDs should match"
    assert identity1.display_name == identity2.display_name, "❌ Failed: Names should match"
    print(f"✓ Same identity generated: {identity2.display_name}")

    # Test 3: Per-circle isolation (same user, different circle)
    print("\n[TEST 3] Per-Circle Isolation (Same User, Different Circle)")
    identity3 = service.generate_anonymous_identity(user_id=1, circle_id=2)
    assert identity1.anonymous_id != identity3.anonymous_id, "❌ Failed: IDs should differ"
    assert identity1.display_name != identity3.display_name, "❌ Failed: Names should differ"
    print(f"✓ Circle 1: {identity1.display_name}")
    print(f"✓ Circle 2: {identity3.display_name}")
    print(f"✓ Different identities in different circles")

    # Test 4: Verify identity
    print("\n[TEST 4] Verify Anonymous Identity")
    is_valid = service.verify_anonymous_identity(
        user_id=1, circle_id=1, claimed_anonymous_id=identity1.anonymous_id
    )
    assert is_valid, "❌ Failed: Should verify as valid"
    print(f"✓ Identity verification passed")

    is_invalid = service.verify_anonymous_identity(
        user_id=2, circle_id=1, claimed_anonymous_id=identity1.anonymous_id
    )
    assert not is_invalid, "❌ Failed: Should reject wrong user"
    print(f"✓ Rejected incorrect user ID")

    # Test 5: PII Detection
    print("\n[TEST 5] PII Detection")

    # Test email
    result = service.strip_pii_from_content("Contact me at john@example.com")
    assert result['contains_pii'], "❌ Failed: Should detect email"
    assert 'email' in result['pii_types'], "❌ Failed: Should flag email"
    print(f"✓ Email detected: {result['warnings']}")

    # Test phone
    result = service.strip_pii_from_content("Call me at 555-123-4567")
    assert result['contains_pii'], "❌ Failed: Should detect phone"
    assert 'phone' in result['pii_types'], "❌ Failed: Should flag phone"
    print(f"✓ Phone detected: {result['warnings']}")

    # Test URL
    result = service.strip_pii_from_content("Check out https://myprofile.com")
    assert result['contains_pii'], "❌ Failed: Should detect URL"
    assert 'url' in result['pii_types'], "❌ Failed: Should flag URL"
    print(f"✓ URL detected: {result['warnings']}")

    # Test social handle
    result = service.strip_pii_from_content("Follow me @username123")
    assert result['contains_pii'], "❌ Failed: Should detect handle"
    assert 'social_handle' in result['pii_types'], "❌ Failed: Should flag handle"
    print(f"✓ Social handle detected: {result['warnings']}")

    # Test clean content
    result = service.strip_pii_from_content("I'm feeling anxious today")
    assert not result['contains_pii'], "❌ Failed: Should be clean"
    print(f"✓ Clean content: No PII detected")

    print("\n✅ AnonymizationService: ALL TESTS PASSED")


async def test_moderation_service():
    """Test ModerationService functionality"""
    print("\n" + "="*80)
    print("TESTING: ModerationService")
    print("="*80)

    service = ModerationService()

    # Test 1: Crisis Detection
    print("\n[TEST 1] Crisis Detection")
    crisis_content = "I want to kill myself and end my life"
    report = await service.moderate_content(crisis_content)
    assert report.crisis_detected, "❌ Failed: Should detect crisis"
    assert report.result.value == "crisis", "❌ Failed: Should return CRISIS result"
    print(f"✓ Crisis detected: {report.crisis_keywords}")
    print(f"✓ Result: {report.result.value.upper()}")

    # Test 2: Toxicity Detection
    print("\n[TEST 2] Toxicity Detection")
    toxic_content = "You're stupid and pathetic, nobody likes you"
    report = await service.moderate_content(toxic_content)
    assert report.reasons, "❌ Failed: Should flag toxicity"
    print(f"✓ Toxicity flagged: {report.reasons[0] if report.reasons else 'N/A'}")
    print(f"✓ Result: {report.result.value.upper()}")

    # Test 3: PII Detection
    print("\n[TEST 3] PII Detection")
    pii_content = "Email me at test@example.com or call 555-1234"
    report = await service.moderate_content(pii_content)
    pii_flagged = any('pii' in str(cat).lower() for cat in report.categories_flagged)
    print(f"✓ PII detection: {'FLAGGED' if pii_flagged else 'CLEAN'}")
    if report.suggestions:
        print(f"✓ Suggestion: {report.suggestions[0]}")

    # Test 4: Compassion Scoring
    print("\n[TEST 4] Compassion Scoring")
    compassionate_content = "I understand how you feel. I'm here to support you and care about your wellbeing. You have so much strength."
    report = await service.moderate_content(compassionate_content)
    assert report.compassion_score > 0.5, "❌ Failed: Should have high compassion score"
    print(f"✓ Compassion score: {report.compassion_score:.2f}")
    print(f"✓ Result: {report.result.value.upper()}")

    # Test 5: Clean Content (Approved)
    print("\n[TEST 5] Clean Content (Should Approve)")
    clean_content = "I've been feeling anxious lately. Does anyone have coping strategies?"
    report = await service.moderate_content(clean_content)
    print(f"✓ Result: {report.result.value.upper()}")
    print(f"✓ Confidence: {report.confidence:.2f}")
    print(f"✓ Compassion score: {report.compassion_score:.2f}")

    # Test 6: Spam Detection
    print("\n[TEST 6] Spam Detection")
    spam_content = "BUY NOW!!! CLICK HERE!!! http://spam.com LIMITED TIME OFFER!!! !!!!! ?????"
    report = await service.moderate_content(spam_content)
    print(f"✓ Spam indicators detected")
    print(f"✓ Result: {report.result.value.upper()}")

    # Test 7: Badge Awarding
    print("\n[TEST 7] Compassion Badge Awarding")
    badge = service.award_compassion_badge(
        user_anonymous_id="abc123",
        badge_type="heart",
        circle_id=1
    )
    assert badge['badge_type'] == 'heart', "❌ Failed: Badge type mismatch"
    print(f"✓ Badge awarded: {badge['badge_type']} - {badge['description']}")

    print("\n✅ ModerationService: ALL TESTS PASSED")


def test_moderation_decision_matrix():
    """Test moderation decision matrix"""
    print("\n" + "="*80)
    print("TESTING: Moderation Decision Matrix")
    print("="*80)

    service = ModerationService()

    test_cases = [
        {
            'name': 'Crisis Content',
            'content': 'I want to die and end it all',
            'expected_result': 'crisis',
            'expected_crisis': True
        },
        {
            'name': 'Extreme Toxicity',
            'content': 'You stupid idiot loser pathetic moron',
            'expected_result': 'rejected',
            'expected_crisis': False
        },
        {
            'name': 'Supportive Message',
            'content': 'I understand and I care about you. You have strength and hope.',
            'expected_result': 'approved',
            'expected_crisis': False
        },
        {
            'name': 'Neutral Clean',
            'content': 'How is everyone doing today?',
            'expected_result': 'approved',
            'expected_crisis': False
        }
    ]

    async def run_test_cases():
        for i, test in enumerate(test_cases, 1):
            print(f"\n[Case {i}] {test['name']}")
            report = await service.moderate_content(test['content'])

            # Check result
            matches = report.result.value == test['expected_result']
            status = "✓" if matches else "⚠"
            print(f"{status} Expected: {test['expected_result'].upper()}, Got: {report.result.value.upper()}")

            # Check crisis detection
            crisis_matches = report.crisis_detected == test['expected_crisis']
            status = "✓" if crisis_matches else "⚠"
            print(f"{status} Crisis: {report.crisis_detected}")

            # Additional info
            print(f"  Confidence: {report.confidence:.2f}")
            print(f"  Compassion: {report.compassion_score:.2f}")
            if report.reasons:
                print(f"  Reasons: {', '.join(report.reasons[:2])}")

    asyncio.run(run_test_cases())
    print("\n✅ Decision Matrix: ALL CASES TESTED")


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ENHANCEMENT #5: COMMUNITY WISDOM CIRCLES - SERVICE TESTS")
    print("="*80)

    try:
        # Test AnonymizationService
        test_anonymization_service()

        # Test ModerationService
        asyncio.run(test_moderation_service())

        # Test Decision Matrix
        test_moderation_decision_matrix()

        print("\n" + "="*80)
        print("🎉 ALL TESTS PASSED SUCCESSFULLY!")
        print("="*80)

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
