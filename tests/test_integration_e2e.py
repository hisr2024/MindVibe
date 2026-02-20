"""
Integration Tests for MindVibe Enhancements #3, #4, #5, #6
End-to-End Flow Testing

This test suite validates complete user journeys across multiple features:
- Enhancement #3: Advanced Mood Tracking
- Enhancement #4: Daily Verse Integration
- Enhancement #5: Community Wisdom Circles
- Enhancement #6: Advanced Analytics Dashboard

Test Scenarios:
1. Complete User Journey: Mood → Analytics → Community → Support
2. Crisis Intervention: Crisis post → Detection → Resources
3. Analytics Intelligence: Multi-day mood → Trends → Predictions → Insights
4. Community Engagement: Join → Post → React → Badges
5. Cross-Feature Integration: Data flow across all systems
"""

import sys
import os
from datetime import datetime, timedelta
import asyncio

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import services
from services.anonymization_service import AnonymizationService
from services.moderation_service import ModerationService
from services.analytics_ml_service import AnalyticsMLService
from services.wellness_score_service import WellnessScoreService
from services.insight_generator_service import InsightGeneratorService

# Import models (using inline models if needed)
from datetime import datetime
from typing import List, Optional

# Define minimal models for testing
class MoodDataPoint:
    def __init__(self, date: datetime, score: float, tags: List[str]):
        self.date = date
        self.score = score
        self.tags = tags


class IntegrationTestResults:
    """Track integration test results"""
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_details = []

    def add_result(self, test_name: str, passed: bool, details: str = ""):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASSED"
        else:
            self.failed_tests += 1
            status = "❌ FAILED"

        self.test_details.append(f"{status}: {test_name}")
        if details:
            self.test_details.append(f"   Details: {details}")

    def print_summary(self):
        print("\n" + "="*70)
        print("INTEGRATION TEST RESULTS")
        print("="*70)
        for detail in self.test_details:
            print(detail)
        print("\n" + "="*70)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Pass Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        print("="*70)


results = IntegrationTestResults()


def test_scenario_1_complete_user_journey():
    """
    Scenario 1: Complete User Journey
    User logs mood → Views analytics → Joins community → Posts experience

    Tests integration of:
    - Mood tracking (Enhancement #3)
    - Analytics (Enhancement #6)
    - Community (Enhancement #5)
    """
    print("\n📋 Test Scenario 1: Complete User Journey")
    print("-" * 70)

    try:
        # Step 1: User logs mood data over 14 days
        print("Step 1: User logs mood data over 14 days...")
        mood_data = []
        base_date = datetime.now() - timedelta(days=14)

        for i in range(14):
            date = base_date + timedelta(days=i)
            # Simulate improving mood trend
            score = 3.0 + (i * 0.2) + ((-1)**i * 0.3)  # Trend up with some variation
            mood_data.append(MoodDataPoint(
                date=date,
                score=min(5.0, max(1.0, score)),
                tags=['hopeful', 'progress'] if score > 3.5 else ['struggling']
            ))

        assert len(mood_data) == 14, "Should have 14 days of mood data"
        print(f"   ✓ Created {len(mood_data)} mood entries")

        # Step 2: User views analytics - trend analysis
        print("Step 2: User views analytics dashboard...")
        analytics_service = AnalyticsMLService()

        trend = analytics_service.analyze_mood_trends(mood_data)
        assert hasattr(trend, 'trend_direction'), "Trend should have trend_direction"
        assert hasattr(trend, 'trend_strength'), "Trend should have strength"
        print(f"   ✓ Trend analysis: {trend.trend_direction} (strength: {trend.trend_strength:.2f})")

        # Step 3: User gets mood prediction
        print("Step 3: User views 7-day mood forecast...")
        forecast = analytics_service.predict_mood(mood_data, forecast_days=7)
        assert len(forecast) == 7, "Should predict 7 days"
        print(f"   ✓ Generated {len(forecast)} day forecast")

        # Step 4: User joins a community circle
        print("Step 4: User joins anxiety support circle...")
        anonymization_service = AnonymizationService(secret_key="test_secret_key_12345")

        identity = anonymization_service.generate_anonymous_identity(
            user_id=1,
            circle_id=1
        )
        assert identity.anonymous_id, "Should have anonymous ID"
        assert identity.display_name, "Should have display name"
        print(f"   ✓ Anonymous identity created: {identity.display_name}")

        # Step 5: User posts in community
        print("Step 5: User shares positive progress post...")
        post_content = "I've been tracking my mood and I'm seeing improvement! Feeling hopeful."

        report = asyncio.run(ModerationService().moderate_content(post_content))
        assert report.result.value in ['approved', 'approved_with_warning'], "Positive post should be approved"
        print(f"   ✓ Post moderation: {report.result.value}")
        print(f"   ✓ Compassion score: {report.compassion_score:.2f}")

        results.add_result(
            "Scenario 1: Complete User Journey",
            True,
            "User successfully tracked mood, viewed analytics, joined circle, and posted"
        )

    except Exception as e:
        results.add_result(
            "Scenario 1: Complete User Journey",
            False,
            f"Error: {str(e)}"
        )
        raise


