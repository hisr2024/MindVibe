"""
Unit tests for Wisdom Journey Service.

Tests the core business logic for AI-powered personalized wisdom journeys.
"""

import datetime
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    WisdomJourney,
    JourneyStep,
    JourneyStatus,
    GitaVerse,
    Mood,
    JournalEntry,
)
from backend.services.wisdom_journey_service import WisdomJourneyService


@pytest.fixture
def wisdom_journey_service():
    """Fixture for WisdomJourneyService."""
    return WisdomJourneyService()


@pytest.fixture
async def sample_user_id():
    """Fixture for sample user ID."""
    return str(uuid.uuid4())


@pytest.fixture
async def sample_gita_verses(test_db: AsyncSession):
    """Fixture for sample Gita verses."""
    verses = [
        GitaVerse(
            id=1,
            chapter=2,
            verse=47,
            sanskrit="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
            transliteration="karmaṇy-evādhikāras te mā phaleṣhu kadāchana",
            hindi="तेरा कर्म करने में ही अधिकार है, फलों में कभी नहीं",
            english="You have the right to work only, but never to its fruits.",
            principle="Detachment from results",
            theme="karma_yoga",
        ),
        GitaVerse(
            id=2,
            chapter=6,
            verse=35,
            sanskrit="असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
            transliteration="asanśhayaṁ mahā-bāho mano durnigrahaṁ chalam",
            hindi="मन चंचल और कठिन है, लेकिन अभ्यास और वैराग्य से इसे वश में किया जा सकता है",
            english="The mind is restless, turbulent, strong and unyielding.",
            principle="Mind control through practice",
            theme="dhyana_yoga",
        ),
        GitaVerse(
            id=3,
            chapter=12,
            verse=13,
            sanskrit="अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
            transliteration="adveṣhṭā sarva-bhūtānāṁ maitraḥ karuṇa eva cha",
            hindi="जो सभी प्राणियों से द्वेष नहीं करता और सबका मित्र है",
            english="One who is free from envy and is a well-wisher to all.",
            principle="Universal compassion",
            theme="bhakti_yoga",
        ),
    ]

    for verse in verses:
        test_db.add(verse)

    await test_db.commit()

    return verses


@pytest.fixture
async def sample_user_moods(test_db: AsyncSession, sample_user_id):
    """Fixture for sample user moods."""
    moods = [
        Mood(
            user_id=sample_user_id,
            score=4,
            tags={"primary": "Reflective", "emotions": ["anxious", "thoughtful"]},
            at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=1),
        ),
        Mood(
            user_id=sample_user_id,
            score=5,
            tags={"primary": "Calm", "emotions": ["calm", "peaceful"]},
            at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=2),
        ),
        Mood(
            user_id=sample_user_id,
            score=6,
            tags={"primary": "Hopeful", "emotions": ["hopeful", "optimistic"]},
            at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=3),
        ),
    ]

    for mood in moods:
        test_db.add(mood)

    await test_db.commit()

    return moods


@pytest.mark.asyncio
async def test_generate_personalized_journey_creates_journey(
    wisdom_journey_service, test_db, sample_user_id, sample_gita_verses
):
    """Test that generate_personalized_journey creates a journey."""
    # Mock the recommender to return predictable verses
    with patch.object(
        wisdom_journey_service.recommender, "select_journey_verses"
    ) as mock_select:
        mock_select.return_value = [1, 2, 3]  # Return verse IDs

        # Generate journey
        journey = await wisdom_journey_service.generate_personalized_journey(
            db=test_db, user_id=sample_user_id, duration_days=3
        )

        # Assertions
        assert journey is not None
        assert journey.user_id == sample_user_id
        assert journey.total_steps == 3
        assert journey.current_step == 0
        assert journey.status == JourneyStatus.ACTIVE
        assert journey.progress_percentage == 0
        assert journey.recommended_by == "ai"

        # Verify steps were created
        steps = await wisdom_journey_service.get_journey_steps(test_db, journey.id)
        assert len(steps) == 3
        assert steps[0].step_number == 1
        assert steps[1].step_number == 2
        assert steps[2].step_number == 3


