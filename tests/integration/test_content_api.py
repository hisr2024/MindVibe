"""
Integration tests for the Content API endpoints.

Tests the content pack retrieval functionality.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models import ContentPack


class TestContentEndpoints:
    """Test the /content endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_content_pack_success(self, test_client: AsyncClient, test_db: AsyncSession):
        """Test successfully retrieving a content pack."""
        # Create a content pack
        content_pack = ContentPack(
            locale="en",
            data={
                "packs": [
                    {"id": 1, "title": "Morning Meditation"},
                    {"id": 2, "title": "Evening Reflection"}
                ]
            }
        )
        test_db.add(content_pack)
        await test_db.commit()
        
        response = await test_client.get("/content/en")
        
        assert response.status_code == 200
        data = response.json()
        assert "packs" in data
        assert len(data["packs"]) == 2
        assert data["packs"][0]["title"] == "Morning Meditation"
    
    @pytest.mark.asyncio
    async def test_get_content_pack_fallback_to_english(self, test_client: AsyncClient, test_db: AsyncSession):
        """Test that non-existent locales fall back to English."""
        # Create only English content pack
        content_pack = ContentPack(
            locale="en",
            data={
                "packs": [
                    {"id": 1, "title": "Default Pack"}
                ]
            }
        )
        test_db.add(content_pack)
        await test_db.commit()
        
        # Request a non-existent locale
        response = await test_client.get("/content/es")
        
        assert response.status_code == 200
        data = response.json()
        assert "packs" in data
        assert data["packs"][0]["title"] == "Default Pack"
    
    @pytest.mark.asyncio
    async def test_get_content_pack_not_found(self, test_client: AsyncClient):
        """Test retrieving content when no packs exist."""
        response = await test_client.get("/content/fr")
        
        assert response.status_code == 200
        data = response.json()
        assert data == {"packs": []}
    
    @pytest.mark.asyncio
    async def test_get_content_pack_specific_locale(self, test_client: AsyncClient, test_db: AsyncSession):
        """Test retrieving locale-specific content."""
        # Create English and Spanish content packs
        en_pack = ContentPack(
            locale="en",
            data={
                "packs": [
                    {"id": 1, "title": "English Pack"}
                ]
            }
        )
        es_pack = ContentPack(
            locale="es",
            data={
                "packs": [
                    {"id": 1, "title": "Paquete Español"}
                ]
            }
        )
        test_db.add_all([en_pack, es_pack])
        await test_db.commit()
        
        # Request Spanish content
        response = await test_client.get("/content/es")
        
        assert response.status_code == 200
        data = response.json()
        assert data["packs"][0]["title"] == "Paquete Español"
    
    @pytest.mark.asyncio
    async def test_get_content_pack_structure(self, test_client: AsyncClient, test_db: AsyncSession):
        """Test the structure of returned content packs."""
        content_pack = ContentPack(
            locale="en",
            data={
                "packs": [
                    {
                        "id": 1,
                        "title": "Test Pack",
                        "description": "A test content pack",
                        "items": [
                            {"type": "meditation", "duration": 300},
                            {"type": "breathing", "duration": 180}
                        ]
                    }
                ]
            }
        )
        test_db.add(content_pack)
        await test_db.commit()
        
        response = await test_client.get("/content/en")
        
        assert response.status_code == 200
        data = response.json()
        pack = data["packs"][0]
        assert pack["id"] == 1
        assert pack["title"] == "Test Pack"
        assert pack["description"] == "A test content pack"
        assert len(pack["items"]) == 2