def test_scenario_2_crisis_intervention_flow():
    """
    Scenario 2: Crisis Intervention Flow
    User posts crisis content → System detects → Provides resources

    Tests integration of:
    - Community moderation (Enhancement #5)
    - Crisis detection keywords
    - Resource provision
    """
    print("\n🚨 Test Scenario 2: Crisis Intervention Flow")
    print("-" * 70)

    try:
        # Step 1: User posts crisis content
        print("Step 1: User posts content with crisis indicators...")
        crisis_content = "I want to die and end my life. I can't go on."

        moderation_service = ModerationService()

        # Step 2: System detects crisis
        print("Step 2: System analyzes content for crisis keywords...")
        report = asyncio.run(moderation_service.moderate_content(crisis_content))

        assert report.crisis_detected, "Should detect crisis"
        assert report.result.value == "crisis", "Result should be crisis"
        print(f"   ✓ Crisis detected: {report.crisis_detected}")
        print(f"   ✓ Moderation result: {report.result.value}")

        # Step 3: Verify resources would be provided
        print("Step 3: Verify crisis resources available...")
        # In real implementation, this would call get_crisis_resources()
        # Here we just verify the detection worked
        assert len(report.reasons) > 0, "Should have reasons"
        assert len(report.suggestions) > 0, "Should have suggestions"
        print(f"   ✓ Reason: {report.reasons[0][:50]}...")
        print(f"   ✓ Suggestion: {report.suggestions[0][:50]}...")

        results.add_result(
            "Scenario 2: Crisis Intervention Flow",
            True,
            "System successfully detected crisis and flagged for resources"
        )

    except Exception as e:
        results.add_result(
            "Scenario 2: Crisis Intervention Flow",
            False,
            f"Error: {str(e)}"
        )
        raise


