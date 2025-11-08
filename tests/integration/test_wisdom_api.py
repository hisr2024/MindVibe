"""
Integration tests for Wisdom API endpoints

Tests the full wisdom API including verse retrieval, semantic search,
filtering, and pagination.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from models import WisdomVerse


@pytest.fixture
async def sample_verses(test_db: AsyncSession):
    """Create sample wisdom verses for testing."""
    verses_data = [
        {
            "verse_id": "2.47",
            "chapter": 2,
            "verse_number": 47,
            "theme": "action_without_attachment",
            "english": "You have the right to perform your duties, but you are not entitled to the fruits of your actions.",
            "hindi": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं।",
            "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
            "context": "This verse teaches the principle of performing one's duties without attachment to outcomes.",
            "mental_health_applications": {
                "applications": [
                    "anxiety_management",
                    "stress_reduction",
                    "emotional_resilience",
                ]
            },
        },
        {
            "verse_id": "2.48",
            "chapter": 2,
            "verse_number": 48,
            "theme": "equanimity_in_adversity",
            "english": "Perform your duty with an even mind in success and failure alike. Such equanimity is called yoga.",
            "hindi": "सफलता और असफलता में समान रहते हुए अपने कर्तव्य का पालन करो।",
            "sanskrit": "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।",
            "context": "This verse emphasizes maintaining mental balance in all circumstances.",
            "mental_health_applications": {
                "applications": [
                    "emotional_regulation",
                    "resilience_building",
                    "stress_management",
                ]
            },
        },
        {
            "verse_id": "6.35",
            "chapter": 6,
            "verse_number": 35,
            "theme": "control_of_mind",
            "english": "The mind is indeed restless and difficult to control, but it can be mastered through practice and detachment.",
            "hindi": "मन निश्चय ही चंचल है और कठिन है नियंत्रण करना, परन्तु अभ्यास से इसे वश में किया जा सकता है।",
            "sanskrit": "असंशयं महाबाहो मनो दुर्निग्रहं चलम्।",
            "context": "Recognizing the challenge of mental control while affirming it is achievable.",
            "mental_health_applications": {
                "applications": ["anxiety_management", "mindfulness", "meditation"]
            },
        },
    ]

    verses = []
    for data in verses_data:
        verse = WisdomVerse(**data)
        test_db.add(verse)
        verses.append(verse)

    await test_db.commit()
    return verses


@pytest.mark.asyncio
class TestWisdomVerseRetrieval:
    """Test suite for verse retrieval endpoints."""

    async def test_get_verse_by_id(self, test_client: AsyncClient, sample_verses):
        """Test retrieving a specific verse by ID."""
        response = await test_client.get("/api/wisdom/verses/2.47")

        assert response.status_code == 200
        data = response.json()
        assert data["verse_id"] == "2.47"
        assert data["theme"] == "Action Without Attachment"
        assert "text" in data
        assert "context" in data
        assert "applications" in data
        assert len(data["applications"]) > 0

    async def test_get_verse_by_id_with_sanskrit(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test retrieving a verse with Sanskrit included."""
        response = await test_client.get(
            "/api/wisdom/verses/2.47?include_sanskrit=true"
        )

        assert response.status_code == 200
        data = response.json()
        assert "sanskrit" in data
        assert data["sanskrit"] is not None

    async def test_get_verse_by_id_hindi(self, test_client: AsyncClient, sample_verses):
        """Test retrieving a verse in Hindi."""
        response = await test_client.get("/api/wisdom/verses/2.47?language=hindi")

        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "hindi"
        assert (
            "तुम्हारा" in data["text"] or "सफलता" in data["text"] or len(data["text"]) > 0
        )

    async def test_get_verse_not_found(self, test_client: AsyncClient, sample_verses):
        """Test retrieving a non-existent verse."""
        response = await test_client.get("/api/wisdom/verses/99.99")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_get_verse_invalid_language(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test retrieving a verse with invalid language."""
        response = await test_client.get("/api/wisdom/verses/2.47?language=invalid")

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
class TestWisdomVerseList:
    """Test suite for listing verses with filtering."""

    async def test_list_all_verses(self, test_client: AsyncClient, sample_verses):
        """Test listing all verses without filters."""
        response = await test_client.get("/api/wisdom/verses")

        assert response.status_code == 200
        data = response.json()
        assert "verses" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert "has_more" in data
        assert len(data["verses"]) <= 10  # Default limit
        assert data["total"] >= 3  # At least our sample verses

    async def test_list_verses_with_limit(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test listing verses with custom limit."""
        response = await test_client.get("/api/wisdom/verses?limit=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["verses"]) <= 2
        assert data["limit"] == 2

    async def test_list_verses_with_pagination(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test pagination of verse listing."""
        # First page
        response1 = await test_client.get("/api/wisdom/verses?limit=2&offset=0")
        assert response1.status_code == 200
        data1 = response1.json()

        # Second page
        response2 = await test_client.get("/api/wisdom/verses?limit=2&offset=2")
        assert response2.status_code == 200
        data2 = response2.json()

        # Verify different results
        if len(data1["verses"]) > 0 and len(data2["verses"]) > 0:
            assert data1["verses"][0]["verse_id"] != data2["verses"][0]["verse_id"]

    async def test_list_verses_by_theme(self, test_client: AsyncClient, sample_verses):
        """Test filtering verses by theme."""
        response = await test_client.get(
            "/api/wisdom/verses?theme=action_without_attachment"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["verses"]) >= 1
        # All returned verses should have the specified theme
        for verse in data["verses"]:
            assert "action without attachment" in verse["theme"].lower()

    async def test_list_verses_by_application(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test filtering verses by mental health application."""
        response = await test_client.get(
            "/api/wisdom/verses?application=anxiety_management"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["verses"]) >= 1
        # All returned verses should include the application
        for verse in data["verses"]:
            assert "anxiety_management" in verse["applications"]

    async def test_list_verses_hindi(self, test_client: AsyncClient, sample_verses):
        """Test listing verses in Hindi."""
        response = await test_client.get("/api/wisdom/verses?language=hindi&limit=5")

        assert response.status_code == 200
        data = response.json()
        for verse in data["verses"]:
            assert verse["language"] == "hindi"


@pytest.mark.asyncio
class TestSemanticSearch:
    """Test suite for semantic search functionality."""

    async def test_semantic_search_basic(self, test_client: AsyncClient, sample_verses):
        """Test basic semantic search."""
        response = await test_client.post(
            "/api/wisdom/search", json={"query": "how to manage anxiety"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "results" in data
        assert "total_results" in data
        assert len(data["results"]) > 0
        assert data["query"] == "how to manage anxiety"

    async def test_semantic_search_with_relevance_scores(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test that search results include relevance scores."""
        response = await test_client.post(
            "/api/wisdom/search", json={"query": "stress and anxiety"}
        )

        assert response.status_code == 200
        data = response.json()
        for result in data["results"]:
            assert "relevance_score" in result
            assert 0 <= result["relevance_score"] <= 1

    async def test_semantic_search_with_limit(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test semantic search with custom limit."""
        response = await test_client.post(
            "/api/wisdom/search?limit=2", json={"query": "mental peace"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) <= 2

    async def test_semantic_search_with_theme_filter(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test semantic search with theme filtering."""
        response = await test_client.post(
            "/api/wisdom/search?theme=control_of_mind", json={"query": "mind control"}
        )

        assert response.status_code == 200
        data = response.json()
        # Results should be from the specified theme
        if len(data["results"]) > 0:
            for result in data["results"]:
                assert "control of mind" in result["theme"].lower()

    async def test_semantic_search_with_application_filter(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test semantic search with application filtering."""
        response = await test_client.post(
            "/api/wisdom/search?application=anxiety_management",
            json={"query": "dealing with worry"},
        )

        assert response.status_code == 200
        data = response.json()
        # Results should include the specified application
        if len(data["results"]) > 0:
            for result in data["results"]:
                assert "anxiety_management" in result["applications"]

    async def test_semantic_search_empty_query(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test semantic search with empty query."""
        response = await test_client.post("/api/wisdom/search", json={"query": ""})

        assert response.status_code == 422  # Validation error

    async def test_semantic_search_short_query(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test semantic search with very short query."""
        response = await test_client.post("/api/wisdom/search", json={"query": "ab"})

        assert response.status_code == 422  # Validation error - min length is 3

    async def test_semantic_search_hindi(self, test_client: AsyncClient, sample_verses):
        """Test semantic search with Hindi language preference."""
        response = await test_client.post(
            "/api/wisdom/search?language=hindi", json={"query": "peace of mind"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "hindi"
        for result in data["results"]:
            assert result["language"] == "hindi"

    async def test_semantic_search_with_sanskrit(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test semantic search with Sanskrit included."""
        response = await test_client.post(
            "/api/wisdom/search?include_sanskrit=true", json={"query": "mental balance"}
        )

        assert response.status_code == 200
        data = response.json()
        for result in data["results"]:
            assert "sanskrit" in result


@pytest.mark.asyncio
class TestThemesAndApplications:
    """Test suite for themes and applications listing."""

    async def test_list_themes(self, test_client: AsyncClient, sample_verses):
        """Test listing all available themes."""
        response = await test_client.get("/api/wisdom/themes")

        assert response.status_code == 200
        data = response.json()
        assert "themes" in data
        assert len(data["themes"]) >= 3

        # Verify theme structure
        for theme in data["themes"]:
            assert "id" in theme
            assert "name" in theme

    async def test_list_applications(self, test_client: AsyncClient, sample_verses):
        """Test listing all available mental health applications."""
        response = await test_client.get("/api/wisdom/applications")

        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        assert "total" in data
        assert len(data["applications"]) > 0

        # Verify expected applications are present
        apps = data["applications"]
        assert "anxiety_management" in apps
        assert "stress_reduction" in apps or "stress_management" in apps


@pytest.mark.asyncio
class TestWisdomQueryEndpoint:
    """Test suite for the AI-powered wisdom query endpoint."""

    async def test_query_wisdom_basic(self, test_client: AsyncClient, sample_verses):
        """Test basic wisdom query."""
        from unittest.mock import patch

        with patch(
            "routes.wisdom_guide.generate_wisdom_response",
            return_value="This is guidance based on universal wisdom...",
        ):
            response = await test_client.post(
                "/api/wisdom/query",
                json={
                    "query": "I'm feeling anxious about my work",
                    "language": "english",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "verses" in data
        assert "language" in data
        assert len(data["verses"]) > 0

    async def test_query_wisdom_short_query(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test query with too short input."""
        response = await test_client.post("/api/wisdom/query", json={"query": "hi"})

        # Pydantic validation returns 422 for min_length constraint
        assert response.status_code == 422
        detail = str(response.json()["detail"])
        assert (
            "at least 3 characters" in detail.lower()
            or "string_too_short" in detail.lower()
        )

    async def test_query_wisdom_invalid_language(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test query with invalid language."""
        response = await test_client.post(
            "/api/wisdom/query",
            json={"query": "How to find peace?", "language": "spanish"},
        )

        assert response.status_code == 400
        assert "language" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestAPIValidation:
    """Test suite for API validation and error handling."""

    async def test_invalid_limit_too_high(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test that limit above maximum is rejected."""
        response = await test_client.get("/api/wisdom/verses?limit=1000")

        assert response.status_code == 422  # Validation error

    async def test_invalid_limit_negative(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test that negative limit is rejected."""
        response = await test_client.get("/api/wisdom/verses?limit=-1")

        assert response.status_code == 422

    async def test_invalid_offset_negative(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test that negative offset is rejected."""
        response = await test_client.get("/api/wisdom/verses?offset=-1")

        assert response.status_code == 422

    async def test_search_limit_validation(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test search endpoint limit validation."""
        response = await test_client.post(
            "/api/wisdom/search?limit=100", json={"query": "test"}
        )

        assert response.status_code == 422  # Exceeds max of 20


@pytest.mark.asyncio
class TestAPIPagination:
    """Test suite for pagination functionality."""

    async def test_pagination_has_more_true(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test has_more flag when there are more results."""
        response = await test_client.get("/api/wisdom/verses?limit=1")

        assert response.status_code == 200
        data = response.json()
        if data["total"] > 1:
            assert data["has_more"] is True

    async def test_pagination_has_more_false(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test has_more flag when all results are shown."""
        response = await test_client.get("/api/wisdom/verses?limit=100")

        assert response.status_code == 200
        data = response.json()
        assert data["has_more"] is False

    async def test_pagination_offset_beyond_total(
        self, test_client: AsyncClient, sample_verses
    ):
        """Test offset beyond total results."""
        response = await test_client.get("/api/wisdom/verses?offset=1000")

        assert response.status_code == 200
        data = response.json()
        assert len(data["verses"]) == 0
        assert data["has_more"] is False
