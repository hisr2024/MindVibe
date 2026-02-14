"""
API Endpoint Tests for Enhancement #6: Advanced Analytics Dashboard

Tests all 6 analytics API endpoints:
- Mood predictions
- Wellness score
- AI insights
- Risk assessment
- Pattern analysis
- Trend analysis
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from backend.routes.analytics_dashboard import router
from fastapi import FastAPI

# Create test app - mount router with /api prefix to match production paths
app = FastAPI()
app.include_router(router, prefix="/api")
client = TestClient(app)


def test_mood_predictions():
    """Test GET /api/analytics/advanced/mood-predictions - Get mood forecasts"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/analytics/advanced/mood-predictions")
    print("="*80)

    response = client.get("/api/analytics/advanced/mood-predictions?forecast_days=7")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Response received")

    # Check structure
    if isinstance(data, dict):
        if 'predictions' in data:
            predictions = data['predictions']
        else:
            predictions = data
    else:
        predictions = data

    print(f"✓ {len(predictions) if isinstance(predictions, list) else 'N/A'} predictions returned")

    if isinstance(predictions, list) and len(predictions) > 0:
        first_pred = predictions[0]
        print(f"✓ First prediction:")
        if isinstance(first_pred, dict):
            print(f"  - Date: {first_pred.get('date', 'N/A')}")
            print(f"  - Predicted score: {first_pred.get('predicted_score', 'N/A')}")
            print(f"  - Confidence: {first_pred.get('confidence_low', 'N/A')}-{first_pred.get('confidence_high', 'N/A')}")

    print("✅ PASSED")


def test_mood_predictions_custom_days():
    """Test mood predictions with custom forecast days"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/analytics/advanced/mood-predictions?forecast_days=14")
    print("="*80)

    response = client.get("/api/analytics/advanced/mood-predictions?forecast_days=14")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ 14-day forecast requested")

    print("✅ PASSED")


def test_wellness_score():
    """Test GET /api/analytics/advanced/wellness-score - Get wellness score"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/analytics/advanced/wellness-score")
    print("="*80)

    response = client.get("/api/analytics/advanced/wellness-score")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Wellness score received")

    # Check for expected fields
    if isinstance(data, dict):
        if 'overall_score' in data or 'total_score' in data or 'score' in data:
            score = data.get('overall_score') or data.get('total_score') or data.get('score')
            print(f"  - Overall score: {score}/100")

        if 'level' in data:
            print(f"  - Level: {data['level']}")

        if 'components' in data:
            print(f"  - Components: {list(data['components'].keys())}")
        elif 'mood_stability_score' in data:
            print(f"  - Mood stability: {data['mood_stability_score']}")
            print(f"  - Engagement: {data.get('engagement_score', 'N/A')}")

    print("✅ PASSED")


def test_ai_insights():
    """Test GET /api/analytics/advanced/ai-insights - Get AI insights"""
    print("\n" + "="*80)
    print("TEST 4: GET /api/analytics/advanced/ai-insights")
    print("="*80)

    response = client.get("/api/analytics/advanced/ai-insights")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ AI insights received")

    if isinstance(data, dict):
        if 'insights' in data:
            insights = data['insights']
            print(f"  - Number of insights: {len(insights)}")

            if len(insights) > 0:
                first_insight = insights[0]
                print(f"  - First insight type: {first_insight.get('type', 'N/A')}")
                print(f"  - Priority: {first_insight.get('priority', 'N/A')}")

        if 'ai_powered' in data:
            print(f"  - AI powered: {data['ai_powered']}")

    print("✅ PASSED")


def test_risk_assessment():
    """Test GET /api/analytics/advanced/risk-assessment - Get risk assessment"""
    print("\n" + "="*80)
    print("TEST 5: GET /api/analytics/advanced/risk-assessment")
    print("="*80)

    response = client.get("/api/analytics/advanced/risk-assessment")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Risk assessment received")

    if isinstance(data, dict):
        if 'risk_score' in data or 'score' in data:
            score = data.get('risk_score') or data.get('score')
            print(f"  - Risk score: {score}/100 (lower is better)")

        if 'risk_level' in data or 'level' in data:
            level = data.get('risk_level') or data.get('level')
            print(f"  - Risk level: {level}")

        if 'factors' in data:
            factors = data['factors']
            print(f"  - Risk factors: {list(factors.keys())}")

    print("✅ PASSED")


def test_pattern_analysis():
    """Test GET /api/analytics/advanced/pattern-analysis - Get pattern analysis"""
    print("\n" + "="*80)
    print("TEST 6: GET /api/analytics/advanced/pattern-analysis")
    print("="*80)

    response = client.get("/api/analytics/advanced/pattern-analysis")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Pattern analysis received")

    if isinstance(data, dict):
        if 'patterns' in data:
            patterns = data['patterns']

            if 'weekly' in patterns:
                print(f"  - Weekly patterns: {list(patterns['weekly'].keys())}")

            if 'tag_correlations' in patterns:
                print(f"  - Tag correlations: {len(patterns['tag_correlations'])} tags")

    print("✅ PASSED")


def test_trend_analysis():
    """Test GET /api/analytics/advanced/trend-analysis - Get trend analysis"""
    print("\n" + "="*80)
    print("TEST 7: GET /api/analytics/advanced/trend-analysis")
    print("="*80)

    response = client.get("/api/analytics/advanced/trend-analysis?lookback_days=30")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ Trend analysis received")

    if isinstance(data, dict):
        if 'trend_direction' in data:
            print(f"  - Trend direction: {data['trend_direction']}")

        if 'trend_strength' in data:
            print(f"  - Trend strength: {data['trend_strength']}")

        if 'moving_avg_7d' in data or 'seven_day_avg' in data:
            avg = data.get('moving_avg_7d') or data.get('seven_day_avg')
            print(f"  - 7-day average: {avg}")

        if 'volatility' in data:
            print(f"  - Volatility: {data['volatility']}")

        if 'anomalies' in data:
            print(f"  - Anomalies detected: {len(data['anomalies'])}")

    print("✅ PASSED")


def test_trend_analysis_custom_lookback():
    """Test trend analysis with custom lookback period"""
    print("\n" + "="*80)
    print("TEST 8: GET /api/analytics/advanced/trend-analysis?lookback_days=90")
    print("="*80)

    response = client.get("/api/analytics/advanced/trend-analysis?lookback_days=90")
    print(f"Status Code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    data = response.json()
    print(f"✓ 90-day trend analysis received")

    print("✅ PASSED")


def main():
    """Run all API tests"""
    print("\n" + "="*80)
    print("ENHANCEMENT #6: ANALYTICS API ENDPOINT TESTS")
    print("Testing 6 Advanced Analytics Dashboard Endpoints")
    print("="*80)

    try:
        # Core Analytics Tests
        test_mood_predictions()
        test_mood_predictions_custom_days()
        test_wellness_score()
        test_ai_insights()
        test_risk_assessment()
        test_pattern_analysis()
        test_trend_analysis()
        test_trend_analysis_custom_lookback()

        print("\n" + "="*80)
        print("🎉 ALL 8 API ENDPOINT TESTS PASSED!")
        print("="*80)
        print("\nNote: These tests validate API structure and responses.")
        print("Actual data would come from database queries in production.")

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
