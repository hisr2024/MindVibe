"""
Unit tests for MindVibe models.

Tests the ORM models including User, Mood, EncryptedBlob, ContentPack, and WisdomVerse.
"""

import pytest
import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    User,
    Mood,
    EncryptedBlob,
    ContentPack,
    WisdomVerse,
    SoftDeleteMixin,
)


class TestSoftDeleteMixin:
    """Test the SoftDeleteMixin functionality."""

    def test_soft_delete(self):
        """Test that soft_delete sets deleted_at timestamp."""
        user = User(auth_uid="test-123", locale="en")
        assert user.deleted_at is None

        user.soft_delete()
        assert user.deleted_at is not None
        assert isinstance(user.deleted_at, datetime.datetime)

    def test_restore(self):
        """Test that restore clears the deleted_at timestamp."""
        user = User(auth_uid="test-123", locale="en")
        user.soft_delete()
        assert user.deleted_at is not None

        user.restore()
        assert user.deleted_at is None


class TestUserModel:
    """Test the User model."""

    @pytest.mark.asyncio
    async def test_create_user(self, test_db: AsyncSession):
        """Test creating a new user."""
        user = User(auth_uid="test-user-456", locale="en")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        assert user.id is not None
        assert user.auth_uid == "test-user-456"
        assert user.locale == "en"
        assert user.created_at is not None
        assert user.deleted_at is None

    @pytest.mark.asyncio
    async def test_user_unique_auth_uid(self, test_db: AsyncSession):
        """Test that auth_uid is unique."""
        user1 = User(auth_uid="unique-123", locale="en")
        test_db.add(user1)
        await test_db.commit()

        user2 = User(auth_uid="unique-123", locale="es")
        test_db.add(user2)

        with pytest.raises(Exception):  # Should raise integrity error
            await test_db.commit()


class TestMoodModel:
    """Test the Mood model."""

    @pytest.mark.asyncio
    async def test_create_mood(self, test_db: AsyncSession):
        """Test creating a mood entry."""
        # Create a user first
        user = User(auth_uid="mood-test-user", locale="en")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create a mood
        mood = Mood(
            user_id=user.id,
            score=2,
            tags={"tags": ["happy", "energetic"]},
            note="Feeling great today!",
        )
        test_db.add(mood)
        await test_db.commit()
        await test_db.refresh(mood)

        assert mood.id is not None
        assert mood.user_id == user.id
        assert mood.score == 2
        assert mood.tags == {"tags": ["happy", "energetic"]}
        assert mood.note == "Feeling great today!"
        assert mood.at is not None

    @pytest.mark.asyncio
    async def test_mood_without_tags_and_note(self, test_db: AsyncSession):
        """Test creating a mood without optional fields."""
        user = User(auth_uid="mood-test-user-2", locale="en")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        mood = Mood(user_id=user.id, score=-1)
        test_db.add(mood)
        await test_db.commit()
        await test_db.refresh(mood)

        assert mood.id is not None
        assert mood.score == -1
        assert mood.tags is None
        assert mood.note is None


class TestEncryptedBlobModel:
    """Test the EncryptedBlob model."""

    @pytest.mark.asyncio
    async def test_create_encrypted_blob(self, test_db: AsyncSession):
        """Test creating an encrypted blob."""
        user = User(auth_uid="blob-test-user", locale="en")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        blob = EncryptedBlob(user_id=user.id, blob_json='{"encrypted": "data"}')
        test_db.add(blob)
        await test_db.commit()
        await test_db.refresh(blob)

        assert blob.id is not None
        assert blob.user_id == user.id
        assert blob.blob_json == '{"encrypted": "data"}'
        assert blob.created_at is not None


class TestContentPackModel:
    """Test the ContentPack model."""

    @pytest.mark.asyncio
    async def test_create_content_pack(self, test_db: AsyncSession):
        """Test creating a content pack."""
        content_pack = ContentPack(
            locale="en", data={"packs": [{"id": 1, "title": "Test Pack"}]}
        )
        test_db.add(content_pack)
        await test_db.commit()
        await test_db.refresh(content_pack)

        assert content_pack.id is not None
        assert content_pack.locale == "en"
        assert content_pack.data == {"packs": [{"id": 1, "title": "Test Pack"}]}
        assert content_pack.created_at is not None


class TestWisdomVerseModel:
    """Test the WisdomVerse model."""

    @pytest.mark.asyncio
    async def test_create_wisdom_verse(self, test_db: AsyncSession):
        """Test creating a wisdom verse."""
        verse = WisdomVerse(
            verse_id="1.1",
            chapter=1,
            verse_number=1,
            theme="inner_peace",
            english="Test verse in English",
            hindi="Test verse in Hindi",
            sanskrit="Test verse in Sanskrit",
            context="Test context for the verse",
            mental_health_applications={"applications": ["anxiety", "stress"]},
        )
        test_db.add(verse)
        await test_db.commit()
        await test_db.refresh(verse)

        assert verse.id is not None
        assert verse.verse_id == "1.1"
        assert verse.chapter == 1
        assert verse.verse_number == 1
        assert verse.theme == "inner_peace"
        assert verse.english == "Test verse in English"
        assert verse.mental_health_applications == {
            "applications": ["anxiety", "stress"]
        }

    @pytest.mark.asyncio
    async def test_wisdom_verse_unique_verse_id(self, test_db: AsyncSession):
        """Test that verse_id is unique."""
        verse1 = WisdomVerse(
            verse_id="2.1",
            chapter=2,
            verse_number=1,
            theme="courage",
            english="First verse",
            hindi="पहला श्लोक",
            sanskrit="प्रथमः श्लोकः",
            context="Context 1",
            mental_health_applications={"applications": []},
        )
        test_db.add(verse1)
        await test_db.commit()

        verse2 = WisdomVerse(
            verse_id="2.1",  # Duplicate verse_id
            chapter=2,
            verse_number=1,
            theme="wisdom",
            english="Second verse",
            hindi="दूसरा श्लोक",
            sanskrit="द्वितीयः श्लोकः",
            context="Context 2",
            mental_health_applications={"applications": []},
        )
        test_db.add(verse2)

        with pytest.raises(Exception):  # Should raise integrity error
            await test_db.commit()
