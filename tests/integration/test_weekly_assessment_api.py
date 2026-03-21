"""
Integration tests for the KIAAN Weekly Assessment API endpoints.

Tests the structured weekly wellness evaluation with Gita-wisdom
integration and personalized recommendations.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import User
from tests.conftest import auth_headers_for


class TestWeeklyAssessmentQuestions:
    """Test the GET /api/kiaan/weekly-assessment/questions endpoint."""

    @pytest.mark.asyncio
    async def test_get_questions_returns_all_six(
        self, test_client: AsyncClient
    ):
        """Verify that the questions endpoint returns all 6 assessment questions."""
        response = await test_client.get(
            "/api/kiaan/weekly-assessment/questions"
        )
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) == 6

    @pytest.mark.asyncio
    async def test_get_questions_structure(self, test_client: AsyncClient):
        """Verify each question has required fields and valid types."""
        response = await test_client.get(
            "/api/kiaan/weekly-assessment/questions"
        )
        data = response.json()
        for q in data["questions"]:
            assert "id" in q
            assert "question" in q
            assert "type" in q
            assert q["type"] in ("scale", "multiselect")
            if q["type"] == "scale":
                assert "scale" in q
                assert q["scale"]["min"] == 1
                assert q["scale"]["max"] == 10
            elif q["type"] == "multiselect":
                assert "options" in q
                assert len(q["options"]) > 0

    @pytest.mark.asyncio
    async def test_get_questions_ids(self, test_client: AsyncClient):
        """Verify expected question IDs are present."""
        response = await test_client.get(
            "/api/kiaan/weekly-assessment/questions"
        )
        data = response.json()
        ids = {q["id"] for q in data["questions"]}
        expected = {
            "emotional_state",
            "stress_level",
            "sleep_quality",
            "social_connection",
            "purpose_meaning",
            "challenges_faced",
        }
        assert ids == expected


class TestWeeklyAssessmentSubmit:
    """Test the POST /api/kiaan/weekly-assessment/submit endpoint."""

    @pytest.mark.asyncio
    async def test_submit_success(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Submit a complete assessment and verify scores are calculated."""
        user = User(
            auth_uid="assessment-user-1",
            email="assess1@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        responses = {
            "emotional_state": 7,
            "stress_level": 4,
            "sleep_quality": 8,
            "social_connection": 6,
            "purpose_meaning": 9,
            "challenges_faced": ["Stress"],
        }

        response = await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={"responses": responses},
            headers=auth_headers_for(user.id),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True
        assert data["assessment_type"] == "weekly"
        assert "calculated_scores" in data
        assert "recommended_focus_areas" in data
        assert "overall_score" in data
        assert isinstance(data["overall_score"], int)
        assert 0 <= data["overall_score"] <= 100

    @pytest.mark.asyncio
    async def test_submit_unauthenticated(self, test_client: AsyncClient):
        """Unauthenticated users should receive 401."""
        response = await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={
                "responses": {
                    "emotional_state": 5,
                    "stress_level": 5,
                    "sleep_quality": 5,
                    "social_connection": 5,
                    "purpose_meaning": 5,
                }
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_submit_invalid_question_ids(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Submitting unknown question IDs should return 400."""
        user = User(
            auth_uid="assessment-user-invalid",
            email="assess_invalid@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        response = await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={"responses": {"nonexistent_question": 5}},
            headers=auth_headers_for(user.id),
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_score_calculation_stress_inverted(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Verify stress score is inverted (10 - stress_level)."""
        user = User(
            auth_uid="assessment-user-stress",
            email="stress@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        responses = {
            "emotional_state": 5,
            "stress_level": 8,
            "sleep_quality": 5,
            "social_connection": 5,
            "purpose_meaning": 5,
        }

        response = await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={"responses": responses},
            headers=auth_headers_for(user.id),
        )
        data = response.json()
        scores = data["calculated_scores"]
        assert scores["stress_management"] == 2  # 10 - 8

    @pytest.mark.asyncio
    async def test_focus_areas_for_low_scores(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """Low scores (<5) should trigger relevant focus area recommendations."""
        user = User(
            auth_uid="assessment-user-focus",
            email="focus@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        responses = {
            "emotional_state": 3,
            "stress_level": 9,
            "sleep_quality": 2,
            "social_connection": 7,
            "purpose_meaning": 7,
        }

        response = await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={"responses": responses},
            headers=auth_headers_for(user.id),
        )
        data = response.json()
        focus = data["recommended_focus_areas"]
        assert len(focus) > 0
        assert len(focus) <= 3


class TestWeeklyAssessmentLatest:
    """Test the GET /api/kiaan/weekly-assessment/latest endpoint."""

    @pytest.mark.asyncio
    async def test_latest_no_assessments(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """When no assessments exist, endpoint should return null."""
        user = User(
            auth_uid="assessment-user-empty",
            email="empty@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        response = await test_client.get(
            "/api/kiaan/weekly-assessment/latest",
            headers=auth_headers_for(user.id),
        )
        assert response.status_code == 200
        assert response.json() is None

    @pytest.mark.asyncio
    async def test_latest_returns_most_recent(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """After submitting an assessment, latest returns it."""
        user = User(
            auth_uid="assessment-user-latest",
            email="latest@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        # Submit assessment
        await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={
                "responses": {
                    "emotional_state": 6,
                    "stress_level": 3,
                    "sleep_quality": 7,
                    "social_connection": 8,
                    "purpose_meaning": 5,
                }
            },
            headers=headers,
        )

        # Fetch latest
        response = await test_client.get(
            "/api/kiaan/weekly-assessment/latest",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert data["completed"] is True
        assert data["assessment_type"] == "weekly"

    @pytest.mark.asyncio
    async def test_latest_unauthenticated(self, test_client: AsyncClient):
        """Unauthenticated users should receive 401."""
        response = await test_client.get(
            "/api/kiaan/weekly-assessment/latest"
        )
        assert response.status_code == 401


class TestWeeklyAssessmentHistory:
    """Test the GET /api/kiaan/weekly-assessment/history endpoint."""

    @pytest.mark.asyncio
    async def test_history_empty(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """When no assessments exist, history returns empty list."""
        user = User(
            auth_uid="assessment-user-hist-empty",
            email="histempty@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        response = await test_client.get(
            "/api/kiaan/weekly-assessment/history",
            headers=auth_headers_for(user.id),
        )
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_history_returns_assessments(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """After submitting assessments, history returns them."""
        user = User(
            auth_uid="assessment-user-hist",
            email="hist@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        # Submit two assessments
        base_responses = {
            "emotional_state": 5,
            "stress_level": 5,
            "sleep_quality": 5,
            "social_connection": 5,
            "purpose_meaning": 5,
        }
        await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={"responses": base_responses},
            headers=headers,
        )
        await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={"responses": {**base_responses, "emotional_state": 8}},
            headers=headers,
        )

        response = await test_client.get(
            "/api/kiaan/weekly-assessment/history",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_history_respects_limit(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """The limit query parameter should cap the number of results."""
        user = User(
            auth_uid="assessment-user-hist-limit",
            email="histlimit@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        headers = auth_headers_for(user.id)

        base_responses = {
            "emotional_state": 5,
            "stress_level": 5,
            "sleep_quality": 5,
            "social_connection": 5,
            "purpose_meaning": 5,
        }
        for i in range(3):
            await test_client.post(
                "/api/kiaan/weekly-assessment/submit",
                json={"responses": {**base_responses, "emotional_state": i + 1}},
                headers=headers,
            )

        response = await test_client.get(
            "/api/kiaan/weekly-assessment/history?limit=2",
            headers=headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 2

    @pytest.mark.asyncio
    async def test_history_unauthenticated(self, test_client: AsyncClient):
        """Unauthenticated users should receive 401."""
        response = await test_client.get(
            "/api/kiaan/weekly-assessment/history"
        )
        assert response.status_code == 401


class TestWeeklyAssessmentUserIsolation:
    """Verify that users cannot see each other's assessments."""

    @pytest.mark.asyncio
    async def test_user_isolation(
        self, test_client: AsyncClient, test_db: AsyncSession
    ):
        """User A's assessment should not appear in User B's latest/history."""
        user_a = User(
            auth_uid="assess-iso-a",
            email="iso_a@example.com",
            hashed_password="hashed",
            locale="en",
        )
        user_b = User(
            auth_uid="assess-iso-b",
            email="iso_b@example.com",
            hashed_password="hashed",
            locale="en",
        )
        test_db.add_all([user_a, user_b])
        await test_db.commit()
        await test_db.refresh(user_a)
        await test_db.refresh(user_b)

        # User A submits an assessment
        await test_client.post(
            "/api/kiaan/weekly-assessment/submit",
            json={
                "responses": {
                    "emotional_state": 9,
                    "stress_level": 1,
                    "sleep_quality": 9,
                    "social_connection": 9,
                    "purpose_meaning": 9,
                }
            },
            headers=auth_headers_for(user_a.id),
        )

        # User B should see no assessments
        latest_resp = await test_client.get(
            "/api/kiaan/weekly-assessment/latest",
            headers=auth_headers_for(user_b.id),
        )
        assert latest_resp.json() is None

        history_resp = await test_client.get(
            "/api/kiaan/weekly-assessment/history",
            headers=auth_headers_for(user_b.id),
        )
        assert history_resp.json() == []
