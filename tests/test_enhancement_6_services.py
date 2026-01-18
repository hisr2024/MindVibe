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
            date=date.strftime('%Y-%m-%d'),
            score=score,
            tags=['anxiety', 'stress'] if i % 3 == 0 else ['calm', 'peaceful']
        ))

    print(f"✓ Generated {len(mood_data)} mood entries")
    print(f"  Date range: {mood_data[0].date} to {mood_data[-1].date}")
    print(f"  Score range: {min(m.score for m in mood_data):.1f} to {max(m.score for m in mood_data):.1f}")

    # Test 1: Trend Analysis
    print("\n[TEST 1] Mood Trend Analysis")
    trend = service.analyze_mood_trends(mood_data, lookback_days=30)
    print(f"✓ Current average: {trend.current_average:.2f}")
    print(f"✓ 7-day average: {trend.seven_day_avg:.2f}")
    print(f"✓ 30-day average: {trend.thirty_day_avg:.2f}")
    print(f"✓ Trend direction: {trend.trend_direction.upper()}")
    print(f"✓ Trend slope: {trend.trend_slope:.4f}")
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
    print(f"✓ Risk score: {risk['risk_score']:.1f}/100 (lower is better)")
    print(f"✓ Risk level: {risk['risk_level'].upper()}")
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
    for day, data in list(patterns['patterns']['weekly'].items())[:3]:
        print(f"  {day}: {data['average']:.1f} avg ({data['count']} entries)")

    print(f"✓ Tag correlations:")
    for tag in patterns['patterns']['tag_correlations'][:3]:
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
            'date': (datetime.now() - timedelta(days=30-i)).strftime('%Y-%m-%d'),
            'score': 6.0 + (i * 0.05),  # Improving
            'tags': ['calm'] if i % 2 == 0 else ['stress']
        })

    journal_data = [
        {'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')}
        for i in range(0, 30, 3)  # Every 3 days
    ]

    verse_data = [
        {'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')}
        for i in range(0, 30, 2)  # Every 2 days
    ]

    kiaan_data = [
        {'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')}
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

    print(f"✓ Overall Score: {wellness.overall_score:.1f}/100")
    print(f"✓ Level: {wellness.level.upper()}")
    print(f"✓ Description: {wellness.description}")

    print(f"\n✓ Component Scores:")
    for name, component in wellness.components.items():
        print(f"  {name.replace('_', ' ').title()}: {component.score:.1f}/100 "
              f"({component.description})")

    print(f"\n✓ Recommendations ({len(wellness.recommendations)}):")
    for rec in wellness.recommendations[:3]:
        print(f"  - {rec}")

    assert 0 <= wellness.overall_score <= 100, "❌ Failed: Score out of range"
    assert wellness.overall_score > 0, "❌ Failed: Score should be positive"

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

    wellness_score = {
        'overall_score': 72,
        'components': {
            'mood_stability': {'score': 65},
            'engagement': {'score': 80}
        }
    }

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
    print(f"✓ Generated insight:")
    print(f"  Type: {insight['type']}")
    print(f"  Title: {insight['title']}")
    print(f"  Content: {insight['content'][:100]}...")
    print(f"  Priority: {insight['priority']}")
    print(f"  Icon: {insight['icon']}")

    assert insight['type'] in ['weekly_summary', 'progress', 'encouragement'], "❌ Invalid type"
    assert insight['priority'] in ['high', 'medium', 'low'], "❌ Invalid priority"

    # Test 2: Generate Mood Insight
    print("\n[TEST 2] Generate Mood Insight")
    insight = service.generate_mood_insight(
        mood_average=6.5,
        trend='improving',
        volatility=1.2,
        patterns=patterns
    )
    print(f"✓ Generated mood insight:")
    print(f"  Title: {insight['title']}")
    print(f"  Content: {insight['content'][:100]}...")

    # Test 3: Generate Growth Insight
    print("\n[TEST 3] Generate Growth Insight")
    insight = service.generate_growth_insight(
        current_avg=6.5,
        previous_avg=5.8,
        streak_days=7
    )
    print(f"✓ Generated growth insight:")
    print(f"  Title: {insight['title']}")
    print(f"  Content: {insight['content'][:100]}...")

    # Test 4: Generate Pattern Insight
    print("\n[TEST 4] Generate Pattern Insight")
    insight = service.generate_pattern_insight(
        patterns=patterns,
        tag_correlations=[
            {'tag': 'meditation', 'average_mood': 7.5, 'impact': 'positive'},
            {'tag': 'work', 'average_mood': 5.0, 'impact': 'negative'}
        ]
    )
    print(f"✓ Generated pattern insight:")
    print(f"  Title: {insight['title']}")
    print(f"  Content: {insight['content'][:100]}...")

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
        MoodDataPoint(date=(datetime.now() - timedelta(days=10-i)).strftime('%Y-%m-%d'), score=float(5+i*0.2), tags=[])
        for i in range(10)
    ]

    trend = service.analyze_mood_trends(mood_data, lookback_days=10)
    print(f"✓ Slope: {trend.trend_slope:.4f}")
    print(f"✓ Direction: {trend.trend_direction}")
    assert trend.trend_direction == 'improving', "❌ Should detect improving trend"

    # Test Anomaly Detection (IQR method)
    print("\n[TEST] Anomaly Detection (IQR Method)")
    mood_data_with_anomaly = [
        MoodDataPoint(date=(datetime.now() - timedelta(days=20-i)).strftime('%Y-%m-%d'), score=6.0, tags=[])
        for i in range(18)
    ]
    # Add anomalies
    mood_data_with_anomaly.append(
        MoodDataPoint(date=(datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'), score=2.0, tags=['crisis'])
    )
    mood_data_with_anomaly.append(
        MoodDataPoint(date=(datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'), score=1.5, tags=['crisis'])
    )

    trend = service.analyze_mood_trends(mood_data_with_anomaly, lookback_days=20)
    print(f"✓ Anomalies detected: {len(trend.anomalies)}")
    if trend.anomalies:
        for anomaly in trend.anomalies[:2]:
            print(f"  - {anomaly['date']}: score {anomaly['score']:.1f}")

    # Test Moving Averages
    print("\n[TEST] Moving Averages (7-day, 30-day)")
    mood_data_long = [
        MoodDataPoint(date=(datetime.now() - timedelta(days=40-i)).strftime('%Y-%m-%d'), score=float(5+i*0.05), tags=[])
        for i in range(40)
    ]

    trend = service.analyze_mood_trends(mood_data_long, lookback_days=40)
    print(f"✓ 7-day MA: {trend.seven_day_avg:.2f}")
    print(f"✓ 30-day MA: {trend.thirty_day_avg:.2f}")
    print(f"✓ Overall avg: {trend.current_average:.2f}")

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
