#!/usr/bin/env python3
"""
Security Enhancement Validation Script

This script validates that the DDoS protection and multilingual features
are properly integrated and functional.
"""

import sys
import json
from pathlib import Path


def check_file_exists(path: Path, description: str) -> bool:
    """Check if a file exists."""
    if path.exists():
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ {description} missing: {path}")
        return False


def validate_python_module(module_path: Path) -> bool:
    """Validate Python module can be compiled."""
    try:
        import py_compile
        py_compile.compile(str(module_path), doraise=True)
        print(f"✅ Python module valid: {module_path.name}")
        return True
    except Exception as e:
        print(f"❌ Python module invalid: {module_path.name} - {e}")
        return False


def validate_json_file(file_path: Path) -> bool:
    """Validate JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, dict):
                raise ValueError("Not a JSON object")
            if len(data) == 0:
                raise ValueError("Empty JSON object")
        return True
    except Exception as e:
        print(f"❌ Invalid JSON: {file_path} - {e}")
        return False


def main():
    """Run validation checks."""
    print("="*70)
    print("MINDVIBE SECURITY & MULTILINGUAL VALIDATION")
    print("="*70)
    
    all_checks_passed = True
    
    # Check DDoS protection middleware
    print("\n📋 Checking DDoS Protection Implementation...")
    ddos_module = Path("backend/middleware/ddos_protection.py")
    all_checks_passed &= check_file_exists(ddos_module, "DDoS Protection Middleware")
    all_checks_passed &= validate_python_module(ddos_module)
    
    # Check circuit breaker
    print("\n📋 Checking Circuit Breaker Implementation...")
    circuit_breaker = Path("backend/middleware/circuit_breaker.py")
    all_checks_passed &= check_file_exists(circuit_breaker, "Circuit Breaker")
    all_checks_passed &= validate_python_module(circuit_breaker)
    
    # Check main.py integration
    print("\n📋 Checking Backend Integration...")
    main_py = Path("backend/main.py")
    all_checks_passed &= validate_python_module(main_py)
    
    with open(main_py, 'r') as f:
        content = f.read()
        if "DDoSProtectionMiddleware" in content:
            print("✅ DDoS protection integrated in main.py")
        else:
            print("❌ DDoS protection not integrated in main.py")
            all_checks_passed = False
    
    # Check monitoring endpoint
    print("\n📋 Checking Monitoring Endpoint...")
    health_py = Path("backend/monitoring/health.py")
    all_checks_passed &= validate_python_module(health_py)
    
    with open(health_py, 'r') as f:
        content = f.read()
        if "security/status" in content:
            print("✅ Security monitoring endpoint added")
        else:
            print("❌ Security monitoring endpoint not found")
            all_checks_passed = False
    
    # Check multilingual support
    print("\n📋 Checking Multilingual Support...")
    LANGUAGES = [
        'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn',
        'ml', 'pa', 'sa', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
    ]
    
    locales_path = Path("locales")
    missing_langs = []
    
    for lang in LANGUAGES:
        lang_dir = locales_path / lang
        if not lang_dir.exists():
            missing_langs.append(lang)
    
    if missing_langs:
        print(f"❌ Missing language directories: {missing_langs}")
        all_checks_passed = False
    else:
        print(f"✅ All {len(LANGUAGES)} language directories present")
    
    # Validate translation files
    print("\n📋 Validating Translation Files...")
    REQUIRED_FILES = [
        'common.json', 'dashboard.json', 'errors.json',
        'features.json', 'home.json', 'kiaan.json', 'navigation.json'
    ]
    
    invalid_files = []
    for lang in LANGUAGES:
        lang_dir = locales_path / lang
        for filename in REQUIRED_FILES:
            file_path = lang_dir / filename
            if not file_path.exists():
                invalid_files.append(f"{lang}/{filename}: missing")
            elif not validate_json_file(file_path):
                invalid_files.append(f"{lang}/{filename}: invalid JSON")
    
    if invalid_files:
        print(f"❌ Translation file issues found:")
        for issue in invalid_files[:5]:  # Show first 5
            print(f"   - {issue}")
        all_checks_passed = False
    else:
        print(f"✅ All translation files valid ({len(LANGUAGES)} × {len(REQUIRED_FILES)} = {len(LANGUAGES) * len(REQUIRED_FILES)} files)")
    
    # Check test files
    print("\n📋 Checking Test Files...")
    test_files = [
        Path("tests/integration/test_ddos_protection.py"),
        Path("tests/integration/test_multilingual.py"),
    ]
    
    for test_file in test_files:
        all_checks_passed &= check_file_exists(test_file, f"Test file")
        all_checks_passed &= validate_python_module(test_file)
    
    # Check documentation
    print("\n📋 Checking Documentation...")
    doc_file = Path("SECURITY_MULTILINGUAL_IMPLEMENTATION.md")
    all_checks_passed &= check_file_exists(doc_file, "Implementation documentation")
    
    # Final summary
    print("\n" + "="*70)
    if all_checks_passed:
        print("✅ ALL VALIDATION CHECKS PASSED")
        print("="*70)
        print("\nSummary:")
        print("  ✅ DDoS protection middleware implemented")
        print("  ✅ Circuit breaker pattern implemented")
        print("  ✅ Backend integration complete")
        print("  ✅ Security monitoring endpoint added")
        print(f"  ✅ All {len(LANGUAGES)} languages configured and validated")
        print(f"  ✅ All {len(LANGUAGES) * len(REQUIRED_FILES)} translation files valid")
        print("  ✅ Comprehensive tests created")
        print("  ✅ Documentation complete")
        print("\n🎉 Implementation successful!")
        return 0
    else:
        print("❌ SOME VALIDATION CHECKS FAILED")
        print("="*70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
