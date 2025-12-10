"""
Simple integration test for new KIAAN endpoints
Tests that the endpoints are properly registered and return expected structure
"""

import sys
import asyncio
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


async def test_import_routes():
    """Test that all new routes can be imported without errors"""
    print("Testing route imports...")
    
    try:
        from backend.routes.daily_analysis import router as daily_router
        print("✅ Daily Analysis router imported successfully")
        assert daily_router.prefix == "/api/kiaan/daily-analysis"
        print(f"   Prefix: {daily_router.prefix}")
    except Exception as e:
        print(f"❌ Failed to import Daily Analysis router: {e}")
        return False
    
    try:
        from backend.routes.sacred_reflections import router as reflections_router
        print("✅ Sacred Reflections router imported successfully")
        assert reflections_router.prefix == "/api/kiaan/sacred-reflections"
        print(f"   Prefix: {reflections_router.prefix}")
    except Exception as e:
        print(f"❌ Failed to import Sacred Reflections router: {e}")
        return False
    
    try:
        from backend.routes.weekly_assessment import router as assessment_router
        print("✅ Weekly Assessment router imported successfully")
        assert assessment_router.prefix == "/api/kiaan/weekly-assessment"
        print(f"   Prefix: {assessment_router.prefix}")
    except Exception as e:
        print(f"❌ Failed to import Weekly Assessment router: {e}")
        return False
    
    return True


async def test_model_imports():
    """Test that all new models can be imported"""
    print("\nTesting model imports...")
    
    try:
        from backend.models import (
            UserEmotionalLog,
            UserDailyAnalysis,
            UserWeeklyReflection,
            UserAssessment,
            UserVerseBookmark,
            UserJourneyProgress,
        )
        print("✅ All new models imported successfully")
        print("   Models:")
        print("   - UserEmotionalLog")
        print("   - UserDailyAnalysis")
        print("   - UserWeeklyReflection")
        print("   - UserAssessment")
        print("   - UserVerseBookmark")
        print("   - UserJourneyProgress")
    except Exception as e:
        print(f"❌ Failed to import models: {e}")
        return False
    
    return True


async def test_services():
    """Test that KIAAN Core and Gita Service work"""
    print("\nTesting service imports...")
    
    try:
        from backend.services.kiaan_core import KIAANCore
        kiaan = KIAANCore()
        print(f"✅ KIAAN Core initialized successfully")
        print(f"   Ready: {kiaan.ready}")
    except Exception as e:
        print(f"❌ Failed to initialize KIAAN Core: {e}")
        return False
    
    try:
        from backend.services.gita_service import GitaService
        gita = GitaService()
        print("✅ Gita Service initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Gita Service: {e}")
        return False
    
    return True


async def main():
    """Run all tests"""
    print("="*80)
    print("KIAAN Integration Tests")
    print("="*80)
    
    results = []
    
    # Test route imports
    results.append(await test_import_routes())
    
    # Test model imports
    results.append(await test_model_imports())
    
    # Test services
    results.append(await test_services())
    
    print("\n" + "="*80)
    if all(results):
        print("✅ All integration tests passed!")
        print("="*80)
        return 0
    else:
        print("❌ Some integration tests failed")
        print("="*80)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