def test_scenario_3_analytics_intelligence_flow():
    """
    Scenario 3: Analytics Intelligence Flow
    Multi-day mood data → Trend analysis → Risk assessment → Personalized insights

    Tests integration of:
    - Analytics ML service (Enhancement #6)
    - Wellness scoring
    - Insight generation
    """
    print("\n📊 Test Scenario 3: Analytics Intelligence Flow")
    print("-" * 70)

    try:
        # Step 1: Generate 30 days of mood data with patterns
        print("Step 1: Generate 30 days of mood data...")
        base_date = datetime.now() - timedelta(days=30)
        mood_data = []

        for i in range(30):
            date = base_date + timedelta(days=i)
            # Simulate weekly pattern with overall improvement
            weekly_pattern = 3.5 + (i / 10)  # Gradual improvement
            weekly_variance = 0.5 if i % 7 < 5 else -0.5  # Weekend effect
            score = weekly_pattern + weekly_variance

            mood_data.append(MoodDataPoint(
                date=date,
                score=min(5.0, max(1.0, score)),
                tags=['stable', 'improving']
            ))

        print(f"   ✓ Generated {len(mood_data)} mood entries")

        # Step 2: Analyze trends
        print("Step 2: Analyze mood trends and patterns...")
        analytics_service = AnalyticsMLService()

        trend = analytics_service.analyze_mood_trends(mood_data)
        assert trend.trend_direction in ['improving', 'stable', 'declining'], "Should have valid direction"
        print(f"   ✓ Overall trend: {trend.trend_direction}")
        print(f"   ✓ 7-day average: {trend.moving_avg_7d:.2f}")
        print(f"   ✓ 30-day average: {trend.moving_avg_30d:.2f}")

        # Step 3: Risk assessment
        print("Step 3: Perform spiritual wellness risk assessment...")
        risk = analytics_service.calculate_risk_score(mood_data)
        assert 'score' in risk, "Risk should have score"
        assert 'level' in risk, "Risk should have level"
        print(f"   ✓ Risk level: {risk['level']}")
        print(f"   ✓ Risk score: {risk['score']:.2f}")

        # Step 4: Detect anomalies
        print("Step 4: Detect mood anomalies...")
        anomalies = trend.anomalies  # Anomalies are part of trend analysis
        print(f"   ✓ Detected {len(anomalies)} anomalies")

        # Step 5: Generate insights
        print("Step 5: Generate personalized insights...")
        mood_data_for_insight = [
            {'at': (base_date + timedelta(days=i)).isoformat(), 'value': 4.0}
            for i in range(30)
        ]
        journal_data = [
            {'created_at': (base_date + timedelta(days=i)).isoformat(), 'entry': 'Feeling positive and making progress'}
            for i in range(0, 30, 3)
        ]
        verse_interactions = [
            {'timestamp': (base_date + timedelta(days=i)).isoformat()}
            for i in range(0, 30, 7)
        ]

        # Get wellness score first
        wellness_service = WellnessScoreService()
        wellness_score_result = wellness_service.calculate_wellness_score(
            mood_data=mood_data_for_insight,
            journal_data=journal_data,
            verse_interactions=verse_interactions,
            kiaan_conversations=[]
        )

        # Prepare trend analysis dict
        trend_analysis_dict = {
            'direction': trend.trend_direction,
            'strength': trend.trend_strength,
            'moving_avg_7d': trend.moving_avg_7d,
            'moving_avg_30d': trend.moving_avg_30d,
            'volatility': trend.volatility
        }

        insight_service = InsightGeneratorService()
        insight = insight_service.generate_weekly_insight(
            mood_data=mood_data_for_insight,
            journal_data=journal_data,
            verse_interactions=verse_interactions,
            wellness_score=wellness_score_result.total_score,
            trend_analysis=trend_analysis_dict
        )

        assert isinstance(insight, str), "Insight should be a string"
        assert len(insight) > 0, "Insight should not be empty"
        print(f"   ✓ Generated insight: {insight[:80]}...")

        results.add_result(
            "Scenario 3: Analytics Intelligence Flow",
            True,
            "Complete analytics pipeline from data to insights working"
        )

    except Exception as e:
        results.add_result(
            "Scenario 3: Analytics Intelligence Flow",
            False,
            f"Error: {str(e)}"
        )
        raise


