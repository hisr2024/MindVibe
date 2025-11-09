"""
Integration tests for the Wisdom Guide API endpoints.

Tests the universal wisdom query, theme listing, and verse retrieval functionality.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import WisdomVerse


class TestWisdomQueryEndpoint:
    """Test the /api/wisdom/query endpoint."""

    @pytest.mark.asyncio
    async def test_query_wisdom_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test successfully querying wisdom with relevant verses."""
        # Create test verses
        verse = WisdomVerse(
            verse_id="1.1",
            chapter=1,
            verse_number=1,
            theme="inner_peace",
            english="Find peace within yourself through meditation and mindfulness",
            hindi="ध्यान और सचेतनता के माध्यम से अपने भीतर शांति पाएं",
            sanskrit="ध्यानेन सचेतनेन च अन्तः शान्तिम् लभताम्",
            context="This verse teaches about finding inner peace through practice",
            mental_health_applications={"applications": ["anxiety", "stress"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "How can I find inner peace?",
                "language": "english",
                "include_sanskrit": False,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "verses" in data
        assert "language" in data
        assert data["language"] == "english"
        assert len(data["verses"]) > 0

        # Check verse structure
        verse_data = data["verses"][0]
        assert "verse_id" in verse_data
        assert "theme" in verse_data
        assert "text" in verse_data
        assert "context" in verse_data
        assert "applications" in verse_data

    @pytest.mark.asyncio
    async def test_query_wisdom_with_sanskrit(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test querying wisdom with Sanskrit included."""
        verse = WisdomVerse(
            verse_id="2.1",
            chapter=2,
            verse_number=1,
            theme="courage",
            english="Be brave and face your challenges",
            hindi="साहसी बनो और अपनी चुनौतियों का सामना करो",
            sanskrit="साहसी भव च चुनौतीनाम् सम्मुखीकुरु",
            context="About courage in difficult times",
            mental_health_applications={"applications": ["fear", "anxiety"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "I am afraid of failure",
                "language": "english",
                "include_sanskrit": True,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["verses"]) > 0

        # Check that Sanskrit is included
        verse_data = data["verses"][0]
        assert "sanskrit" in verse_data
        assert verse_data["sanskrit"] is not None

    @pytest.mark.asyncio
    async def test_query_wisdom_hindi_language(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test querying wisdom with Hindi as the response language."""
        verse = WisdomVerse(
            verse_id="3.1",
            chapter=3,
            verse_number=1,
            theme="wisdom",
            english="Seek knowledge and understanding",
            hindi="ज्ञान और समझ की तलाश करो",
            sanskrit="ज्ञानम् बोधम् च अन्विष्यताम्",
            context="About seeking wisdom",
            mental_health_applications={"applications": ["confusion"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "I am confused about my path",
                "language": "hindi",
                "include_sanskrit": False,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "hindi"

        # Verify verse is in Hindi
        verse_data = data["verses"][0]
        assert verse_data["language"] == "hindi"
        assert verse_data["text"] == "ज्ञान और समझ की तलाश करो"

    @pytest.mark.asyncio
    async def test_query_wisdom_no_results(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test querying wisdom when no verses exist."""
        response = await test_client.post(
            "/api/wisdom/query",
            json={
                "query": "Some random query with no matching verses",
                "language": "english",
            },
        )

        # Should return 404 when no verses found
        assert response.status_code == 404
        assert "No relevant wisdom verses found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_query_wisdom_invalid_language(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test querying wisdom with invalid language."""
        response = await test_client.post(
            "/api/wisdom/query", json={"query": "Some query", "language": "french"}
        )

        assert response.status_code == 400
        assert "Language must be one of" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_query_wisdom_empty_query(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test querying wisdom with empty query string."""
        response = await test_client.post(
            "/api/wisdom/query", json={"query": "", "language": "english"}
        )

        assert response.status_code == 422
        assert "at least 3 characters" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_query_wisdom_short_query(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test querying wisdom with too short query string."""
        response = await test_client.post(
            "/api/wisdom/query", json={"query": "ab", "language": "english"}
        )

        assert response.status_code == 422
        assert "at least 3 characters" in response.json()["detail"]


class TestThemesEndpoint:
    """Test the /api/wisdom/themes endpoint."""

    @pytest.mark.asyncio
    async def test_list_themes_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test listing all available wisdom themes."""
        # Create verses with different themes
        verses = [
            WisdomVerse(
                verse_id="4.1",
                chapter=4,
                verse_number=1,
                theme="inner_peace",
                english="Peace text",
                hindi="शांति पाठ",
                sanskrit="शान्तिः पाठः",
                context="Peace context",
                mental_health_applications={"applications": []},
            ),
            WisdomVerse(
                verse_id="4.2",
                chapter=4,
                verse_number=2,
                theme="courage",
                english="Courage text",
                hindi="साहस पाठ",
                sanskrit="साहसः पाठः",
                context="Courage context",
                mental_health_applications={"applications": []},
            ),
            WisdomVerse(
                verse_id="4.3",
                chapter=4,
                verse_number=3,
                theme="wisdom",
                english="Wisdom text",
                hindi="ज्ञान पाठ",
                sanskrit="ज्ञानम् पाठः",
                context="Wisdom context",
                mental_health_applications={"applications": []},
            ),
        ]

        test_db.add_all(verses)
        await test_db.commit()

        response = await test_client.get("/api/wisdom/themes")

        assert response.status_code == 200
        data = response.json()
        assert "themes" in data
        assert len(data["themes"]) == 3

        # Check theme structure
        theme = data["themes"][0]
        assert "id" in theme
        assert "name" in theme

        # Themes should be sorted
        theme_ids = [t["id"] for t in data["themes"]]
        assert theme_ids == sorted(theme_ids)

    @pytest.mark.asyncio
    async def test_list_themes_empty(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test listing themes when no verses exist."""
        response = await test_client.get("/api/wisdom/themes")

        assert response.status_code == 200
        data = response.json()
        assert "themes" in data
        assert len(data["themes"]) == 0

    @pytest.mark.asyncio
    async def test_list_themes_duplicate_themes(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test that duplicate themes are not listed."""
        # Create multiple verses with the same theme
        verses = [
            WisdomVerse(
                verse_id="5.1",
                chapter=5,
                verse_number=1,
                theme="inner_peace",
                english="Peace text 1",
                hindi="शांति पाठ 1",
                sanskrit="शान्तिः पाठः 1",
                context="Peace context 1",
                mental_health_applications={"applications": []},
            ),
            WisdomVerse(
                verse_id="5.2",
                chapter=5,
                verse_number=2,
                theme="inner_peace",
                english="Peace text 2",
                hindi="शांति पाठ 2",
                sanskrit="शान्तिः पाठः 2",
                context="Peace context 2",
                mental_health_applications={"applications": []},
            ),
        ]

        test_db.add_all(verses)
        await test_db.commit()

        response = await test_client.get("/api/wisdom/themes")

        assert response.status_code == 200
        data = response.json()
        assert len(data["themes"]) == 1  # Only one unique theme
        assert data["themes"][0]["id"] == "inner_peace"
        assert data["themes"][0]["name"] == "Inner Peace"


class TestGetVerseEndpoint:
    """Test the /api/wisdom/verses/{verse_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_verse_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test successfully retrieving a verse by ID."""
        verse = WisdomVerse(
            verse_id="6.1",
            chapter=6,
            verse_number=1,
            theme="self_control",
            english="Master your senses and mind",
            hindi="अपनी इंद्रियों और मन को नियंत्रित करो",
            sanskrit="इन्द्रियाणि मनः च वशीकुरु",
            context="About self-control and discipline",
            mental_health_applications={
                "applications": ["addiction", "impulse_control"]
            },
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.get("/api/wisdom/verses/6.1")

        assert response.status_code == 200
        data = response.json()
        assert data["verse_id"] == "6.1"
        assert data["theme"] == "Self Control"
        assert data["language"] == "english"
        assert "text" in data
        assert "context" in data
        assert "applications" in data
        assert "addiction" in data["applications"]

    @pytest.mark.asyncio
    async def test_get_verse_with_language_hindi(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test retrieving a verse in Hindi."""
        verse = WisdomVerse(
            verse_id="7.1",
            chapter=7,
            verse_number=1,
            theme="patience",
            english="Be patient in all things",
            hindi="सभी चीजों में धैर्यवान रहो",
            sanskrit="सर्वेषु धैर्यवान् भव",
            context="About patience",
            mental_health_applications={"applications": ["anger"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.get("/api/wisdom/verses/7.1?language=hindi")

        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "hindi"
        assert data["text"] == "सभी चीजों में धैर्यवान रहो"

    @pytest.mark.asyncio
    async def test_get_verse_with_sanskrit_included(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test retrieving a verse with Sanskrit included."""
        verse = WisdomVerse(
            verse_id="8.1",
            chapter=8,
            verse_number=1,
            theme="acceptance",
            english="Accept what is beyond your control",
            hindi="जो आपके नियंत्रण से बाहर है उसे स्वीकार करो",
            sanskrit="यत् नियन्त्रणात् परम् तत् स्वीकुरु",
            context="About acceptance",
            mental_health_applications={"applications": ["stress"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.get(
            "/api/wisdom/verses/8.1?language=english&include_sanskrit=true"
        )

        assert response.status_code == 200
        data = response.json()
        assert "sanskrit" in data
        assert data["sanskrit"] == "यत् नियन्त्रणात् परम् तत् स्वीकुरु"

    @pytest.mark.asyncio
    async def test_get_verse_not_found(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test retrieving a non-existent verse."""
        response = await test_client.get("/api/wisdom/verses/99.99")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_verse_invalid_language(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Test retrieving a verse with invalid language parameter."""
        verse = WisdomVerse(
            verse_id="9.1",
            chapter=9,
            verse_number=1,
            theme="gratitude",
            english="Practice gratitude daily",
            hindi="रोजाना कृतज्ञता का अभ्यास करो",
            sanskrit="प्रतिदिनम् कृतज्ञतायाः अभ्यासम् कुरु",
            context="About gratitude",
            mental_health_applications={"applications": ["depression"]},
        )
        test_db.add(verse)
        await test_db.commit()

        response = await test_client.get("/api/wisdom/verses/9.1?language=spanish")

        # Should fail validation
        assert response.status_code == 422