@pytest.mark.asyncio
async def test_get_active_journey_returns_active_journey(
    wisdom_journey_service, test_db, sample_user_id
):
    """Test that get_active_journey returns the active journey."""
    # Create an active journey
    journey = WisdomJourney(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        title="Test Journey",
        description="Test Description",
        total_steps=7,
        current_step=2,
        status=JourneyStatus.ACTIVE,
        progress_percentage=28,
    )
    test_db.add(journey)
    await test_db.commit()

    # Get active journey
    active_journey = await wisdom_journey_service.get_active_journey(
        test_db, sample_user_id
    )

    # Assertions
    assert active_journey is not None
    assert active_journey.id == journey.id
    assert active_journey.status == JourneyStatus.ACTIVE


@pytest.mark.asyncio
async def test_get_active_journey_returns_none_when_no_active(
    wisdom_journey_service, test_db, sample_user_id
):
    """Test that get_active_journey returns None when no active journey."""
    active_journey = await wisdom_journey_service.get_active_journey(
        test_db, sample_user_id
    )

    assert active_journey is None


@pytest.mark.asyncio
async def test_mark_step_complete_updates_progress(
    wisdom_journey_service, test_db, sample_user_id, sample_gita_verses
):
    """Test that mark_step_complete updates journey progress."""
    # Create journey with steps
    journey = WisdomJourney(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        title="Test Journey",
        description="Test Description",
        total_steps=3,
        current_step=0,
        status=JourneyStatus.ACTIVE,
        progress_percentage=0,
    )
    test_db.add(journey)

    step1 = JourneyStep(
        id=str(uuid.uuid4()),
        journey_id=journey.id,
        step_number=1,
        verse_id=1,
        reflection_prompt="Test prompt",
        completed=False,
    )
    test_db.add(step1)
    await test_db.commit()

    # Mark step 1 complete
    updated_step = await wisdom_journey_service.mark_step_complete(
        db=test_db,
        journey_id=journey.id,
        step_number=1,
        time_spent_seconds=120,
        user_rating=5,
    )

    # Assertions
    assert updated_step is not None
    assert updated_step.completed is True
    assert updated_step.time_spent_seconds == 120
    assert updated_step.user_rating == 5
    assert updated_step.completed_at is not None

    # Verify journey progress updated
    await test_db.refresh(journey)
    assert journey.current_step == 1
    assert journey.progress_percentage == 33  # 1/3 = 33%


@pytest.mark.asyncio
async def test_mark_step_complete_completes_journey_on_last_step(
    wisdom_journey_service, test_db, sample_user_id, sample_gita_verses
):
    """Test that marking last step complete sets journey status to completed."""
    # Create journey with 3 steps
    journey = WisdomJourney(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        title="Test Journey",
        description="Test Description",
        total_steps=3,
        current_step=2,  # Already at step 2
        status=JourneyStatus.ACTIVE,
        progress_percentage=66,
    )
    test_db.add(journey)

    step3 = JourneyStep(
        id=str(uuid.uuid4()),
        journey_id=journey.id,
        step_number=3,
        verse_id=3,
        reflection_prompt="Final step",
        completed=False,
    )
    test_db.add(step3)
    await test_db.commit()

    # Mark final step complete
    await wisdom_journey_service.mark_step_complete(
        db=test_db, journey_id=journey.id, step_number=3
    )

    # Verify journey completed
    await test_db.refresh(journey)
    assert journey.status == JourneyStatus.COMPLETED
    assert journey.completed_at is not None
    assert journey.progress_percentage == 100


@pytest.mark.asyncio
async def test_pause_journey_sets_status_to_paused(
    wisdom_journey_service, test_db, sample_user_id
):
    """Test that pause_journey sets journey status to paused."""
    # Create active journey
    journey = WisdomJourney(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        title="Test Journey",
        description="Test Description",
        total_steps=7,
        current_step=2,
        status=JourneyStatus.ACTIVE,
        progress_percentage=28,
    )
    test_db.add(journey)
    await test_db.commit()

    # Pause journey
    paused_journey = await wisdom_journey_service.pause_journey(test_db, journey.id)

    # Assertions
    assert paused_journey is not None
    assert paused_journey.status == JourneyStatus.PAUSED
    assert paused_journey.paused_at is not None


@pytest.mark.asyncio
async def test_resume_journey_sets_status_to_active(
    wisdom_journey_service, test_db, sample_user_id
):
    """Test that resume_journey sets journey status back to active."""
    # Create paused journey
    journey = WisdomJourney(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        title="Test Journey",
        description="Test Description",
        total_steps=7,
        current_step=2,
        status=JourneyStatus.PAUSED,
        progress_percentage=28,
        paused_at=datetime.datetime.now(datetime.UTC),
    )
    test_db.add(journey)
    await test_db.commit()

    # Resume journey
    resumed_journey = await wisdom_journey_service.resume_journey(
        test_db, journey.id
    )

    # Assertions
    assert resumed_journey is not None
    assert resumed_journey.status == JourneyStatus.ACTIVE
    assert resumed_journey.paused_at is None