def test_scenario_4_community_engagement_flow():
    """
    Scenario 4: Community Engagement Flow
    Join circle → Post anonymously → Receive reactions → Earn compassion badge

    Tests integration of:
    - Anonymization (Enhancement #5)
    - Moderation system
    - Community interaction
    """
    print("\n💬 Test Scenario 4: Community Engagement Flow")
    print("-" * 70)

    try:
        # Step 1: Multiple users join the same circle
        print("Step 1: Three users join 'Anxiety Support' circle...")
        anonymization_service = AnonymizationService(secret_key="test_secret_key_12345")

        identities = []
        for user_id in [1, 2, 3]:
            identity = anonymization_service.generate_anonymous_identity(
                user_id=user_id,
                circle_id=1  # Same circle
            )
            identities.append(identity)
            print(f"   ✓ User {user_id}: {identity.display_name}")

        # Verify all identities are unique
        unique_ids = set(i.anonymous_id for i in identities)
        assert len(unique_ids) == 3, "All users should have unique anonymous IDs"

        # Step 2: Users post various content
        print("Step 2: Users share their experiences...")
        moderation_service = ModerationService()

        posts = [
            "I had a panic attack today but I used breathing techniques and it helped.",
            "Thank you all for being here. This community means so much to me.",
            "Struggling with social anxiety. Any tips for managing it?"
        ]

        approved_count = 0
        total_compassion = 0.0

        for i, content in enumerate(posts):
            report = asyncio.run(moderation_service.moderate_content(content))
            if report.result.value in ['approved', 'approved_with_warning']:
                approved_count += 1
                total_compassion += report.compassion_score
                print(f"   ✓ Post {i+1}: {report.result.value} (compassion: {report.compassion_score:.2f})")

        assert approved_count == 3, "All supportive posts should be approved"
        avg_compassion = total_compassion / approved_count
        print(f"   ✓ Average compassion score: {avg_compassion:.2f}")

        # Step 3: Verify high compassion earns badge eligibility
        print("Step 3: Check compassion badge eligibility...")
        high_compassion_threshold = 0.7
        badge_eligible = [score for score in [r.compassion_score for r in [
            asyncio.run(moderation_service.moderate_content(p)) for p in posts
        ]] if score >= high_compassion_threshold]

        print(f"   ✓ {len(badge_eligible)} posts eligible for compassion badge")

        # Step 4: Test anonymization consistency
        print("Step 4: Verify anonymization consistency...")
        # Same user, same circle = same identity
        identity_check = anonymization_service.generate_anonymous_identity(
            user_id=1,
            circle_id=1
        )
        assert identity_check.anonymous_id == identities[0].anonymous_id, \
            "Same user in same circle should get same identity"
        print(f"   ✓ Identity consistency maintained")

        # Step 5: Test cross-circle anonymization
        print("Step 5: Verify per-circle isolation...")
        # Same user, different circle = different identity
        identity_circle2 = anonymization_service.generate_anonymous_identity(
            user_id=1,
            circle_id=2
        )
        assert identity_circle2.anonymous_id != identities[0].anonymous_id, \
            "Same user in different circles should get different identities"
        print(f"   ✓ Cross-circle anonymization working")

        results.add_result(
            "Scenario 4: Community Engagement Flow",
            True,
            "Community features working with proper anonymization and moderation"
        )

    except Exception as e:
        results.add_result(
            "Scenario 4: Community Engagement Flow",
            False,
            f"Error: {str(e)}"
        )
        raise


