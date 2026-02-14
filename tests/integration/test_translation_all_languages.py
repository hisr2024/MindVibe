"""Comprehensive Translation Tests for All Supported Languages

This test suite validates translation functionality across all 17 supported languages:
- English (en), Hindi (hi), Tamil (ta), Telugu (te), Bengali (bn)
- Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa), Sanskrit (sa)
- Spanish (es), French (fr), German (de), Portuguese (pt), Japanese (ja), Chinese (zh-CN)
"""

import asyncio
import pytest
from unittest.mock import Mock, patch
from backend.services.translation_service import TranslationService, SUPPORTED_LANGUAGES

# Skip all tests if googletrans is not installed (translation service runs in fallback mode)
try:
    import googletrans
except ImportError:
    pytestmark = pytest.mark.skip(reason="googletrans not installed - translation service runs in fallback mode")


class TestAllLanguagesTranslation:
    """Test translation functionality for all 17 supported languages"""
    
    @pytest.fixture
    def service(self):
        """Create a translation service instance"""
        return TranslationService()
    
    @pytest.fixture
    def sample_texts(self):
        """Sample texts for translation testing"""
        return {
            'greeting': 'Hello, how can I help you today?',
            'wellness': 'I am here to support your mental wellness journey.',
            'meditation': 'Let us begin with a mindful breathing exercise.',
            'gratitude': 'Practicing gratitude can bring inner peace.',
            'wisdom': 'Ancient wisdom teaches us to find balance in life.'
        }
    
    @pytest.mark.asyncio
    async def test_all_languages_supported(self, service):
        """Test that all 17 languages are recognized as supported"""
        expected_languages = [
            'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
            'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
        ]
        
        for lang in expected_languages:
            assert service.is_supported_language(lang), f"Language {lang} should be supported"
            assert lang in SUPPORTED_LANGUAGES, f"Language {lang} should be in SUPPORTED_LANGUAGES"
    
    @pytest.mark.asyncio
    async def test_translation_to_all_indic_languages(self, service, sample_texts):
        """Test translation to all Indian languages"""
        indic_languages = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa']
        text = sample_texts['greeting']
        
        for lang in indic_languages:
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[{lang.upper()}] {text}"  # Mock translation
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(text, lang, 'en')
            
            assert result['success'] is True, f"Translation to {lang} should succeed"
            assert result['target_lang'] == lang
            assert result['source_lang'] == 'en'
            assert len(result['translated_text']) > 0
            print(f"✅ {lang}: {result['translated_text'][:50]}...")
    
    @pytest.mark.asyncio
    async def test_translation_to_all_european_languages(self, service, sample_texts):
        """Test translation to all European languages"""
        european_languages = ['es', 'fr', 'de', 'pt']
        text = sample_texts['wellness']
        
        for lang in european_languages:
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[{lang.upper()}] {text}"
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(text, lang, 'en')
            
            assert result['success'] is True, f"Translation to {lang} should succeed"
            assert result['target_lang'] == lang
            assert len(result['translated_text']) > 0
            print(f"✅ {lang}: {result['translated_text'][:50]}...")
    
    @pytest.mark.asyncio
    async def test_translation_to_east_asian_languages(self, service, sample_texts):
        """Test translation to East Asian languages"""
        asian_languages = ['ja', 'zh-CN']
        text = sample_texts['meditation']
        
        for lang in asian_languages:
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[{lang.upper()}] {text}"
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(text, lang, 'en')
            
            assert result['success'] is True, f"Translation to {lang} should succeed"
            assert result['target_lang'] == lang
            assert len(result['translated_text']) > 0
            print(f"✅ {lang}: {result['translated_text'][:50]}...")
    
    @pytest.mark.asyncio
    async def test_translation_all_sample_texts(self, service, sample_texts):
        """Test translation of all sample texts"""
        target_lang = 'es'  # Test with Spanish
        
        for text_type, text in sample_texts.items():
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[ES] {text}"
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(text, target_lang, 'en')
            
            assert result['success'] is True, f"Translation of {text_type} should succeed"
            assert result['original_text'] == text
            assert len(result['translated_text']) > 0
            print(f"✅ {text_type}: Original length={len(text)}, Translated length={len(result['translated_text'])}")
    
    @pytest.mark.asyncio
    async def test_bidirectional_translation(self, service):
        """Test translation from English to target language and back"""
        text = "Peace comes from within."
        target_lang = 'hi'
        
        # Mock forward translation
        mock_result_forward = Mock()
        mock_result_forward.text = "शांति भीतर से आती है।"
        service.translator.translate = Mock(return_value=mock_result_forward)
        
        forward_result = await service.translate_text(text, target_lang, 'en')
        assert forward_result['success'] is True
        
        # Mock backward translation
        mock_result_backward = Mock()
        mock_result_backward.text = text
        service.translator.translate = Mock(return_value=mock_result_backward)
        
        backward_result = await service.translate_text(
            forward_result['translated_text'], 
            'en', 
            target_lang
        )
        assert backward_result['success'] is True
        print(f"✅ Forward: {text} -> {forward_result['translated_text']}")
        print(f"✅ Backward: {forward_result['translated_text']} -> {backward_result['translated_text']}")
    
    @pytest.mark.asyncio
    async def test_long_text_translation(self, service):
        """Test translation of longer text passages"""
        long_text = """
        Welcome to KIAAN, your compassionate mental wellness companion. 
        I am here to provide guidance rooted in ancient wisdom and modern psychology. 
        Together, we will explore practices like mindfulness, meditation, and self-reflection 
        to help you find inner peace and emotional balance. Your journey towards wellness 
        begins with a single step, and I am honored to walk alongside you.
        """
        
        target_languages = ['hi', 'es', 'fr']
        
        for lang in target_languages:
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[{lang.upper()}] {long_text[:100]}..."
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(long_text.strip(), lang, 'en')
            
            assert result['success'] is True
            assert len(result['translated_text']) > 0
            print(f"✅ {lang}: Long text translated (length={len(result['translated_text'])})")
    
    @pytest.mark.asyncio
    async def test_special_characters_translation(self, service):
        """Test translation with special characters"""
        texts_with_special_chars = [
            "Hello! How are you today?",
            "Great... Let's continue.",
            "Peace & Balance (Inner Harmony)",
            "🕉️ Ancient Wisdom 🙏"
        ]
        
        target_lang = 'hi'
        
        for text in texts_with_special_chars:
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[HI] {text}"
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(text, target_lang, 'en')
            
            assert result['success'] is True
            assert len(result['translated_text']) > 0
            print(f"✅ Special chars: {text[:30]}... -> {result['translated_text'][:30]}...")
    
    @pytest.mark.asyncio
    async def test_cache_across_languages(self, service):
        """Test that caching works correctly across different languages"""
        text = "Hello world"
        languages = ['es', 'fr', 'hi']
        
        for lang in languages:
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[{lang.upper()}] {text}"
            service.translator.translate = Mock(return_value=mock_result)
            
            # First call
            result1 = await service.translate_text(text, lang, 'en')
            call_count_1 = service.translator.translate.call_count
            
            # Second call (should use cache)
            result2 = await service.translate_text(text, lang, 'en')
            call_count_2 = service.translator.translate.call_count
            
            assert call_count_2 == call_count_1, f"Second call for {lang} should use cache"
            assert result1['translated_text'] == result2['translated_text']
            print(f"✅ {lang}: Cache working correctly")
    
    @pytest.mark.asyncio
    async def test_concurrent_translations(self, service):
        """Test handling multiple translation requests concurrently"""
        text = "Peace and harmony"
        languages = ['hi', 'es', 'fr', 'de', 'ja']
        
        async def translate_to_lang(lang):
            # Mock translator
            mock_result = Mock()
            mock_result.text = f"[{lang.upper()}] {text}"
            service.translator.translate = Mock(return_value=mock_result)
            
            return await service.translate_text(text, lang, 'en')
        
        # Execute translations concurrently
        results = await asyncio.gather(*[translate_to_lang(lang) for lang in languages])
        
        # Verify all succeeded
        for i, result in enumerate(results):
            assert result['success'] is True
            assert result['target_lang'] == languages[i]
            print(f"✅ Concurrent translation to {languages[i]} succeeded")


