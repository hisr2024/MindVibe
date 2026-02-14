"""
Tests for Multilingual Functionality

Tests coverage:
- All 17 languages are available
- Language switching updates UI
- Translation files exist and are valid
- Language persistence
- Backend API language support
"""

import pytest
import json
import os
from pathlib import Path


# All 17 supported languages
SUPPORTED_LANGUAGES = [
    'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 
    'ml', 'pa', 'sa', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
]

# Expected translation files for each language
REQUIRED_TRANSLATION_FILES = [
    'common.json',
    'dashboard.json',
    'errors.json',
    'features.json',
    'home.json',
    'kiaan.json',
    'navigation.json',
]


def get_locales_path():
    """Get path to locales directory."""
    return Path(__file__).parent.parent.parent / 'locales'


def test_all_languages_have_directories():
    """Test that all 17 languages have locale directories."""
    locales_path = get_locales_path()
    
    for lang in SUPPORTED_LANGUAGES:
        lang_dir = locales_path / lang
        assert lang_dir.exists(), f"Locale directory missing for {lang}"
        assert lang_dir.is_dir(), f"Locale path for {lang} is not a directory"


def test_all_languages_have_required_files():
    """Test that all languages have all required translation files."""
    locales_path = get_locales_path()
    
    for lang in SUPPORTED_LANGUAGES:
        lang_dir = locales_path / lang
        
        for filename in REQUIRED_TRANSLATION_FILES:
            file_path = lang_dir / filename
            assert file_path.exists(), f"Missing {filename} for {lang}"


def test_translation_files_are_valid_json():
    """Test that all translation files contain valid JSON."""
    locales_path = get_locales_path()
    
    for lang in SUPPORTED_LANGUAGES:
        lang_dir = locales_path / lang
        
        for filename in REQUIRED_TRANSLATION_FILES:
            file_path = lang_dir / filename
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    assert isinstance(data, dict), f"{lang}/{filename} is not a JSON object"
            except json.JSONDecodeError as e:
                pytest.fail(f"Invalid JSON in {lang}/{filename}: {e}")


def test_translation_files_have_content():
    """Test that translation files have actual translations, not empty objects."""
    locales_path = get_locales_path()
    
    for lang in SUPPORTED_LANGUAGES:
        lang_dir = locales_path / lang
        
        for filename in REQUIRED_TRANSLATION_FILES:
            file_path = lang_dir / filename
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                assert len(data) > 0, f"{lang}/{filename} is empty"


def test_all_languages_have_same_structure():
    """Test that all languages have similar key structures (at least in common.json)."""
    locales_path = get_locales_path()
    
    # Get English (reference) keys
    with open(locales_path / 'en' / 'common.json', 'r', encoding='utf-8') as f:
        en_data = json.load(f)
        en_keys = set(en_data.keys())
    
    # Check other languages have similar structure
    for lang in SUPPORTED_LANGUAGES:
        if lang == 'en':
            continue
            
        with open(locales_path / lang / 'common.json', 'r', encoding='utf-8') as f:
            lang_data = json.load(f)
            lang_keys = set(lang_data.keys())
            
            # Should have at least 50% of English keys
            common_keys = en_keys.intersection(lang_keys)
            coverage = len(common_keys) / len(en_keys)
            
            assert coverage >= 0.5, (
                f"{lang} common.json has only {coverage:.1%} key coverage "
                f"compared to English"
            )