@pytest.mark.asyncio
async def test_delete_journey_soft_deletes_journey_and_steps(
    wisdom_journey_service, test_db, sample_user_id, sample_gita_verses
):
    """Test that delete_journey soft deletes journey and its steps."""
    # Create journey with steps
    journey = WisdomJourney(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        title="Test Journey",
        description="Test Description",
        total_steps=2,
        current_step=0,
        status=JourneyStatus.ACTIVE,
        progress_percentage=0,
    )
    test_db.add(journey)

    step1 = JourneyStep(
        id=str(uuid.uuid4()),
        journey_id=journey.id,
        step_number=1,
        verse_id=1,
        reflection_prompt="Test prompt",
        completed=False,
    )
    step2 = JourneyStep(
        id=str(uuid.uuid4()),
        journey_id=journey.id,
        step_number=2,
        verse_id=2,
        reflection_prompt="Test prompt 2",
        completed=False,
    )
    test_db.add(step1)
    test_db.add(step2)
    await test_db.commit()

    # Delete journey
    success = await wisdom_journey_service.delete_journey(test_db, journey.id)

    # Assertions
    assert success is True

    # Verify journey is soft deleted
    await test_db.refresh(journey)
    assert journey.deleted_at is not None

    # Verify steps are soft deleted
    await test_db.refresh(step1)
    await test_db.refresh(step2)
    assert step1.deleted_at is not None
    assert step2.deleted_at is not None


@pytest.mark.asyncio
async def test_analyze_user_context_with_moods_and_journals(
    wisdom_journey_service, test_db, sample_user_id, sample_user_moods
):
    """Test that _analyze_user_context extracts mood and journal data."""
    now = datetime.datetime.now(datetime.UTC)
    # Create sample journal entries
    journal1 = JournalEntry(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        encrypted_content={"encrypted": True, "data": "sample"},
        tag_labels=["gratitude", "reflection"],
        client_updated_at=now - datetime.timedelta(days=5),
        created_at=now - datetime.timedelta(days=5),
    )
    journal2 = JournalEntry(
        id=str(uuid.uuid4()),
        user_id=sample_user_id,
        encrypted_content={"encrypted": True, "data": "sample2"},
        tag_labels=["anxiety", "work"],
        client_updated_at=now - datetime.timedelta(days=10),
        created_at=now - datetime.timedelta(days=10),
    )
    test_db.add(journal1)
    test_db.add(journal2)
    await test_db.commit()

    # Analyze user context
    context = await wisdom_journey_service._analyze_user_context(test_db, sample_user_id)

    # Assertions
    assert context["user_id"] == sample_user_id
    assert len(context["mood_scores"]) == 3
    assert context["mood_average"] > 0
    assert context["mood_trend"] in ["improving", "declining", "stable", "neutral"]
    assert len(context["themes"]) > 0
    assert "gratitude" in context["themes"]
    assert "anxiety" in context["themes"]


@pytest.mark.asyncio
async def test_calculate_mood_trend_improving(wisdom_journey_service):
    """Test that _calculate_mood_trend detects improving trend."""
    # Mood improving: older scores lower, recent scores higher
    mood_scores = [8.0, 7.5, 7.0, 5.0, 4.5, 4.0]  # Most recent first

    trend = wisdom_journey_service._calculate_mood_trend(mood_scores)

    assert trend == "improving"


@pytest.mark.asyncio
async def test_calculate_mood_trend_declining(wisdom_journey_service):
    """Test that _calculate_mood_trend detects declining trend."""
    # Mood declining: older scores higher, recent scores lower
    mood_scores = [4.0, 4.5, 5.0, 7.0, 7.5, 8.0]  # Most recent first

    trend = wisdom_journey_service._calculate_mood_trend(mood_scores)

    assert trend == "declining"


@pytest.mark.asyncio
async def test_calculate_mood_trend_stable(wisdom_journey_service):
    """Test that _calculate_mood_trend detects stable trend."""
    # Mood stable: consistent scores
    mood_scores = [5.0, 5.5, 5.0, 5.5, 5.0, 5.5]  # Most recent first

    trend = wisdom_journey_service._calculate_mood_trend(mood_scores)

    assert trend == "stable"
