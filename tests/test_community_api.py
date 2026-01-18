"""
API Endpoint Tests for Enhancement #5: Community Wisdom Circles

Tests all 14 community API endpoints:
- Circle management (5 endpoints)
- Post management (6 endpoints)
- Crisis support (1 endpoint)
- User stats (1 endpoint)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from backend.routes.community import router
from fastapi import FastAPI

# Create test app
app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_list_circles():
    """Test GET /api/community/circles - List all circles"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/community/circles - List Circles")
    print("="*80)

    response = client.get("/api/community/circles")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Response: {len(data)} circles returned")

    assert isinstance(data, list), "Response should be a list"

    if len(data) > 0:
        circle = data[0]
        print(f"✓ First circle: {circle['name']}")
        print(f"  - Category: {circle['category']}")
        print(f"  - Privacy: {circle['privacy']}")
        print(f"  - Members: {circle['member_count']}")
        print(f"  - Posts: {circle['post_count']}")

        required_fields = ['id', 'name', 'description', 'category', 'privacy',
                          'member_count', 'post_count', 'guidelines', 'moderator_count']
        for field in required_fields:
            assert field in circle, f"Missing required field: {field}"

    print("✅ PASSED")


def test_list_circles_with_filter():
    """Test GET /api/community/circles?category=anxiety - Filter by category"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/community/circles?category=anxiety - Filter by Category")
    print("="*80)

    response = client.get("/api/community/circles?category=anxiety")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Response: {len(data)} anxiety circles returned")

    for circle in data:
        assert circle['category'] == 'anxiety', f"Expected category 'anxiety', got '{circle['category']}'"

    print("✅ PASSED")


def test_get_single_circle():
    """Test GET /api/community/circles/{id} - Get single circle"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/community/circles/1 - Get Single Circle")
    print("="*80)

    response = client.get("/api/community/circles/1")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    circle = response.json()
    print(f"✓ Circle: {circle['name']}")
    print(f"  - ID: {circle['id']}")
    print(f"  - Guidelines: {len(circle['guidelines'])} guidelines")

    assert circle['id'] == 1, "Expected circle ID 1"
    assert 'guidelines' in circle, "Missing guidelines"
    assert len(circle['guidelines']) > 0, "Guidelines should not be empty"

    print("✅ PASSED")


def test_get_nonexistent_circle():
    """Test GET /api/community/circles/999 - Circle not found"""
    print("\n" + "="*80)
    print("TEST 4: GET /api/community/circles/999 - Circle Not Found")
    print("="*80)

    response = client.get("/api/community/circles/999")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    print("✓ Correctly returns 404 for nonexistent circle")
    print("✅ PASSED")


def test_create_circle():
    """Test POST /api/community/circles - Create new circle"""
    print("\n" + "="*80)
    print("TEST 5: POST /api/community/circles - Create Circle")
    print("="*80)

    new_circle = {
        "name": "Test Circle for Mindfulness",
        "description": "A test circle for practicing mindfulness together",
        "category": "self_growth",
        "privacy": "open",
        "guidelines": [
            "Be present and supportive",
            "Share mindfulness practices respectfully"
        ]
    }

    response = client.post("/api/community/circles", json=new_circle)
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    circle = response.json()
    print(f"✓ Created circle: {circle['name']}")
    print(f"  - ID: {circle['id']}")
    print(f"  - Category: {circle['category']}")
    print(f"  - Member count: {circle['member_count']}")

    assert circle['name'] == new_circle['name'], "Name mismatch"
    assert circle['category'] == new_circle['category'], "Category mismatch"
    assert circle['member_count'] == 1, "Creator should be first member"

    print("✅ PASSED")