class TestLanguageNameMapping:
    """Test that language codes map to correct language names"""
    
    def test_all_language_names_present(self):
        """Test that all languages have proper names"""
        expected_names = {
            'en': 'English',
            'hi': 'Hindi',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali',
            'mr': 'Marathi',
            'gu': 'Gujarati',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'pa': 'Punjabi',
            'sa': 'Sanskrit',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'pt': 'Portuguese',
            'ja': 'Japanese',
            'zh-CN': 'Chinese (Simplified)'
        }
        
        for code, expected_name in expected_names.items():
            assert code in SUPPORTED_LANGUAGES
            assert SUPPORTED_LANGUAGES[code] == expected_name
            print(f"✅ {code}: {expected_name}")


class TestTranslationQuality:
    """Test translation quality and consistency"""
    
    @pytest.fixture
    def service(self):
        return TranslationService()
    
    @pytest.mark.asyncio
    async def test_consistency_across_similar_texts(self, service):
        """Test that similar texts get consistent translations"""
        texts = [
            "Hello",
            "Hello!",
            "Hello..."
        ]
        
        target_lang = 'es'
        translations = []
        
        for text in texts:
            # Mock translator
            mock_result = Mock()
            mock_result.text = "Hola"  # Same translation for all variations
            service.translator.translate = Mock(return_value=mock_result)
            
            result = await service.translate_text(text, target_lang, 'en')
            translations.append(result['translated_text'])
        
        # All should have the same core translation
        assert all(t.startswith("Hola") for t in translations)
        print(f"✅ Consistency: {translations}")
    
    @pytest.mark.asyncio
    async def test_no_data_loss_in_translation(self, service):
        """Test that no critical information is lost in translation"""
        text = "Your appointment is on Monday at 3:00 PM"
        target_lang = 'hi'
        
        # Mock translator
        mock_result = Mock()
        mock_result.text = f"[HI] {text}"
        service.translator.translate = Mock(return_value=mock_result)
        
        result = await service.translate_text(text, target_lang, 'en')
        
        assert result['success'] is True
        # Should contain meaningful content
        assert len(result['translated_text']) >= len(text) * 0.5
        print(f"✅ No data loss: Original={len(text)}, Translated={len(result['translated_text'])}")
