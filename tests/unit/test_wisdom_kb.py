"""
Unit tests for the WisdomKnowledgeBase service.

Tests the wisdom verse management, sanitization, and search functionality.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models import WisdomVerse
from services.wisdom_kb import WisdomKnowledgeBase


class TestWisdomKnowledgeBaseSanitization:
    """Test text sanitization functionality."""
    
    def test_sanitize_krishna(self):
        """Test that 'Krishna' is replaced with 'the teacher'."""
        text = "Krishna taught Arjuna on the battlefield"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "the teacher" in result.lower()
        assert "krishna" not in result.lower()
    
    def test_sanitize_arjuna(self):
        """Test that 'Arjuna' is replaced with 'the student'."""
        text = "Arjuna was confused about his duty"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "the student" in result.lower()
        assert "arjuna" not in result.lower()
    
    def test_sanitize_lord(self):
        """Test that 'Lord' is replaced with 'the wise one'."""
        text = "The Lord spoke to his disciple"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "the wise one" in result.lower()
        assert "lord" not in result.lower()
    
    def test_sanitize_god(self):
        """Test that 'God' is replaced with 'inner wisdom'."""
        text = "God resides within all beings"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "inner wisdom" in result.lower()
        assert "god" not in result.lower()
    
    def test_sanitize_multiple_terms(self):
        """Test sanitization of multiple religious terms."""
        text = "Lord Krishna taught Arjuna about the divine soul"
        result = WisdomKnowledgeBase.sanitize_text(text)
        assert "krishna" not in result.lower()
        assert "arjuna" not in result.lower()
        assert "lord" not in result.lower()
        assert "divine" not in result.lower()
        assert "soul" not in result.lower()
    
    def test_sanitize_preserves_case(self):
        """Test that sanitization preserves general case structure."""
        text = "The Lord Krishna spoke wisdom"
        result = WisdomKnowledgeBase.sanitize_text(text)
        # Should still be readable text
        assert len(result) > 0
        assert result[0].isupper()  # First letter should still be uppercase
    
    def test_sanitize_empty_string(self):
        """Test sanitization of empty string."""
        result = WisdomKnowledgeBase.sanitize_text("")
        assert result == ""
    
    def test_sanitize_none(self):
        """Test sanitization of None."""
        result = WisdomKnowledgeBase.sanitize_text(None)
        assert result is None


class TestWisdomKnowledgeBaseQueries:
    """Test database query functionality."""
    
    @pytest.mark.asyncio
    async def test_get_verse_by_id(self, test_db: AsyncSession):
        """Test retrieving a verse by its ID."""
        # Create a test verse
        verse = WisdomVerse(
            verse_id="1.1",
            chapter=1,
            verse_number=1,
            theme="inner_peace",
            english="Test verse",
            hindi="परीक्षण श्लोक",
            sanskrit="परीक्षा श्लोकः",
            context="Test context",
            mental_health_applications={"applications": ["anxiety"]}
        )
        test_db.add(verse)
        await test_db.commit()
        
        # Retrieve the verse
        result = await WisdomKnowledgeBase.get_verse_by_id(test_db, "1.1")
        
        assert result is not None
        assert result.verse_id == "1.1"
        assert result.theme == "inner_peace"
    
    @pytest.mark.asyncio
    async def test_get_verse_by_id_not_found(self, test_db: AsyncSession):
        """Test retrieving a non-existent verse."""
        result = await WisdomKnowledgeBase.get_verse_by_id(test_db, "99.99")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_verses_by_theme(self, test_db: AsyncSession):
        """Test retrieving verses by theme."""
        # Create test verses
        verse1 = WisdomVerse(
            verse_id="2.1",
            chapter=2,
            verse_number=1,
            theme="courage",
            english="Be brave",
            hindi="साहसी बनो",
            sanskrit="साहसी भव",
            context="Context about courage",
            mental_health_applications={"applications": ["fear"]}
        )
        verse2 = WisdomVerse(
            verse_id="2.2",
            chapter=2,
            verse_number=2,
            theme="courage",
            english="Face your fears",
            hindi="अपने डर का सामना करो",
            sanskrit="भयम् सम्मुखीकुरु",
            context="More about courage",
            mental_health_applications={"applications": ["fear", "anxiety"]}
        )
        verse3 = WisdomVerse(
            verse_id="3.1",
            chapter=3,
            verse_number=1,
            theme="wisdom",
            english="Seek knowledge",
            hindi="ज्ञान की तलाश करो",
            sanskrit="ज्ञानम् अन्विष्यताम्",
            context="Context about wisdom",
            mental_health_applications={"applications": ["confusion"]}
        )
        
        test_db.add_all([verse1, verse2, verse3])
        await test_db.commit()
        
        # Retrieve verses by theme
        courage_verses = await WisdomKnowledgeBase.get_verses_by_theme(test_db, "courage")
        
        assert len(courage_verses) == 2
        assert all(v.theme == "courage" for v in courage_verses)
    
    @pytest.mark.asyncio
    async def test_search_verses_by_application(self, test_db: AsyncSession):
        """Test searching verses by mental health application."""
        # Create test verses
        verse1 = WisdomVerse(
            verse_id="4.1",
            chapter=4,
            verse_number=1,
            theme="peace",
            english="Find peace within",
            hindi="भीतर शांति खोजो",
            sanskrit="अन्तः शान्तिम् अन्विष्यताम्",
            context="About inner peace",
            mental_health_applications={"applications": ["anxiety", "stress"]}
        )
        verse2 = WisdomVerse(
            verse_id="4.2",
            chapter=4,
            verse_number=2,
            theme="calm",
            english="Stay calm",
            hindi="शांत रहो",
            sanskrit="शान्तः भव",
            context="About calmness",
            mental_health_applications={"applications": ["anger", "stress"]}
        )
        
        test_db.add_all([verse1, verse2])
        await test_db.commit()
        
        # Search for anxiety-related verses
        anxiety_verses = await WisdomKnowledgeBase.search_verses_by_application(
            test_db, "anxiety"
        )
        
        assert len(anxiety_verses) == 1
        assert anxiety_verses[0].verse_id == "4.1"
        
        # Search for stress-related verses
        stress_verses = await WisdomKnowledgeBase.search_verses_by_application(
            test_db, "stress"
        )
        
        assert len(stress_verses) == 2


class TestWisdomKnowledgeBaseTextSimilarity:
    """Test text similarity computation."""
    
    def test_compute_text_similarity_identical(self):
        """Test similarity of identical texts."""
        text = "This is a test"
        similarity = WisdomKnowledgeBase.compute_text_similarity(text, text)
        assert similarity == 1.0
    
    def test_compute_text_similarity_different(self):
        """Test similarity of completely different texts."""
        text1 = "apple banana cherry"
        text2 = "dog elephant fox"
        similarity = WisdomKnowledgeBase.compute_text_similarity(text1, text2)
        assert similarity == 0.0
    
    def test_compute_text_similarity_partial(self):
        """Test similarity of partially overlapping texts."""
        text1 = "find inner peace and calm"
        text2 = "seeking inner peace today"
        similarity = WisdomKnowledgeBase.compute_text_similarity(text1, text2)
        assert 0.0 < similarity < 1.0
        assert similarity > 0.2  # Should have some overlap
    
    def test_compute_text_similarity_empty(self):
        """Test similarity with empty strings."""
        similarity = WisdomKnowledgeBase.compute_text_similarity("", "test")
        assert similarity == 0.0


class TestWisdomKnowledgeBaseSearch:
    """Test verse search functionality."""
    
    @pytest.mark.asyncio
    async def test_search_relevant_verses(self, test_db: AsyncSession):
        """Test searching for relevant verses."""
        # Create test verses
        verses = [
            WisdomVerse(
                verse_id="5.1",
                chapter=5,
                verse_number=1,
                theme="inner_peace",
                english="Find peace within yourself through meditation",
                hindi="ध्यान के माध्यम से अपने भीतर शांति पाएं",
                sanskrit="ध्यानेन अन्तः शान्तिम् लभताम्",
                context="This verse teaches about finding inner peace",
                mental_health_applications={"applications": ["anxiety", "stress"]}
            ),
            WisdomVerse(
                verse_id="5.2",
                chapter=5,
                verse_number=2,
                theme="courage",
                english="Be courageous in the face of adversity",
                hindi="विपरीत परिस्थितियों में साहसी बनो",
                sanskrit="विपत्तौ साहसी भव",
                context="This verse encourages courage",
                mental_health_applications={"applications": ["fear"]}
            ),
            WisdomVerse(
                verse_id="5.3",
                chapter=5,
                verse_number=3,
                theme="acceptance",
                english="Accept what cannot be changed with grace",
                hindi="जो बदला नहीं जा सकता उसे स्वीकार करो",
                sanskrit="अपरिवर्तनीयम् स्वीकुरु",
                context="About acceptance and letting go",
                mental_health_applications={"applications": ["stress", "grief"]}
            ),
        ]
        
        test_db.add_all(verses)
        await test_db.commit()
        
        # Search for verses about peace
        results = await WisdomKnowledgeBase.search_relevant_verses(
            test_db, "inner peace meditation", limit=2
        )
        
        assert len(results) <= 2
        assert results[0]["verse"].verse_id == "5.1"  # Should match best
        assert results[0]["score"] > 0
    
    @pytest.mark.asyncio
    async def test_search_relevant_verses_by_theme(self, test_db: AsyncSession):
        """Test that theme matching works in search."""
        # Create a verse with specific theme
        verse = WisdomVerse(
            verse_id="6.1",
            chapter=6,
            verse_number=1,
            theme="self_control",
            english="Master your senses",
            hindi="अपनी इंद्रियों को नियंत्रित करो",
            sanskrit="इन्द्रियाणि वशीकुरु",
            context="About self-control",
            mental_health_applications={"applications": ["addiction"]}
        )
        test_db.add(verse)
        await test_db.commit()
        
        # Search with theme keyword
        results = await WisdomKnowledgeBase.search_relevant_verses(
            test_db, "self control discipline", limit=1
        )
        
        assert len(results) == 1
        assert results[0]["verse"].theme == "self_control"


class TestWisdomKnowledgeBaseFormatting:
    """Test verse formatting functionality."""
    
    def test_format_verse_response_english(self):
        """Test formatting verse in English."""
        verse = WisdomVerse(
            verse_id="7.1",
            chapter=7,
            verse_number=1,
            theme="inner_peace",
            english="Krishna taught Arjuna about peace",
            hindi="कृष्ण ने अर्जुन को शांति के बारे में सिखाया",
            sanskrit="कृष्णः अर्जुनम् शान्त्यर्थम् उपदिष्टवान्",
            context="Krishna was teaching Arjuna",
            mental_health_applications={"applications": ["anxiety"]}
        )
        
        result = WisdomKnowledgeBase.format_verse_response(verse, language="english")
        
        assert result["verse_id"] == "7.1"
        assert result["theme"] == "Inner Peace"
        assert result["language"] == "english"
        assert "krishna" not in result["text"].lower()  # Should be sanitized
        assert "arjuna" not in result["text"].lower()
        assert "krishna" not in result["context"].lower()
        assert "anxiety" in result["applications"]
    
    def test_format_verse_response_hindi(self):
        """Test formatting verse in Hindi."""
        verse = WisdomVerse(
            verse_id="7.2",
            chapter=7,
            verse_number=2,
            theme="wisdom",
            english="Seek wisdom",
            hindi="ज्ञान की तलाश करो",
            sanskrit="ज्ञानम् अन्विष्यताम्",
            context="About seeking knowledge",
            mental_health_applications={"applications": ["confusion"]}
        )
        
        result = WisdomKnowledgeBase.format_verse_response(verse, language="hindi")
        
        assert result["language"] == "hindi"
        assert result["text"] == "ज्ञान की तलाश करो"
    
    def test_format_verse_response_with_sanskrit(self):
        """Test formatting verse with Sanskrit included."""
        verse = WisdomVerse(
            verse_id="7.3",
            chapter=7,
            verse_number=3,
            theme="courage",
            english="Be brave",
            hindi="साहसी बनो",
            sanskrit="साहसी भव",
            context="About courage",
            mental_health_applications={"applications": ["fear"]}
        )
        
        result = WisdomKnowledgeBase.format_verse_response(
            verse, language="english", include_sanskrit=True
        )
        
        assert "sanskrit" in result
        assert result["sanskrit"] == "साहसी भव"
    
    def test_format_verse_response_theme_formatting(self):
        """Test that theme is properly formatted."""
        verse = WisdomVerse(
            verse_id="7.4",
            chapter=7,
            verse_number=4,
            theme="self_control",
            english="Control yourself",
            hindi="स्वयं को नियंत्रित करो",
            sanskrit="आत्मानम् वशीकुरु",
            context="About self-control",
            mental_health_applications={"applications": []}
        )
        
        result = WisdomKnowledgeBase.format_verse_response(verse)
        
        assert result["theme"] == "Self Control"  # Underscores replaced, title case