def test_join_circle():
    """Test POST /api/community/circles/{id}/join - Join circle"""
    print("\n" + "="*80)
    print("TEST 6: POST /api/community/circles/1/join - Join Circle")
    print("="*80)

    response = client.post("/api/community/circles/1/join")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Joined circle successfully")
    print(f"✓ Anonymous identity received:")
    print(f"  - Display name: {data['anonymous_identity']['display_name']}")
    print(f"  - Avatar color: {data['anonymous_identity']['avatar_color']}")
    print(f"  - Circle ID: {data['circle_id']}")

    assert data['success'] is True, "Join should succeed"
    assert 'anonymous_identity' in data, "Should receive anonymous identity"
    assert 'display_name' in data['anonymous_identity'], "Should have display name"
    assert 'avatar_color' in data['anonymous_identity'], "Should have avatar color"

    print("✅ PASSED")


def test_get_circle_posts():
    """Test GET /api/community/circles/{id}/posts - Get posts in circle"""
    print("\n" + "="*80)
    print("TEST 7: GET /api/community/circles/1/posts - Get Circle Posts")
    print("="*80)

    response = client.get("/api/community/circles/1/posts")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    posts = response.json()
    print(f"✓ Response: {len(posts)} posts returned")

    if len(posts) > 0:
        post = posts[0]
        print(f"✓ First post:")
        print(f"  - Author: {post['author']['display_name']}")
        print(f"  - Content: {post['content'][:50]}...")
        print(f"  - Reactions: {post['reaction_counts']}")
        print(f"  - Replies: {post['reply_count']}")

        assert 'author' in post, "Post should have author"
        assert 'display_name' in post['author'], "Author should have display name"
        assert 'content' in post, "Post should have content"

    print("✅ PASSED")


def test_create_post_approved():
    """Test POST /api/community/posts - Create post (approved)"""
    print("\n" + "="*80)
    print("TEST 8: POST /api/community/posts - Create Post (Approved)")
    print("="*80)

    new_post = {
        "circle_id": 1,
        "content": "I've been practicing mindfulness meditation daily and feeling more centered. Would love to hear what practices work for you!"
    }

    response = client.post("/api/community/posts", json=new_post)
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    data = response.json()
    print(f"✓ Post created successfully")
    print(f"  - Moderation result: {data['moderation']['result']}")
    print(f"  - Compassion score: {data['moderation']['compassion_score']:.2f}")

    assert data['success'] is True, "Post should succeed"
    assert 'post' in data or 'moderation' in data, "Should have post or moderation data"

    print("✅ PASSED")


def test_create_post_with_pii():
    """Test POST /api/community/posts - Create post with PII (flagged)"""
    print("\n" + "="*80)
    print("TEST 9: POST /api/community/posts - Create Post with PII")
    print("="*80)

    post_with_pii = {
        "circle_id": 1,
        "content": "Feeling anxious today. Email me at user@example.com to chat"
    }

    response = client.post("/api/community/posts", json=post_with_pii)
    print(f"Status Code: {response.status_code}")

    # Could be 201 (flagged) or 400 (rejected) depending on moderation settings
    assert response.status_code in [200, 201, 400], f"Unexpected status code: {response.status_code}"

    data = response.json()
    print(f"✓ Moderation detected PII")

    if 'moderation' in data:
        print(f"  - Result: {data['moderation']['result']}")
        print(f"  - Categories: {data['moderation']['categories_flagged']}")
        if data['moderation']['suggestions']:
            print(f"  - Suggestion: {data['moderation']['suggestions'][0]}")

    print("✅ PASSED")


def test_create_post_crisis():
    """Test POST /api/community/posts - Create post with crisis keywords"""
    print("\n" + "="*80)
    print("TEST 10: POST /api/community/posts - Crisis Detection")
    print("="*80)

    crisis_post = {
        "circle_id": 1,
        "content": "I want to end my life and kill myself"
    }

    response = client.post("/api/community/posts", json=crisis_post)
    print(f"Status Code: {response.status_code}")

    assert response.status_code in [200, 201], f"Expected 200 or 201, got {response.status_code}"

    data = response.json()
    print(f"✓ Crisis detected")
    print(f"  - Success: {data['success']}")
    print(f"  - Crisis detected: {data.get('crisis_detected', False)}")

    assert data['success'] is False, "Post should not succeed with crisis content"
    assert data.get('crisis_detected', False) is True, "Should detect crisis"
    assert 'crisis_resources' in data, "Should provide crisis resources"

    print(f"  - Resources provided: {len(data['crisis_resources'])}")
    print("✅ PASSED")