def test_scenario_5_cross_feature_integration():
    """
    Scenario 5: Cross-Feature Integration
    Test data flow and integration across all enhancements

    Tests integration of:
    - Mood data → Analytics insights
    - Community engagement → Wellness impact
    - Complete ecosystem
    """
    print("\n🔄 Test Scenario 5: Cross-Feature Integration")
    print("-" * 70)

    try:
        # Step 1: User tracks mood consistently
        print("Step 1: User maintains consistent mood tracking...")
        base_date = datetime.now() - timedelta(days=30)
        mood_data = []

        for i in range(30):
            date = base_date + timedelta(days=i)
            score = 3.5 + (i / 20)  # Gradual improvement
            mood_data.append(MoodDataPoint(
                date=date,
                score=min(5.0, score),
                tags=['consistent', 'tracking']
            ))

        print(f"   ✓ 30 days of consistent mood tracking")

        # Step 2: Analytics generates insights
        print("Step 2: Analytics generates insights from mood data...")
        analytics_service = AnalyticsMLService()
        trend = analytics_service.analyze_mood_trends(mood_data)

        assert trend.trend_direction == 'improving', "Trend should show improvement"
        print(f"   ✓ Detected improving trend")

        # Step 3: User engages with community
        print("Step 3: User shares progress in community...")
        post_content = "Tracking my mood daily has been so helpful! I can see I'm making progress."

        moderation_service = ModerationService()
        report = asyncio.run(moderation_service.moderate_content(post_content))

        assert report.result.value in ['approved', 'approved_with_warning'], "Progress post should be approved"
        assert report.compassion_score >= 0.0, "Should have compassion score"
        print(f"   ✓ Community post approved with compassion score: {report.compassion_score:.2f}")

        # Step 4: Calculate wellness score incorporating all data
        print("Step 4: Calculate comprehensive wellness score...")
        wellness_service = WellnessScoreService()

        mood_data_list = [
            {'at': (base_date + timedelta(days=i)).isoformat(), 'value': 3.5 + (i/20)}
            for i in range(30)
        ]
        journal_data_list = [
            {'created_at': (base_date + timedelta(days=i)).isoformat(), 'entry': 'Feeling good'}
            for i in range(0, 30, 3)
        ]
        verse_interactions_list = [
            {'timestamp': (base_date + timedelta(days=i)).isoformat()}
            for i in range(0, 30, 7)
        ]
        kiaan_chats_list = [
            {'created_at': (base_date + timedelta(days=i)).isoformat(), 'message': 'Chat'}
            for i in range(0, 30, 5)
        ]

        wellness_score = wellness_service.calculate_wellness_score(
            mood_data=mood_data_list,
            journal_data=journal_data_list,
            verse_interactions=verse_interactions_list,
            kiaan_conversations=kiaan_chats_list
        )

        assert hasattr(wellness_score, 'total_score'), "Should have total score"
        assert 0 <= wellness_score.total_score <= 100, "Score should be 0-100"
        print(f"   ✓ Wellness score: {wellness_score.total_score:.1f}/100")
        print(f"   ✓ Mood stability component: {wellness_score.mood_stability_score:.1f}")
        print(f"   ✓ Engagement component: {wellness_score.engagement_score:.1f}")

        # Step 5: Generate holistic insight
        print("Step 5: Generate insight based on all data...")

        # Get trend analysis for insight
        analytics_service2 = AnalyticsMLService()
        trend2 = analytics_service2.analyze_mood_trends(mood_data)

        trend_analysis_dict2 = {
            'direction': trend2.trend_direction,
            'strength': trend2.trend_strength,
            'moving_avg_7d': trend2.moving_avg_7d,
            'moving_avg_30d': trend2.moving_avg_30d,
            'volatility': trend2.volatility
        }

        insight_service = InsightGeneratorService()
        insight = insight_service.generate_weekly_insight(
            mood_data=mood_data_list,
            journal_data=journal_data_list,
            verse_interactions=verse_interactions_list,
            wellness_score=wellness_score.total_score,
            trend_analysis=trend_analysis_dict2
        )

        assert isinstance(insight, str), "Should generate insight"
        assert len(insight) > 50, "Insight should be substantial"
        print(f"   ✓ Holistic insight generated")

        results.add_result(
            "Scenario 5: Cross-Feature Integration",
            True,
            "All features working together seamlessly"
        )

    except Exception as e:
        results.add_result(
            "Scenario 5: Cross-Feature Integration",
            False,
            f"Error: {str(e)}"
        )
        raise


def run_all_integration_tests():
    """Run all integration test scenarios"""
    print("\n" + "="*70)
    print("MINDVIBE INTEGRATION TESTS - END-TO-END FLOWS")
    print("Testing Enhancements #3, #4, #5, #6")
    print("="*70)

    # Run all test scenarios
    test_scenario_1_complete_user_journey()
    test_scenario_2_crisis_intervention_flow()
    test_scenario_3_analytics_intelligence_flow()
    test_scenario_4_community_engagement_flow()
    test_scenario_5_cross_feature_integration()

    # Print summary
    results.print_summary()

    # Return success status
    return results.failed_tests == 0


if __name__ == "__main__":
    success = run_all_integration_tests()
    sys.exit(0 if success else 1)
