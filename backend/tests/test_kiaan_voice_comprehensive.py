"""
Comprehensive Test Suite for KIAAN Voice Features

Tests all pronunciation, language, accent, and voice features
to ensure full implementation and correctness.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestSanskritPronunciation:
    """Test Sanskrit pronunciation system with IPA phonemes."""

    def test_sanskrit_phoneme_enum_complete(self):
        """Verify all Sanskrit phonemes are defined."""
        from backend.services.kiaan_pronunciation_languages import SanskritPhoneme

        # Count phoneme categories
        vowels_short = ['A', 'I', 'U', 'RI', 'LRI']
        vowels_long = ['AA', 'II', 'UU', 'RII']
        diphthongs = ['E', 'AI', 'O', 'AU']
        special = ['ANUSVARA', 'VISARGA']
        gutturals = ['KA', 'KHA', 'GA', 'GHA', 'NGA']
        palatals = ['CHA', 'CHHA', 'JA', 'JHA', 'NYA']
        retroflexes = ['TTA', 'TTHA', 'DDA', 'DDHA', 'NNA']
        dentals = ['TA', 'THA', 'DA', 'DHA', 'NA']
        labials = ['PA', 'PHA', 'BA', 'BHA', 'MA']
        semivowels = ['YA', 'RA', 'LA', 'VA']
        sibilants = ['SHA', 'SHHA', 'SA', 'HA']

        all_phonemes = (vowels_short + vowels_long + diphthongs + special +
                        gutturals + palatals + retroflexes + dentals +
                        labials + semivowels + sibilants)

        for phoneme in all_phonemes:
            assert hasattr(SanskritPhoneme, phoneme), f"Missing phoneme: {phoneme}"

        print(f"✅ All {len(all_phonemes)} Sanskrit phonemes verified")

    def test_ipa_map_completeness(self):
        """Verify IPA map has all essential mappings."""
        from backend.services.kiaan_pronunciation_languages import SANSKRIT_IPA_MAP

        essential_sounds = [
            'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ',  # Vowels
            'क', 'ख', 'ग', 'घ',  # Gutturals
            'च', 'छ', 'ज', 'झ',  # Palatals
            'ट', 'ठ', 'ड', 'ढ', 'ण',  # Retroflexes
            'त', 'थ', 'द', 'ध', 'न',  # Dentals
            'प', 'फ', 'ब', 'भ', 'म',  # Labials
            'य', 'र', 'ल', 'व',  # Semivowels
            'श', 'ष', 'स', 'ह',  # Sibilants
        ]

        for sound in essential_sounds:
            assert sound in SANSKRIT_IPA_MAP, f"Missing IPA mapping for: {sound}"

        print(f"✅ All {len(essential_sounds)} essential IPA mappings verified")
        print(f"   Total mappings in map: {len(SANSKRIT_IPA_MAP)}")

    def test_ipa_conversion(self):
        """Test IPA conversion for common Sanskrit words."""
        from backend.services.kiaan_pronunciation_languages import convert_to_ipa

        test_cases = [
            ('namaste', True),  # Should convert
            ('om', True),
            ('shanti', True),
            ('dharma', True),
            ('karma', True),
            ('yoga', True),
        ]

        for word, should_convert in test_cases:
            result = convert_to_ipa(word)
            assert result is not None, f"Failed to convert: {word}"
            assert len(result) > 0, f"Empty result for: {word}"
            print(f"   {word} → {result}")

        print("✅ IPA conversion working correctly")

    def test_sacred_shlokas_defined(self):
        """Verify all sacred shlokas are properly defined."""
        from backend.services.kiaan_pronunciation_languages import SACRED_SHLOKAS, SanskritShloka

        required_shlokas = [
            'karmanye_vadhikaraste',
            'yogasthah_kuru_karmani',
            'om_bhur_bhuva',
            'asato_ma_sadgamaya',
            'om_sahana_vavatu',
            'lokah_samastah',
        ]

        for key in required_shlokas:
            assert key in SACRED_SHLOKAS, f"Missing shloka: {key}"
            shloka = SACRED_SHLOKAS[key]
            assert isinstance(shloka, SanskritShloka)
            assert shloka.devanagari, f"Missing Devanagari for: {key}"
            assert shloka.iast, f"Missing IAST for: {key}"
            assert shloka.meaning, f"Missing meaning for: {key}"
            assert shloka.source, f"Missing source for: {key}"
            print(f"   ✓ {key}: {shloka.source}")

        print(f"✅ All {len(required_shlokas)} sacred shlokas verified")

    def test_shloka_ssml_generation(self):
        """Test SSML generation for shlokas."""
        from backend.services.kiaan_pronunciation_languages import (
            SACRED_SHLOKAS, generate_shloka_ssml
        )

        shloka = SACRED_SHLOKAS['karmanye_vadhikaraste']

        # Test different configurations
        configs = [
            {'include_meaning': True, 'voice_gender': 'male', 'chanting_style': 'traditional'},
            {'include_meaning': False, 'voice_gender': 'female', 'chanting_style': 'meditative'},
            {'include_meaning': True, 'voice_gender': 'male', 'chanting_style': 'devotional'},
        ]

        for config in configs:
            ssml = generate_shloka_ssml(shloka, **config)
            assert ssml is not None
            assert len(ssml) > 100, "SSML too short"
            assert '<break' in ssml, "Missing pause markers"
            assert '<prosody' in ssml, "Missing prosody markers"
            print(f"   ✓ Config {config['chanting_style']}: {len(ssml)} chars")

        print("✅ Shloka SSML generation working correctly")

    def test_chandas_patterns(self):
        """Verify all chandas (meters) are properly defined."""
        from backend.services.kiaan_pronunciation_languages import Chandas, CHANDAS_PATTERNS

        for chandas in Chandas:
            assert chandas in CHANDAS_PATTERNS, f"Missing pattern for: {chandas.value}"
            pattern = CHANDAS_PATTERNS[chandas]
            assert 'syllables_per_pada' in pattern
            assert 'pause_after_pada_ms' in pattern
            assert 'rate_multiplier' in pattern
            print(f"   ✓ {chandas.value}: {pattern['syllables_per_pada']} syllables/pada")

        print(f"✅ All {len(Chandas)} chandas patterns verified")


class TestMultiLanguageSupport:
    """Test multi-language support for all 10 Indian languages."""

    def test_all_languages_defined(self):
        """Verify all 10 languages are defined."""
        from backend.services.kiaan_pronunciation_languages import IndianLanguage

        expected_languages = [
            'HINDI', 'TAMIL', 'TELUGU', 'KANNADA', 'MALAYALAM',
            'BENGALI', 'GUJARATI', 'MARATHI', 'PUNJABI', 'ODIA'
        ]

        for lang in expected_languages:
            assert hasattr(IndianLanguage, lang), f"Missing language: {lang}"

        assert len(IndianLanguage) == 10, f"Expected 10 languages, got {len(IndianLanguage)}"
        print(f"✅ All 10 Indian languages defined")

    def test_language_configs_complete(self):
        """Verify each language has complete configuration."""
        from backend.services.kiaan_pronunciation_languages import (
            IndianLanguage, LANGUAGE_CONFIGS, LanguageConfig
        )

        for lang in IndianLanguage:
            assert lang in LANGUAGE_CONFIGS, f"Missing config for: {lang.value}"
            config = LANGUAGE_CONFIGS[lang]
            assert isinstance(config, LanguageConfig)
            assert config.code, f"Missing code for: {lang.value}"
            assert config.name, f"Missing name for: {lang.value}"
            assert config.native_name, f"Missing native_name for: {lang.value}"
            assert config.script, f"Missing script for: {lang.value}"
            assert config.greeting, f"Missing greeting for: {lang.value}"
            print(f"   ✓ {config.name} ({config.native_name}): {config.script}")

        print(f"✅ All language configurations complete")

    def test_language_greetings(self):
        """Test native greetings for each language."""
        from backend.services.kiaan_pronunciation_languages import (
            IndianLanguage, get_language_greeting
        )

        for lang in IndianLanguage:
            greeting = get_language_greeting(lang)
            assert greeting, f"Empty greeting for: {lang.value}"
            assert len(greeting) > 5, f"Greeting too short for: {lang.value}"
            print(f"   {lang.name}: {greeting}")

        print("✅ All language greetings working")

    def test_multilingual_ssml_generation(self):
        """Test SSML generation with language tags."""
        from backend.services.kiaan_pronunciation_languages import (
            IndianLanguage, generate_multilingual_ssml
        )

        test_text = "May peace be with you, dear one."

        for lang in IndianLanguage:
            ssml = generate_multilingual_ssml(test_text, lang, include_native_greeting=True)
            assert ssml is not None
            assert f'xml:lang="{lang.value}' in ssml, f"Missing language tag for: {lang.value}"
            assert '<prosody' in ssml, f"Missing prosody for: {lang.value}"
            print(f"   ✓ {lang.name}: language tags applied")

        print("✅ Multilingual SSML generation working")


class TestRegionalAccents:
    """Test all 12 regional Indian accents."""

    def test_all_accents_defined(self):
        """Verify all 12 regional accents are defined."""
        from backend.services.kiaan_pronunciation_languages import RegionalAccent

        expected_accents = [
            # North
            'DELHI', 'PUNJABI', 'UP_HINDI', 'RAJASTHANI',
            # South
            'TAMIL_ENGLISH', 'TELUGU_ENGLISH', 'KANNADA_ENGLISH', 'MALAYALAM_ENGLISH',
            # East
            'BENGALI_ENGLISH', 'ODIA_ENGLISH',
            # West
            'MARATHI_ENGLISH', 'GUJARATI_ENGLISH',
        ]

        for accent in expected_accents:
            assert hasattr(RegionalAccent, accent), f"Missing accent: {accent}"

        assert len(RegionalAccent) == 12, f"Expected 12 accents, got {len(RegionalAccent)}"
        print(f"✅ All 12 regional accents defined")

    def test_accent_profiles_complete(self):
        """Verify each accent has complete profile."""
        from backend.services.kiaan_pronunciation_languages import (
            RegionalAccent, ACCENT_PROFILES, AccentProfile
        )

        for accent in RegionalAccent:
            assert accent in ACCENT_PROFILES, f"Missing profile for: {accent.value}"
            profile = ACCENT_PROFILES[accent]
            assert isinstance(profile, AccentProfile)
            assert profile.name, f"Missing name for: {accent.value}"
            assert profile.region, f"Missing region for: {accent.value}"
            assert profile.pitch_range, f"Missing pitch_range for: {accent.value}"
            assert profile.speaking_rate > 0, f"Invalid rate for: {accent.value}"
            print(f"   ✓ {profile.name} ({profile.region})")

        print(f"✅ All accent profiles complete")

    def test_accent_application(self):
        """Test accent application to text."""
        from backend.services.kiaan_pronunciation_languages import (
            RegionalAccent, apply_regional_accent
        )

        test_text = "Hello, how are you today?"

        for accent in RegionalAccent:
            result = apply_regional_accent(test_text, accent)
            assert result is not None
            assert '<prosody' in result, f"Missing prosody for: {accent.value}"
            assert 'rate=' in result, f"Missing rate for: {accent.value}"

        print("✅ Accent application working for all accents")


class TestNaturalVoiceFeatures:
    """Test natural voice features (vocal quality, pitch contours)."""

    def test_vocal_quality_presets(self):
        """Verify all vocal quality presets are defined."""
        from backend.services.kiaan_pronunciation_languages import (
            VocalQuality, VOCAL_QUALITY_PRESETS
        )

        expected_presets = [
            'intimate_whisper', 'warm_comforting', 'gentle_meditation',
            'energetic_encouraging', 'sad_empathetic', 'sacred_chanting', 'wise_elder'
        ]

        for preset in expected_presets:
            assert preset in VOCAL_QUALITY_PRESETS, f"Missing preset: {preset}"
            quality = VOCAL_QUALITY_PRESETS[preset]
            assert isinstance(quality, VocalQuality)
            assert 0 <= quality.breathiness <= 1
            assert 0 <= quality.vocal_fry <= 1
            assert 0 <= quality.tenseness <= 1
            print(f"   ✓ {preset}: breathiness={quality.breathiness}")

        print(f"✅ All {len(expected_presets)} vocal quality presets verified")

    def test_pitch_contours(self):
        """Verify all pitch contour patterns are defined."""
        from backend.services.kiaan_pronunciation_languages import (
            PitchContour, PITCH_CONTOURS
        )

        expected_contours = [
            'statement_neutral', 'statement_warm', 'question_yes_no',
            'question_wh', 'empathetic', 'soothing_lullaby',
            'encouraging', 'sacred_reverent'
        ]

        for contour in expected_contours:
            assert contour in PITCH_CONTOURS, f"Missing contour: {contour}"
            pattern = PITCH_CONTOURS[contour]
            assert isinstance(pattern, PitchContour)
            assert pattern.name
            assert len(pattern.points) >= 2, f"Too few points for: {contour}"
            print(f"   ✓ {contour}: {len(pattern.points)} control points")

        print(f"✅ All {len(expected_contours)} pitch contours verified")

    def test_pitch_contour_application(self):
        """Test pitch contour application."""
        from backend.services.kiaan_pronunciation_languages import (
            apply_pitch_contour, PITCH_CONTOURS
        )

        test_text = "May peace be with you."

        for contour_name in PITCH_CONTOURS:
            result = apply_pitch_contour(test_text, contour_name)
            assert result is not None
            assert '<prosody' in result
            assert 'pitch=' in result

        print("✅ Pitch contour application working")

    def test_natural_disfluencies(self):
        """Test natural disfluency addition."""
        from backend.services.kiaan_pronunciation_languages import add_natural_disfluencies

        test_text = "I actually think you are really doing truly well perhaps."
        result = add_natural_disfluencies(test_text, frequency=0.5)
        assert result is not None
        # Should have some pauses added
        assert '<break' in result or result != test_text
        print("✅ Natural disfluencies working")


class TestVedicChanting:
    """Test Vedic chanting system."""

    def test_chanting_modes_defined(self):
        """Verify all chanting modes are defined."""
        from backend.services.kiaan_pronunciation_languages import ChantingMode

        expected_modes = ['SAMHITA', 'PADA', 'KRAMA', 'JATA', 'GHANA']

        for mode in expected_modes:
            assert hasattr(ChantingMode, mode), f"Missing mode: {mode}"

        print(f"✅ All {len(expected_modes)} chanting modes defined")

    def test_vedic_chants_defined(self):
        """Verify all Vedic peace chants are defined."""
        from backend.services.kiaan_pronunciation_languages import (
            VEDIC_PEACE_CHANTS, VedicChant
        )

        expected_chants = [
            'shanti_mantra_1', 'shanti_mantra_2', 'gayatri', 'mahamrityunjaya'
        ]

        for key in expected_chants:
            assert key in VEDIC_PEACE_CHANTS, f"Missing chant: {key}"
            chant = VEDIC_PEACE_CHANTS[key]
            assert isinstance(chant, VedicChant)
            assert chant.name, f"Missing name for: {key}"
            assert chant.text, f"Missing text for: {key}"
            assert chant.transliteration, f"Missing transliteration for: {key}"
            assert chant.meaning, f"Missing meaning for: {key}"
            assert chant.source, f"Missing source for: {key}"
            print(f"   ✓ {chant.name} ({chant.source})")

        print(f"✅ All {len(expected_chants)} Vedic chants verified")

    def test_vedic_chant_ssml_generation(self):
        """Test SSML generation for Vedic chants."""
        from backend.services.kiaan_pronunciation_languages import (
            VEDIC_PEACE_CHANTS, generate_vedic_chant_ssml
        )

        for key, chant in VEDIC_PEACE_CHANTS.items():
            # Test with different configurations
            for repetitions in [1, 3]:
                for gender in ['male', 'female']:
                    ssml = generate_vedic_chant_ssml(
                        chant,
                        repetitions=repetitions,
                        include_meaning=True,
                        voice_gender=gender
                    )
                    assert ssml is not None
                    assert '<break' in ssml, f"Missing breaks for: {key}"
                    assert '<prosody' in ssml, f"Missing prosody for: {key}"

            print(f"   ✓ {chant.name}: SSML generation working")

        print("✅ Vedic chant SSML generation working")


class TestHumanVoiceQualities:
    """Test human voice qualities (emotional contagion, personalities)."""

    def test_emotional_contagion_strategies(self):
        """Verify all emotional contagion strategies."""
        from backend.services.kiaan_pronunciation_languages import EmotionalContagion

        expected_strategies = ['MIRROR', 'SLIGHTLY_CALMER', 'COUNTER', 'AMPLIFY']

        for strategy in expected_strategies:
            assert hasattr(EmotionalContagion, strategy), f"Missing strategy: {strategy}"

        print(f"✅ All {len(expected_strategies)} emotional contagion strategies defined")

    def test_emotional_contagion_application(self):
        """Test emotional contagion parameter calculation."""
        from backend.services.kiaan_pronunciation_languages import (
            apply_emotional_contagion, EmotionalContagion
        )

        emotions = ['anxious', 'sad', 'angry', 'peaceful', 'grateful']
        strategies = list(EmotionalContagion)

        for emotion in emotions:
            for strategy in strategies:
                params = apply_emotional_contagion(emotion, 0.7, strategy)
                assert 'rate' in params
                assert 'pitch' in params
                assert 'volume' in params
                assert 0.5 <= params['rate'] <= 1.5, f"Rate out of range for {emotion}"

        print("✅ Emotional contagion application working")

    def test_personality_profiles(self):
        """Verify all personality profiles are defined."""
        from backend.services.kiaan_pronunciation_languages import (
            KIAAN_PERSONALITIES, PersonalityTrait
        )

        expected_personalities = [
            'wise_sage', 'nurturing_mother', 'gentle_friend',
            'spiritual_guide', 'encouraging_elder'
        ]

        for personality in expected_personalities:
            assert personality in KIAAN_PERSONALITIES, f"Missing personality: {personality}"
            trait = KIAAN_PERSONALITIES[personality]
            assert isinstance(trait, PersonalityTrait)
            assert 0 <= trait.warmth <= 1
            assert 0 <= trait.authority <= 1
            assert 0 <= trait.playfulness <= 1
            assert 0 <= trait.formality <= 1
            assert 0 <= trait.empathy <= 1
            print(f"   ✓ {personality}: warmth={trait.warmth}, empathy={trait.empathy}")

        print(f"✅ All {len(expected_personalities)} personality profiles verified")

    def test_personality_voice_application(self):
        """Test personality voice application."""
        from backend.services.kiaan_pronunciation_languages import (
            add_personality_voice, KIAAN_PERSONALITIES
        )

        test_text = "Hello, dear one. May peace be with you."

        for personality in KIAAN_PERSONALITIES:
            result = add_personality_voice(test_text, personality)
            assert result is not None
            assert '<prosody' in result
            assert 'rate=' in result
            assert 'pitch=' in result
            print(f"   ✓ {personality}: voice applied")

        print("✅ Personality voice application working")

    def test_warmth_expressions(self):
        """Verify warmth expressions are defined."""
        from backend.services.kiaan_pronunciation_languages import WARMTH_EXPRESSIONS

        required_categories = ['opening_warmth', 'mid_conversation', 'closing_warmth']

        for category in required_categories:
            assert category in WARMTH_EXPRESSIONS, f"Missing category: {category}"
            expressions = WARMTH_EXPRESSIONS[category]
            assert len(expressions) >= 2, f"Too few expressions for: {category}"
            print(f"   ✓ {category}: {len(expressions)} expressions")

        print("✅ Warmth expressions verified")

    def test_gentle_humor_patterns(self):
        """Verify gentle humor patterns are defined."""
        from backend.services.kiaan_pronunciation_languages import GENTLE_HUMOR_PATTERNS

        required_categories = ['self_deprecating', 'playful_observations', 'gentle_teasing']

        for category in required_categories:
            assert category in GENTLE_HUMOR_PATTERNS, f"Missing category: {category}"
            patterns = GENTLE_HUMOR_PATTERNS[category]
            assert len(patterns) >= 2, f"Too few patterns for: {category}"
            print(f"   ✓ {category}: {len(patterns)} patterns")

        print("✅ Gentle humor patterns verified")


class TestIntegrationFunction:
    """Test the main integration function."""

    def test_integration_basic(self):
        """Test basic integration function call."""
        from backend.services.kiaan_pronunciation_languages import (
            create_perfect_pronunciation_ssml
        )

        result = create_perfect_pronunciation_ssml(
            text="Namaste, may peace be with you.",
            emotion="peaceful",
            emotion_intensity=0.5,
            personality="wise_sage"
        )

        assert result is not None
        assert len(result) > 0
        print("✅ Basic integration working")

    def test_integration_with_language(self):
        """Test integration with language setting."""
        from backend.services.kiaan_pronunciation_languages import (
            create_perfect_pronunciation_ssml, IndianLanguage
        )

        for lang in IndianLanguage:
            result = create_perfect_pronunciation_ssml(
                text="May peace be with you.",
                language=lang,
                emotion="peaceful"
            )
            assert result is not None
            assert 'xml:lang' in result, f"Missing lang tag for: {lang.value}"

        print("✅ Integration with all languages working")

    def test_integration_with_accent(self):
        """Test integration with accent setting."""
        from backend.services.kiaan_pronunciation_languages import (
            create_perfect_pronunciation_ssml, RegionalAccent
        )

        for accent in RegionalAccent:
            result = create_perfect_pronunciation_ssml(
                text="Hello, how are you today?",
                accent=accent,
                emotion="neutral"
            )
            assert result is not None

        print("✅ Integration with all accents working")

    def test_integration_with_shloka(self):
        """Test integration for Sanskrit shlokas."""
        from backend.services.kiaan_pronunciation_languages import (
            create_perfect_pronunciation_ssml, Chandas
        )

        result = create_perfect_pronunciation_ssml(
            text="karmaṇy evādhikāras te mā phaleṣu kadācana",
            is_shloka=True,
            chandas=Chandas.ANUSHTUP,
            voice_gender="male"
        )

        assert result is not None
        assert '<prosody' in result
        print("✅ Integration for shlokas working")


class TestDivineVoiceServiceIntegration:
    """Test integration with KIAANDivineVoice service."""

    def test_service_initialization(self):
        """Test service initializes with pronunciation module."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()
        assert service is not None
        print("✅ Divine voice service initialized")

    def test_pronunciation_status(self):
        """Test pronunciation status endpoint."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()
        status = service.get_pronunciation_status()

        assert status['pronunciation_available'] == True
        assert 'features' in status
        assert status['features']['sanskrit_ipa'] == True
        assert status['features']['multi_language'] == True
        assert status['features']['regional_accents'] == True
        assert status['features']['vedic_chanting'] == True
        print("✅ Pronunciation status endpoint working")

    def test_supported_languages_endpoint(self):
        """Test supported languages endpoint."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()
        languages = service.get_supported_languages()

        assert len(languages) == 10
        for lang in languages:
            assert 'code' in lang
            assert 'name' in lang
            assert 'native_name' in lang
            assert 'script' in lang

        print(f"✅ Supported languages: {len(languages)}")

    def test_supported_accents_endpoint(self):
        """Test supported accents endpoint."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()
        accents = service.get_supported_accents()

        assert len(accents) >= 8  # At least 8 accents with profiles
        for accent in accents:
            assert 'code' in accent
            assert 'name' in accent
            assert 'region' in accent

        print(f"✅ Supported accents: {len(accents)}")

    def test_available_shlokas_endpoint(self):
        """Test available shlokas endpoint."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()
        shlokas = service.get_available_shlokas()

        assert len(shlokas) >= 6
        for shloka in shlokas:
            assert 'key' in shloka
            assert 'source' in shloka
            assert 'meaning_preview' in shloka

        print(f"✅ Available shlokas: {len(shlokas)}")

    def test_available_vedic_chants_endpoint(self):
        """Test available Vedic chants endpoint."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()
        chants = service.get_available_vedic_chants()

        assert len(chants) >= 4
        for chant in chants:
            assert 'key' in chant
            assert 'name' in chant
            assert 'source' in chant

        print(f"✅ Available Vedic chants: {len(chants)}")

    def test_format_sanskrit_shloka(self):
        """Test Sanskrit shloka formatting."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()

        # Test with different shlokas
        shloka_keys = ['karmanye_vadhikaraste', 'om_bhur_bhuva', 'asato_ma_sadgamaya']

        for key in shloka_keys:
            ssml = service.format_sanskrit_shloka(
                key,
                include_meaning=True,
                voice_gender='male',
                chanting_style='traditional'
            )
            assert ssml is not None
            assert '<speak>' in ssml
            print(f"   ✓ {key}: {len(ssml)} chars")

        print("✅ Sanskrit shloka formatting working")

    def test_generate_vedic_chant(self):
        """Test Vedic chant generation."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()

        chant_keys = ['gayatri', 'mahamrityunjaya', 'shanti_mantra_1']

        for key in chant_keys:
            ssml = service.generate_vedic_chant(
                key,
                repetitions=1,
                include_meaning=True,
                voice_gender='male'
            )
            assert ssml is not None
            assert '<speak>' in ssml
            print(f"   ✓ {key}: {len(ssml)} chars")

        print("✅ Vedic chant generation working")

    def test_format_with_perfect_pronunciation(self):
        """Test perfect pronunciation formatting."""
        from backend.services.kiaan_divine_voice import (
            get_divine_voice_service, ConversationPhase, EmotionalState
        )

        service = get_divine_voice_service()

        text = "Namaste dear one. May peace and wisdom guide your path today."

        # Test with different configurations
        configs = [
            {'language': 'hi', 'personality': 'wise_sage'},
            {'language': 'ta', 'personality': 'nurturing_mother'},
            {'accent': 'delhi', 'personality': 'gentle_friend'},
        ]

        for config in configs:
            ssml = service.format_with_perfect_pronunciation(
                text=text,
                phase=ConversationPhase.GREETING,
                emotional_state=EmotionalState.PEACEFUL,
                voice_gender='female',
                **config
            )
            assert ssml is not None
            assert '<speak>' in ssml
            print(f"   ✓ Config {config}: {len(ssml)} chars")

        print("✅ Perfect pronunciation formatting working")

    def test_language_greeting(self):
        """Test language greeting retrieval."""
        from backend.services.kiaan_divine_voice import get_divine_voice_service

        service = get_divine_voice_service()

        language_codes = ['hi', 'ta', 'te', 'bn', 'gu', 'mr']

        for code in language_codes:
            greeting = service.get_language_greeting(code)
            assert greeting is not None
            assert len(greeting) > 5
            print(f"   ✓ {code}: {greeting}")

        print("✅ Language greetings working")


def run_all_tests():
    """Run all tests and print summary."""
    print("\n" + "=" * 70)
    print("KIAAN VOICE COMPREHENSIVE TEST SUITE")
    print("=" * 70 + "\n")

    test_classes = [
        TestSanskritPronunciation,
        TestMultiLanguageSupport,
        TestRegionalAccents,
        TestNaturalVoiceFeatures,
        TestVedicChanting,
        TestHumanVoiceQualities,
        TestIntegrationFunction,
        TestDivineVoiceServiceIntegration,
    ]

    passed = 0
    failed = 0
    errors = []

    for test_class in test_classes:
        print(f"\n{'=' * 60}")
        print(f"Testing: {test_class.__name__}")
        print('=' * 60)

        instance = test_class()
        methods = [m for m in dir(instance) if m.startswith('test_')]

        for method in methods:
            try:
                print(f"\n▶ {method}")
                getattr(instance, method)()
                passed += 1
            except Exception as e:
                failed += 1
                errors.append((test_class.__name__, method, str(e)))
                print(f"❌ FAILED: {e}")

    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total:  {passed + failed}")

    if errors:
        print("\nFailed Tests:")
        for class_name, method, error in errors:
            print(f"  - {class_name}.{method}: {error}")

    print("\n" + "=" * 70)
    if failed == 0:
        print("🎉 ALL TESTS PASSED! KIAAN VOICE FEATURES FULLY IMPLEMENTED!")
    else:
        print(f"⚠️  {failed} tests failed - review required")
    print("=" * 70 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