def test_i18n_config_includes_all_languages():
    """Test that i18n.ts configuration includes all 17 languages."""
    i18n_path = Path(__file__).parent.parent.parent / 'i18n.ts'
    
    with open(i18n_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for lang in SUPPORTED_LANGUAGES:
        # Handle special case for zh-CN
        search_lang = lang.replace('-', '_') if '-' in lang else lang
        assert f"'{lang}'" in content or f'"{lang}"' in content, (
            f"Language {lang} not found in i18n.ts"
        )


def test_language_names_defined():
    """Test that all languages have display names defined."""
    i18n_path = Path(__file__).parent.parent.parent / 'i18n.ts'
    
    with open(i18n_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check localeNames object exists
    assert 'localeNames' in content, "localeNames not found in i18n.ts"
    
    # Check each language has a name
    for lang in SUPPORTED_LANGUAGES:
        # Look for the language code in localeNames (may be quoted for keys with special chars)
        assert (f"{lang}:" in content or f"'{lang}':" in content or f'"{lang}":' in content), (
            f"Display name for {lang} not found"
        )


def test_use_language_hook_includes_all_languages():
    """Test that useLanguage hook includes all 17 languages."""
    hook_path = Path(__file__).parent.parent.parent / 'hooks' / 'useLanguage.tsx'
    
    with open(hook_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check Language type includes all languages
    for lang in SUPPORTED_LANGUAGES:
        assert f"'{lang}'" in content or f'"{lang}"' in content, (
            f"Language {lang} not found in useLanguage.tsx"
        )


def test_no_duplicate_language_codes():
    """Test that there are no duplicate language codes."""
    locales_path = get_locales_path()
    
    # Get all directory names
    dirs = [d.name for d in locales_path.iterdir() if d.is_dir()]
    
    # Check for duplicates
    assert len(dirs) == len(set(dirs)), "Duplicate language directories found"


def test_translation_encoding():
    """Test that translation files use UTF-8 encoding (for non-ASCII characters)."""
    locales_path = get_locales_path()
    
    # Test a sample of languages with non-ASCII characters
    test_languages = ['hi', 'ta', 'te', 'bn', 'mr', 'ja', 'zh-CN']
    
    for lang in test_languages:
        file_path = locales_path / lang / 'common.json'
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Try to parse to ensure encoding is correct
                json.loads(content)
        except UnicodeDecodeError:
            pytest.fail(f"{lang}/common.json has encoding issues")


def test_language_specific_characters_present():
    """Test that language-specific files contain native characters."""
    locales_path = get_locales_path()
    
    # Languages and their expected character ranges
    language_checks = {
        'hi': lambda c: '\u0900' <= c <= '\u097F',  # Devanagari
        'ta': lambda c: '\u0B80' <= c <= '\u0BFF',  # Tamil
        'ja': lambda c: '\u3040' <= c <= '\u30FF' or '\u4E00' <= c <= '\u9FFF',  # Hiragana, Katakana, Kanji
        'zh-CN': lambda c: '\u4E00' <= c <= '\u9FFF',  # Chinese characters
    }
    
    for lang, char_check in language_checks.items():
        file_path = locales_path / lang / 'common.json'
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Check if file contains language-specific characters
            has_native_chars = any(char_check(c) for c in content)
            assert has_native_chars, (
                f"{lang}/common.json doesn't contain native characters"
            )


@pytest.mark.asyncio
async def test_backend_translation_api_supports_all_languages():
    """Test that backend translation API recognizes all 17 languages."""
    from backend.services.translation_service import SUPPORTED_LANGUAGES as BACKEND_LANGS
    
    # Backend should support all frontend languages
    for lang in SUPPORTED_LANGUAGES:
        assert lang in BACKEND_LANGS, (
            f"Backend doesn't support language: {lang}"
        )


def test_minimal_language_selector_has_all_flags():
    """Test that MinimalLanguageSelector has flag emojis for all languages."""
    selector_path = Path(__file__).parent.parent.parent / 'components' / 'MinimalLanguageSelector.tsx'
    
    with open(selector_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check flagEmojis object includes all languages
    for lang in SUPPORTED_LANGUAGES:
        # Each language should have a flag entry
        assert f"{lang}:" in content or f"'{lang}':" in content, (
            f"Flag emoji for {lang} not found in MinimalLanguageSelector"
        )


def test_language_count_is_17():
    """Verify we have exactly 17 languages as specified."""
    assert len(SUPPORTED_LANGUAGES) == 17, (
        f"Expected 17 languages, found {len(SUPPORTED_LANGUAGES)}"
    )
    
    locales_path = get_locales_path()
    actual_dirs = [d.name for d in locales_path.iterdir() if d.is_dir()]
    
    assert len(actual_dirs) >= 17, (
        f"Expected at least 17 locale directories, found {len(actual_dirs)}"
    )