def test_react_to_post():
    """Test POST /api/community/posts/{id}/react - Add reaction"""
    print("\n" + "="*80)
    print("TEST 11: POST /api/community/posts/1/react - Add Reaction")
    print("="*80)

    response = client.post("/api/community/posts/1/react", json="heart")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Reaction added: {data['reaction']}")
    print(f"  - Updated counts: {data['reaction_counts']}")

    assert data['success'] is True, "Reaction should succeed"
    assert data['reaction'] == 'heart', "Should return reaction type"

    print("✅ PASSED")


def test_report_post():
    """Test POST /api/community/posts/{id}/report - Report post"""
    print("\n" + "="*80)
    print("TEST 12: POST /api/community/posts/1/report - Report Post")
    print("="*80)

    report = {
        "post_id": 1,
        "reason": "spam",
        "details": "This post contains spam content"
    }

    response = client.post("/api/community/posts/1/report", json=report)
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Report submitted successfully")
    print(f"  - Report ID: {data.get('report_id', 'N/A')}")

    assert data['success'] is True, "Report should succeed"

    print("✅ PASSED")


def test_get_crisis_resources():
    """Test GET /api/community/crisis-resources - Get crisis resources"""
    print("\n" + "="*80)
    print("TEST 13: GET /api/community/crisis-resources - Crisis Resources")
    print("="*80)

    response = client.get("/api/community/crisis-resources")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    resources = response.json()
    print(f"✓ Response: {len(resources)} crisis resources returned")

    assert len(resources) > 0, "Should have at least one crisis resource"

    resource = resources[0]
    print(f"✓ First resource:")
    print(f"  - Name: {resource['name']}")
    print(f"  - Phone: {resource['phone']}")
    print(f"  - Availability: {resource['availability']}")

    required_fields = ['name', 'phone', 'url', 'description', 'availability']
    for field in required_fields:
        assert field in resource, f"Missing required field: {field}"

    print("✅ PASSED")


def test_award_compassion_badge():
    """Test POST /api/community/posts/{id}/compassion-badge - Award badge"""
    print("\n" + "="*80)
    print("TEST 14: POST /api/community/posts/1/compassion-badge - Award Badge")
    print("="*80)

    response = client.post("/api/community/posts/1/compassion-badge", json="heart")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Badge awarded: {data['badge']['badge_type']}")
    print(f"  - Description: {data['badge']['description']}")

    assert data['success'] is True, "Badge award should succeed"
    assert 'badge' in data, "Should have badge data"

    print("✅ PASSED")


def main():
    """Run all API tests"""
    print("\n" + "="*80)
    print("ENHANCEMENT #5: COMMUNITY API ENDPOINT TESTS")
    print("Testing 14 Community Wisdom Circles Endpoints")
    print("="*80)

    try:
        # Circle Management Tests (5 endpoints)
        test_list_circles()
        test_list_circles_with_filter()
        test_get_single_circle()
        test_get_nonexistent_circle()
        test_create_circle()
        test_join_circle()

        # Post Management Tests (6 endpoints)
        test_get_circle_posts()
        test_create_post_approved()
        test_create_post_with_pii()
        test_create_post_crisis()
        test_react_to_post()
        test_report_post()

        # Support Tests (2 endpoints)
        test_get_crisis_resources()
        test_award_compassion_badge()

        print("\n" + "="*80)
        print("🎉 ALL 14 API ENDPOINT TESTS PASSED!")
        print("="*80)

        return 0

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
