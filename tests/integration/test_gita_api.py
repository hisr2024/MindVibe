"""Integration tests for Gita API endpoints.

Tests all Gita API endpoints including wisdom queries, verse lookup,
semantic search, theme browsing, and translation retrieval.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import GitaVerse


@pytest.fixture
async def sample_gita_verses(test_db: AsyncSession):
    """Create sample Gita verses for testing."""
    verses_data = [
        {
            "chapter": 2,
            "verse": 47,
            "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
            "hindi": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।",
            "english": "You have the right to perform your duties, but you are not entitled to the fruits of your actions.",
            "principle": "Karma Yoga",
            "theme": "action_without_attachment",
        },
        {
            "chapter": 2,
            "verse": 48,
            "sanskrit": "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।",
            "hindi": "हे धनंजय! आसक्ति को त्यागकर और सिद्धि-असिद्धि में समान बुद्धिवाला होकर योग में स्थित हुआ तू कर्मों को कर।",
            "english": "Perform your duty with an even mind in success and failure. Such equanimity is called yoga.",
            "principle": "Equanimity",
            "theme": "equanimity",
        },
        {
            "chapter": 6,
            "verse": 35,
            "sanskrit": "असंशयं महाबाहो मनो दुर्निग्रहं चलम्।",
            "hindi": "हे महाबाहो! निःसंदेह मन चंचल और कठिनता से वश में होनेवाला है।",
            "english": "The mind is restless and difficult to control, but through practice and detachment it can be mastered.",
            "principle": "Mind Control",
            "theme": "self_knowledge",
        },
        {
            "chapter": 3,
            "verse": 27,
            "sanskrit": "प्रकृतेः क्रियमाणानि गुणैः कर्माणि सर्वशः।",
            "hindi": "सम्पूर्ण कर्म सब प्रकार से प्रकृति के गुणों द्वारा किये जाते हैं।",
            "english": "All actions are performed by the modes of nature, yet the ignorant think 'I am the doer'.",
            "principle": "Nature of Action",
            "theme": "action_without_attachment",
        },
        {
            "chapter": 18,
            "verse": 66,
            "sanskrit": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।",
            "hindi": "सम्पूर्ण धर्मों को अर्थात् सम्पूर्ण कर्तव्य कर्मों को मुझमें त्यागकर तू केवल एक मुझ सर्वशक्तिमान्, सर्वाधार परमेश्वर की ही शरण में आ जा।",
            "english": "Abandon all varieties of dharma and surrender unto Me alone. I shall deliver you from all sinful reactions.",
            "principle": "Surrender",
            "theme": "self_knowledge",
        },
    ]

    verses = []
    for data in verses_data:
        verse = GitaVerse(**data)
        test_db.add(verse)
        verses.append(verse)

    await test_db.commit()
    return verses


@pytest.mark.asyncio
class TestWisdomEndpoint:
    """Test suite for /api/gita/wisdom endpoint."""

    async def test_wisdom_query_basic(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test basic wisdom query."""
        response = await test_client.post(
            "/api/gita/wisdom",
            json={
                "query": "How to perform duties without attachment?",
                "language": "english",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "guidance" in data
        assert "verses" in data
        assert "language" in data
        assert data["language"] == "english"
        # Verses may be empty if keyword matching doesn't find results
        assert isinstance(data["verses"], list)

    async def test_wisdom_query_hindi(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test wisdom query in Hindi."""
        response = await test_client.post(
            "/api/gita/wisdom",
            json={
                "query": "मुझे शांति कैसे मिलेगी?",
                "language": "hindi",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "hindi"

    async def test_wisdom_query_invalid_language(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test wisdom query with invalid language."""
        response = await test_client.post(
            "/api/gita/wisdom",
            json={
                "query": "How to find peace?",
                "language": "spanish",
            },
        )

        assert response.status_code == 422  # Pydantic validation error

    async def test_wisdom_query_short_query(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test wisdom query with too short input."""
        response = await test_client.post(
            "/api/gita/wisdom",
            json={"query": "hi"},
        )

        assert response.status_code == 422


@pytest.mark.asyncio
class TestChapterEndpoint:
    """Test suite for /api/gita/chapters/{id} endpoint."""

    async def test_get_chapter(self, test_client: AsyncClient, sample_gita_verses):
        """Test getting chapter information."""
        response = await test_client.get("/api/gita/chapters/2")

        assert response.status_code == 200
        data = response.json()
        assert data["chapter"] == 2
        assert "name" in data
        assert "summary" in data
        assert "verse_count" in data
        assert "verses" in data
        assert "themes" in data

    async def test_get_chapter_with_verses(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test that chapter includes verse summaries."""
        response = await test_client.get("/api/gita/chapters/2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["verses"]) > 0

        # Check verse summary structure
        verse = data["verses"][0]
        assert "chapter" in verse
        assert "verse" in verse
        assert "verse_id" in verse
        assert "theme" in verse
        assert "preview" in verse

    async def test_get_chapter_invalid(self, test_client: AsyncClient):
        """Test getting non-existent chapter."""
        response = await test_client.get("/api/gita/chapters/19")

        # FastAPI path validation will return 422 if out of range, but
        # our implementation returns 404 for missing chapter
        assert response.status_code in [404, 422]


@pytest.mark.asyncio
class TestVerseEndpoint:
    """Test suite for /api/gita/verses/{chapter}/{verse} endpoint."""

    async def test_get_verse(self, test_client: AsyncClient, sample_gita_verses):
        """Test getting a specific verse."""
        response = await test_client.get("/api/gita/verses/2/47")

        assert response.status_code == 200
        data = response.json()
        assert "verse" in data
        assert data["verse"]["chapter"] == 2
        assert data["verse"]["verse"] == 47
        assert "sanskrit" in data["verse"]
        assert "english" in data["verse"]
        assert "hindi" in data["verse"]
        assert "theme" in data["verse"]

    async def test_get_verse_with_related(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test that verse includes related verses."""
        response = await test_client.get("/api/gita/verses/2/47")

        assert response.status_code == 200
        data = response.json()
        assert "related_verses" in data
        # May or may not have related verses depending on themes

    async def test_get_verse_not_found(self, test_client: AsyncClient):
        """Test getting non-existent verse."""
        response = await test_client.get("/api/gita/verses/2/999")

        assert response.status_code == 404


@pytest.mark.asyncio
class TestSearchEndpoint:
    """Test suite for /api/gita/search endpoint."""

    async def test_search_basic(self, test_client: AsyncClient, sample_gita_verses):
        """Test basic search functionality."""
        response = await test_client.get("/api/gita/search?keyword=duty")

        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "results" in data
        assert "total_results" in data
        assert "page" in data
        assert "page_size" in data
        assert "has_more" in data

    async def test_search_with_theme_filter(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test search with theme filter."""
        response = await test_client.get(
            "/api/gita/search?keyword=action&theme=action_without_attachment"
        )

        assert response.status_code == 200
        data = response.json()
        assert "filters_applied" in data
        assert "theme" in data["filters_applied"]

    async def test_search_pagination(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test search with pagination."""
        response = await test_client.get(
            "/api/gita/search?keyword=the&page=1&page_size=2"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["results"]) <= 2

    async def test_search_hindi(self, test_client: AsyncClient, sample_gita_verses):
        """Test search in Hindi."""
        response = await test_client.get("/api/gita/search?keyword=कर्म&language=hindi")

        assert response.status_code == 200
        data = response.json()
        assert "filters_applied" in data
        assert data["filters_applied"]["language"] == "hindi"

    async def test_search_short_keyword(self, test_client: AsyncClient):
        """Test search with too short keyword."""
        response = await test_client.get("/api/gita/search?keyword=a")

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
class TestThemesEndpoint:
    """Test suite for /api/gita/themes endpoint."""

    async def test_list_themes(self, test_client: AsyncClient, sample_gita_verses):
        """Test listing all themes."""
        response = await test_client.get("/api/gita/themes")

        assert response.status_code == 200
        data = response.json()
        assert "themes" in data
        assert "total_themes" in data
        assert len(data["themes"]) > 0

    async def test_theme_structure(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test theme response structure."""
        response = await test_client.get("/api/gita/themes")

        assert response.status_code == 200
        data = response.json()
        theme = data["themes"][0]

        assert "theme_id" in theme
        assert "name" in theme
        assert "description" in theme
        assert "verse_count" in theme
        assert "example_verses" in theme

    async def test_theme_example_verses(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test that themes include example verses."""
        response = await test_client.get("/api/gita/themes")

        assert response.status_code == 200
        data = response.json()
        theme = data["themes"][0]

        if len(theme["example_verses"]) > 0:
            example = theme["example_verses"][0]
            assert "verse_id" in example
            assert "theme" in example
            assert "preview" in example


@pytest.mark.asyncio
class TestTranslationsEndpoint:
    """Test suite for /api/gita/translations/{verse_id} endpoint."""

    async def test_get_translations(
        self, test_client: AsyncClient, sample_gita_verses
    ):
        """Test getting all translations for a verse."""
        response = await test_client.get("/api/gita/translations/2.47")

        assert response.status_code == 200
        data = response.json()
        assert data["verse_id"] == "2.47"
        assert data["chapter"] == 2
        assert data["verse"] == 47
        assert "translations" in data
        assert "sanskrit" in data["translations"]
        assert "english" in data["translations"]
        assert "hindi" in data["translations"]

    async def test_get_translations_not_found(self, test_client: AsyncClient):
        """Test getting translations for non-existent verse."""
        response = await test_client.get("/api/gita/translations/99.99")

        assert response.status_code == 404

    async def test_get_translations_invalid_format(self, test_client: AsyncClient):
        """Test invalid verse_id format."""
        response = await test_client.get("/api/gita/translations/invalid")

        # Can be either 400 (our custom validation) or 422 (pydantic)
        assert response.status_code in [400, 422]


@pytest.mark.asyncio
class TestLanguagesEndpoint:
    """Test suite for /api/gita/languages endpoint."""

    async def test_get_languages(self, test_client: AsyncClient):
        """Test getting supported languages."""
        response = await test_client.get("/api/gita/languages")

        assert response.status_code == 200
        data = response.json()
        assert "languages" in data
        assert len(data["languages"]) == 3

        codes = [lang["code"] for lang in data["languages"]]
        assert "english" in codes
        assert "hindi" in codes
        assert "sanskrit" in codes


@pytest.mark.asyncio
class TestAPIValidation:
    """Test suite for API validation and error handling."""

    async def test_wisdom_missing_query(self, test_client: AsyncClient):
        """Test wisdom endpoint with missing query."""
        response = await test_client.post("/api/gita/wisdom", json={})

        assert response.status_code == 422

    async def test_chapter_out_of_range(self, test_client: AsyncClient):
        """Test chapter endpoint with out of range chapter."""
        response = await test_client.get("/api/gita/chapters/0")

        # Will return 404 since chapter 0 is not in CHAPTER_METADATA
        assert response.status_code == 404

    async def test_search_invalid_page_size(self, test_client: AsyncClient):
        """Test search with invalid page size."""
        response = await test_client.get("/api/gita/search?keyword=test&page_size=100")

        assert response.status_code == 422  # Exceeds max of 50
