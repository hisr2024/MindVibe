"""
Test Suite for Enhancement #6: Advanced Analytics Services

Tests AnalyticsMLService, WellnessScoreService, and InsightGeneratorService
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.services.analytics_ml_service import AnalyticsMLService, MoodDataPoint
from backend.services.wellness_score_service import WellnessScoreService
from backend.services.insight_generator_service import InsightGeneratorService
from datetime import datetime, timedelta


def test_analytics_ml_service():
    """Test AnalyticsMLService functionality"""
    print("\n" + "="*80)
    print("TESTING: AnalyticsMLService")
    print("="*80)

    service = AnalyticsMLService()

    # Generate sample mood data (30 days)
    print("\n[SETUP] Generating sample mood data (30 days)")
    mood_data = []
    base_date = datetime.now() - timedelta(days=30)

    for i in range(30):
        date = base_date + timedelta(days=i)
        # Simulate mood pattern (improving over time with some volatility)
        base_mood = 5.0 + (i * 0.1)  # Gradual improvement
        volatility = (-1)**i * 0.5  # Alternating fluctuation
        score = max(1, min(10, base_mood + volatility))

        mood_data.append(MoodDataPoint(
            date=date,  # Pass datetime object, not string
            score=score,
            tags=['anxiety', 'stress'] if i % 3 == 0 else ['calm', 'peaceful']
        ))

    print(f"✓ Generated {len(mood_data)} mood entries")
    print(f"  Date range: {mood_data[0].date} to {mood_data[-1].date}")
    print(f"  Score range: {min(m.score for m in mood_data):.1f} to {max(m.score for m in mood_data):.1f}")

    # Test 1: Trend Analysis
    print("\n[TEST 1] Mood Trend Analysis")
    trend = service.analyze_mood_trends(mood_data, lookback_days=30)
    print(f"✓ 7-day moving average: {trend.moving_avg_7d:.2f}")
    print(f"✓ 30-day moving average: {trend.moving_avg_30d:.2f}")
    print(f"✓ Trend direction: {trend.trend_direction.upper()}")
    print(f"✓ Trend strength: {trend.trend_strength:.2f}")
    print(f"✓ Volatility: {trend.volatility:.2f}")
    print(f"✓ Anomalies detected: {len(trend.anomalies)}")

    # Test 2: Mood Prediction
    print("\n[TEST 2] Mood Prediction (7-day forecast)")
    predictions = service.predict_mood(mood_data, forecast_days=7)
    assert len(predictions) == 7, "❌ Failed: Should predict 7 days"
    print(f"✓ Generated {len(predictions)} predictions")

    for i, pred in enumerate(predictions[:3], 1):  # Show first 3
        print(f"  Day {i}: {pred.predicted_score:.1f} "
              f"(confidence: {pred.confidence_low:.1f}-{pred.confidence_high:.1f}, "
              f"{pred.confidence_level*100:.0f}%)")

    # Test 3: Risk Assessment
    print("\n[TEST 3] Risk Assessment")
    risk = service.calculate_risk_score(mood_data)
    print(f"✓ Risk score: {risk['score']:.1f}/100 (lower is better)")
    print(f"✓ Risk level: {risk['level'].upper()}")
    print(f"✓ Description: {risk['description']}")
    print(f"✓ Factors:")
    print(f"  - Mood average: {risk['factors']['mood_average']['value']:.1f} "
          f"(risk: {risk['factors']['mood_average']['risk']:.1f})")
    print(f"  - Trend: {risk['factors']['trend']['direction']} "
          f"(risk: {risk['factors']['trend']['risk']:.1f})")
    print(f"  - Volatility: {risk['factors']['volatility']['value']:.2f} "
          f"(risk: {risk['factors']['volatility']['risk']:.1f})")

    # Test 4: Pattern Detection
    print("\n[TEST 4] Pattern Detection")
    patterns = service.detect_patterns(mood_data)
    print(f"✓ Weekly patterns detected:")
    for day, data in list(patterns['weekly'].items())[:3]:
        print(f"  {day}: {data['average']:.1f} avg ({data['count']} entries)")

    print(f"✓ Tag correlations:")
    for tag in patterns['tag_correlations'][:3]:
        print(f"  {tag['tag']}: {tag['average_mood']:.1f} avg "
              f"({tag['count']} times, {tag['impact']})")

    print("\n✅ AnalyticsMLService: ALL TESTS PASSED")


def test_wellness_score_service():
    """Test WellnessScoreService functionality"""
    print("\n" + "="*80)
    print("TESTING: WellnessScoreService")
    print("="*80)

    service = WellnessScoreService()

    # Generate sample data
    print("\n[SETUP] Generating sample wellness data")
    mood_data = []
    for i in range(30):
        mood_data.append({
            'at': (datetime.now() - timedelta(days=30-i)).isoformat(),
            'score': 6.0 + (i * 0.05),  # Improving
            'tags': ['calm'] if i % 2 == 0 else ['stress']
        })

    journal_data = [
        {'created_at': (datetime.now() - timedelta(days=i)).isoformat()}
        for i in range(0, 30, 3)  # Every 3 days
    ]

    verse_data = [
        {'timestamp': (datetime.now() - timedelta(days=i)).isoformat()}
        for i in range(0, 30, 2)  # Every 2 days
    ]

    kiaan_data = [
        {'created_at': (datetime.now() - timedelta(days=i)).isoformat()}
        for i in range(0, 30, 4)  # Every 4 days
    ]

    print(f"✓ Mood entries: {len(mood_data)}")
    print(f"✓ Journal entries: {len(journal_data)}")
    print(f"✓ Verse interactions: {len(verse_data)}")
    print(f"✓ KIAAN conversations: {len(kiaan_data)}")

    # Test Wellness Score Calculation
    print("\n[TEST] Calculate Wellness Score")
    wellness = service.calculate_wellness_score(
        mood_data=mood_data,
        journal_data=journal_data,
        verse_interactions=verse_data,
        kiaan_conversations=kiaan_data,
        lookback_days=30
    )

    print(f"✓ Overall Score: {wellness.total_score:.1f}/100")
    print(f"✓ Level: {wellness.level.upper()}")
    print(f"✓ Description: {wellness.level_description}")

    print(f"\n✓ Component Scores:")
    print(f"  Mood Stability: {wellness.mood_stability_score:.1f}/100")
    print(f"  Engagement: {wellness.engagement_score:.1f}/100")
    print(f"  Consistency: {wellness.consistency_score:.1f}/100")
    print(f"  Growth: {wellness.growth_score:.1f}/100")

    print(f"\n✓ Recommendations ({len(wellness.recommendations)}):")
    for rec in wellness.recommendations[:3]:
        print(f"  - {rec}")

    assert 0 <= wellness.total_score <= 100, "❌ Failed: Score out of range"
    assert wellness.total_score > 0, "❌ Failed: Score should be positive"

    print("\n✅ WellnessScoreService: ALL TESTS PASSED")


def test_insight_generator_service():
    """Test InsightGeneratorService functionality"""
    print("\n" + "="*80)
    print("TESTING: InsightGeneratorService")
    print("="*80)

    service = InsightGeneratorService()

    # Generate sample data
    print("\n[SETUP] Generating sample data for insights")
    mood_data = [{'score': 6.5, 'tags': ['calm', 'peaceful']} for _ in range(20)]
    mood_data += [{'score': 4.0, 'tags': ['anxiety', 'stress']} for _ in range(5)]

    journal_data = [
        {'content': 'Feeling grateful today', 'sentiment': 0.8},
        {'content': 'Had a tough day', 'sentiment': 0.3}
    ]

    verse_data = [{'verse_id': i} for i in range(10)]

    wellness_score = 72.0  # Just the numeric score

    trend_analysis = {
        'trend_direction': 'improving',
        'current_average': 6.2,
        'volatility': 1.2
    }

    patterns = {
        'weekly': {'Monday': {'average': 5.5}, 'Friday': {'average': 7.5}}
    }

    # Test 1: Generate Weekly Insight
    print("\n[TEST 1] Generate Weekly Insight")
    insight = service.generate_weekly_insight(
        mood_data=mood_data,
        journal_data=journal_data,
        verse_interactions=verse_data,
        wellness_score=wellness_score,
        trend_analysis=trend_analysis
    )
    print(f"✓ Generated insight (string):")
    print(f"  Content: {insight[:150]}...")

    assert isinstance(insight, str), "❌ Insight should be a string"
    assert len(insight) > 0, "❌ Insight should not be empty"
    assert "wellness" in insight.lower() or "mood" in insight.lower(), "❌ Insight should mention wellness or mood"

    # Test 2: Generate Mood Insight
    print("\n[TEST 2] Generate Mood Insight")
    insight = service.generate_mood_insight(
        mood_average=6.5,
        trend='improving',
        volatility=1.2,
        patterns=patterns
    )
    print(f"✓ Generated mood insight (string):")
    print(f"  Content: {insight[:100]}...")
    assert isinstance(insight, str) and len(insight) > 0, "❌ Mood insight should be non-empty string"

    # Test 3: Generate Growth Insight
    print("\n[TEST 3] Generate Growth Insight")
    insight = service.generate_growth_insight(
        current_period_avg=6.5,
        previous_period_avg=5.8,
        streak_days=7
    )
    print(f"✓ Generated growth insight (string):")
    print(f"  Content: {insight[:100]}...")
    assert isinstance(insight, str) and len(insight) > 0, "❌ Growth insight should be non-empty string"

    # Test 4: Check that service methods exist
    print("\n[TEST 4] Verify Service Methods")
    assert hasattr(service, 'generate_weekly_insight'), "❌ generate_weekly_insight method missing"
    assert hasattr(service, 'generate_mood_insight'), "❌ generate_mood_insight method missing"
    assert hasattr(service, 'generate_growth_insight'), "❌ generate_growth_insight method missing"
    print(f"✓ All core insight generation methods exist")

    print("\n✅ InsightGeneratorService: ALL TESTS PASSED")


def test_ml_algorithms():
    """Test ML algorithms in detail"""
    print("\n" + "="*80)
    print("TESTING: ML Algorithms in Detail")
    print("="*80)

    service = AnalyticsMLService()

    # Test Linear Regression
    print("\n[TEST] Linear Regression for Trend Detection")
    mood_data = [
        MoodDataPoint(date=(datetime.now() - timedelta(days=10-i)), score=float(5+i*0.2), tags=[])
        for i in range(10)
    ]

    trend = service.analyze_mood_trends(mood_data, lookback_days=10)
    print(f"✓ Trend strength: {trend.trend_strength:.4f}")
    print(f"✓ Direction: {trend.trend_direction}")
    assert trend.trend_direction == 'improving', "❌ Should detect improving trend"

    # Test Anomaly Detection (IQR method)
    print("\n[TEST] Anomaly Detection (IQR Method)")
    mood_data_with_anomaly = [
        MoodDataPoint(date=(datetime.now() - timedelta(days=20-i)), score=6.0, tags=[])
        for i in range(18)
    ]
    # Add anomalies
    mood_data_with_anomaly.append(
        MoodDataPoint(date=(datetime.now() - timedelta(days=2)), score=2.0, tags=['crisis'])
    )
    mood_data_with_anomaly.append(
        MoodDataPoint(date=(datetime.now() - timedelta(days=1)), score=1.5, tags=['crisis'])
    )

    trend = service.analyze_mood_trends(mood_data_with_anomaly, lookback_days=20)
    print(f"✓ Anomalies detected: {len(trend.anomalies)}")
    if trend.anomalies:
        for anomaly in trend.anomalies[:2]:
            print(f"  - {anomaly['date']}: score {anomaly['score']:.1f}")

    # Test Moving Averages
    print("\n[TEST] Moving Averages (7-day, 30-day)")
    mood_data_long = [
        MoodDataPoint(date=(datetime.now() - timedelta(days=40-i)), score=float(5+i*0.05), tags=[])
        for i in range(40)
    ]

    trend = service.analyze_mood_trends(mood_data_long, lookback_days=40)
    print(f"✓ 7-day MA: {trend.moving_avg_7d:.2f}")
    print(f"✓ 30-day MA: {trend.moving_avg_30d:.2f}")
    print(f"✓ Trend strength: {trend.trend_strength:.2f}")

    print("\n✅ ML Algorithms: ALL TESTS PASSED")


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ENHANCEMENT #6: ADVANCED ANALYTICS - SERVICE TESTS")
    print("="*80)

    try:
        # Test AnalyticsMLService
        test_analytics_ml_service()

        # Test WellnessScoreService
        test_wellness_score_service()

        # Test InsightGeneratorService
        test_insight_generator_service()

        # Test ML Algorithms
        test_ml_algorithms()

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
