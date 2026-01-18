"""
Community Wisdom Circles API Routes

Endpoints for anonymous peer support:
- Circle management (create, list, join, leave)
- Post creation with AI moderation
- Reactions (hearts, compassion badges)
- Reporting and moderation
- Crisis detection and escalation

Quantum Enhancement #5: Community Wisdom Circles
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum

from backend.services.anonymization_service import (
    get_anonymization_service,
    AnonymousIdentity,
    AnonymizationService
)
from backend.services.moderation_service import (
    get_moderation_service,
    ModerationService,
    ModerationResult,
    ModerationReport
)

router = APIRouter(prefix="/api/community", tags=["Community Wisdom Circles"])


# ============================================================================
# Models
# ============================================================================

class CircleCategory(str, Enum):
    """Circle categories"""
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    STRESS = "stress"
    RELATIONSHIPS = "relationships"
    WORK_LIFE = "work_life"
    SELF_GROWTH = "self_growth"
    GRIEF = "grief"
    GENERAL = "general"


class CirclePrivacy(str, Enum):
    """Circle privacy levels"""
    OPEN = "open"  # Anyone can join
    MODERATED = "moderated"  # Join requires approval
    INVITE_ONLY = "invite_only"  # Invite required


class ReactionType(str, Enum):
    """Reaction types"""
    HEART = "heart"  # Empathy
    HUG = "hug"  # Support
    STRENGTH = "strength"  # Encouragement
    WISDOM = "wisdom"  # Appreciation for insight


class Circle(BaseModel):
    """Community Wisdom Circle"""
    id: int
    name: str
    description: str
    category: CircleCategory
    privacy: CirclePrivacy
    member_count: int
    post_count: int
    created_at: datetime
    guidelines: List[str]
    moderator_count: int
    is_member: bool = False


class CreateCircleRequest(BaseModel):
    """Request to create a new circle"""
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    category: CircleCategory
    privacy: CirclePrivacy = CirclePrivacy.OPEN
    guidelines: Optional[List[str]] = None


class Post(BaseModel):
    """Community post"""
    id: int
    circle_id: int
    author: AnonymousIdentity
    content: str
    created_at: datetime
    reaction_counts: dict  # {"heart": 5, "hug": 3, ...}
    reply_count: int
    user_reaction: Optional[ReactionType] = None  # Current user's reaction
    compassion_badges: List[str] = []  # Badges awarded to this post
    is_pinned: bool = False


class CreatePostRequest(BaseModel):
    """Request to create a post"""
    circle_id: int
    content: str = Field(..., min_length=10, max_length=2000)


class ReportReason(str, Enum):
    """Reasons for reporting content"""
    HARASSMENT = "harassment"
    SPAM = "spam"
    HARMFUL = "harmful"
    INAPPROPRIATE = "inappropriate"
    PII = "pii"
    OTHER = "other"


class ReportPostRequest(BaseModel):
    """Request to report a post"""
    post_id: int
    reason: ReportReason
    details: Optional[str] = None


class CrisisResource(BaseModel):
    """Crisis support resource"""
    name: str
    phone: str
    url: str
    description: str
    availability: str


# ============================================================================
# Circle Management Endpoints
# ============================================================================

@router.get("/circles", response_model=List[Circle])
async def list_circles(
    category: Optional[CircleCategory] = None,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """
    List all community circles

    Query Parameters:
        - category: Filter by category (optional)
        - limit: Number of circles to return (default: 20)
        - offset: Pagination offset (default: 0)

    Returns:
        List of Circle objects
    """
    # Mock data for demonstration
    # In production, query database with filters
    mock_circles = [
        Circle(
            id=1,
            name="Anxiety Support Circle",
            description="A safe space to share experiences with anxiety and find support from others who understand.",
            category=CircleCategory.ANXIETY,
            privacy=CirclePrivacy.OPEN,
            member_count=127,
            post_count=342,
            created_at=datetime.now() - timedelta(days=90),
            guidelines=[
                "Be compassionate and non-judgmental",
                "Respect everyone's privacy and anonymity",
                "Share your experiences, not medical advice",
                "Report harmful content immediately"
            ],
            moderator_count=3,
            is_member=True
        ),
        Circle(
            id=2,
            name="Daily Mindfulness",
            description="Connect with others practicing mindfulness and meditation. Share insights and support each other's journey.",
            category=CircleCategory.SELF_GROWTH,
            privacy=CirclePrivacy.OPEN,
            member_count=89,
            post_count=156,
            created_at=datetime.now() - timedelta(days=60),
            guidelines=[
                "Share mindfulness practices and insights",
                "Be present and supportive",
                "Respect different approaches to mindfulness",
                "Keep discussions focused on wellness"
            ],
            moderator_count=2,
            is_member=False
        ),
        Circle(
            id=3,
            name="Coping with Loss",
            description="A compassionate space for those experiencing grief and loss. Share memories, feelings, and find comfort.",
            category=CircleCategory.GRIEF,
            privacy=CirclePrivacy.MODERATED,
            member_count=64,
            post_count=201,
            created_at=datetime.now() - timedelta(days=120),
            guidelines=[
                "Honor each person's unique grief journey",
                "Be gentle and compassionate",
                "Share memories and feelings safely",
                "Respect the depth of loss"
            ],
            moderator_count=4,
            is_member=False
        )
    ]

    # Filter by category if specified
    if category:
        mock_circles = [c for c in mock_circles if c.category == category]

    # Apply pagination
    return mock_circles[offset:offset + limit]


@router.get("/circles/{circle_id}", response_model=Circle)
async def get_circle(circle_id: int):
    """
    Get details of a specific circle

    Args:
        circle_id: Circle ID

    Returns:
        Circle object

    Raises:
        404: Circle not found
    """
    # Mock implementation
    if circle_id == 1:
        return Circle(
            id=1,
            name="Anxiety Support Circle",
            description="A safe space to share experiences with anxiety and find support from others who understand.",
            category=CircleCategory.ANXIETY,
            privacy=CirclePrivacy.OPEN,
            member_count=127,
            post_count=342,
            created_at=datetime.now() - timedelta(days=90),
            guidelines=[
                "Be compassionate and non-judgmental",
                "Respect everyone's privacy and anonymity",
                "Share your experiences, not medical advice",
                "Report harmful content immediately"
            ],
            moderator_count=3,
            is_member=True
        )

    raise HTTPException(status_code=404, detail="Circle not found")


@router.post("/circles", response_model=Circle, status_code=201)
async def create_circle(request: CreateCircleRequest):
    """
    Create a new community circle

    Request Body:
        CreateCircleRequest with name, description, category, privacy, guidelines

    Returns:
        Created Circle object

    Raises:
        400: Invalid request data
    """
    # In production, validate user permissions and create in database
    new_circle = Circle(
        id=999,  # Would be auto-generated by database
        name=request.name,
        description=request.description,
        category=request.category,
        privacy=request.privacy,
        member_count=1,  # Creator is first member
        post_count=0,
        created_at=datetime.now(),
        guidelines=request.guidelines or [
            "Be compassionate and respectful",
            "Maintain anonymity",
            "No medical advice",
            "Report harmful content"
        ],
        moderator_count=1,  # Creator is first moderator
        is_member=True
    )

    return new_circle


@router.post("/circles/{circle_id}/join")
async def join_circle(circle_id: int):
    """
    Join a community circle

    Args:
        circle_id: Circle ID to join

    Returns:
        Success message with anonymous identity

    Raises:
        404: Circle not found
        400: Already a member or join request pending
    """
    # Get anonymization service
    anonymization_service = get_anonymization_service()

    # Mock user_id (in production, get from auth token)
    user_id = 1

    # Generate anonymous identity for this user in this circle
    identity = anonymization_service.get_identity_for_user_in_circle(user_id, circle_id)

    return {
        'success': True,
        'message': 'Successfully joined circle',
        'anonymous_identity': identity.dict(),
        'circle_id': circle_id
    }


@router.post("/circles/{circle_id}/leave")
async def leave_circle(circle_id: int):
    """
    Leave a community circle

    Args:
        circle_id: Circle ID to leave

    Returns:
        Success message

    Raises:
        404: Circle not found
        400: Not a member
    """
    return {
        'success': True,
        'message': 'Successfully left circle',
        'circle_id': circle_id
    }


# ============================================================================
# Post Management Endpoints
# ============================================================================

@router.get("/circles/{circle_id}/posts", response_model=List[Post])
async def get_circle_posts(
    circle_id: int,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """
    Get posts in a circle

    Args:
        circle_id: Circle ID
        limit: Number of posts to return (default: 20)
        offset: Pagination offset (default: 0)

    Returns:
        List of Post objects

    Raises:
        404: Circle not found
        403: Not a member of this circle
    """
    # Mock data
    anonymization_service = get_anonymization_service()
    user_id = 123  # Mock
    identity = anonymization_service.get_identity_for_user_in_circle(user_id, circle_id)

    mock_posts = [
        Post(
            id=1,
            circle_id=circle_id,
            author=identity,
            content="I've been feeling really anxious lately, especially in the mornings. Does anyone else experience this? How do you cope?",
            created_at=datetime.now() - timedelta(hours=2),
            reaction_counts={'heart': 8, 'hug': 5, 'strength': 3},
            reply_count=12,
            user_reaction=None,
            compassion_badges=['wisdom'],
            is_pinned=False
        ),
        Post(
            id=2,
            circle_id=circle_id,
            author=identity,
            content="Just wanted to share a small victory - I completed my morning meditation routine for 7 days straight! Feeling proud and grateful for this community's support.",
            created_at=datetime.now() - timedelta(hours=5),
            reaction_counts={'heart': 15, 'strength': 10},
            reply_count=8,
            user_reaction=ReactionType.HEART,
            compassion_badges=['strength', 'heart'],
            is_pinned=True
        )
    ]

    return mock_posts[offset:offset + limit]


@router.post("/posts", response_model=dict, status_code=201)
async def create_post(
    request: CreatePostRequest,
    moderation_service: ModerationService = Depends(get_moderation_service),
    anonymization_service: AnonymizationService = Depends(get_anonymization_service)
):
    """
    Create a new post in a circle (with AI moderation)

    Request Body:
        CreatePostRequest with circle_id and content

    Returns:
        Dict with:
            - success: bool
            - post: Post object (if approved)
            - moderation: ModerationReport
            - crisis_resources: List[CrisisResource] (if crisis detected)

    Raises:
        400: Invalid request or content rejected
        403: Not a member of circle
    """
    # Mock user_id (in production, get from auth token)
    user_id = 1

    # Get anonymous identity for this circle
    identity = anonymization_service.get_identity_for_user_in_circle(user_id, request.circle_id)

    # Moderate content
    moderation_report = await moderation_service.moderate_content(request.content)

    # Handle crisis detection
    if moderation_report.crisis_detected:
        return {
            'success': False,
            'moderation': moderation_report.dict(),
            'crisis_detected': True,
            'crisis_resources': await get_crisis_resources(),
            'message': 'Crisis keywords detected. Please reach out for immediate support.'
        }

    # Handle rejection
    if moderation_report.result == ModerationResult.REJECTED:
        raise HTTPException(
            status_code=400,
            detail={
                'error': 'Content rejected by moderation',
                'reasons': moderation_report.reasons,
                'suggestions': moderation_report.suggestions
            }
        )

    # Handle flagged (pending review)
    if moderation_report.result == ModerationResult.FLAGGED:
        return {
            'success': True,
            'pending_review': True,
            'moderation': moderation_report.dict(),
            'message': 'Your post is under review and will appear once approved.'
        }

    # Approved - create post
    new_post = Post(
        id=999,  # Would be auto-generated
        circle_id=request.circle_id,
        author=identity,
        content=request.content,
        created_at=datetime.now(),
        reaction_counts={},
        reply_count=0,
        user_reaction=None,
        compassion_badges=[],
        is_pinned=False
    )

    return {
        'success': True,
        'post': new_post.dict(),
        'moderation': moderation_report.dict()
    }


@router.post("/posts/{post_id}/react")
async def react_to_post(post_id: int, reaction: ReactionType = Body(...)):
    """
    Add reaction to a post

    Args:
        post_id: Post ID
        reaction: Reaction type (heart, hug, strength, wisdom)

    Returns:
        Updated reaction counts

    Raises:
        404: Post not found
    """
    return {
        'success': True,
        'post_id': post_id,
        'reaction': reaction,
        'reaction_counts': {
            'heart': 9,
            'hug': 5,
            'strength': 4,
            'wisdom': 2
        }
    }


@router.delete("/posts/{post_id}/react")
async def remove_reaction(post_id: int):
    """
    Remove reaction from a post

    Args:
        post_id: Post ID

    Returns:
        Updated reaction counts

    Raises:
        404: Post not found
    """
    return {
        'success': True,
        'post_id': post_id,
        'reaction_removed': True
    }


# ============================================================================
# Reporting & Moderation Endpoints
# ============================================================================

@router.post("/posts/{post_id}/report")
async def report_post(post_id: int, request: ReportPostRequest):
    """
    Report a post for moderation

    Args:
        post_id: Post ID to report
        request: Report reason and details

    Returns:
        Confirmation of report submission

    Raises:
        404: Post not found
    """
    return {
        'success': True,
        'message': 'Thank you for your report. Our moderation team will review this content.',
        'report_id': 12345,
        'reported_at': datetime.now()
    }


@router.post("/posts/{post_id}/compassion-badge")
async def award_compassion_badge(
    post_id: int,
    badge_type: str = Body(...),
    moderation_service: ModerationService = Depends(get_moderation_service)
):
    """
    Award a compassion badge to a post

    Args:
        post_id: Post ID
        badge_type: Badge type (heart, wisdom, strength, peace)

    Returns:
        Badge award details

    Raises:
        404: Post not found
        400: Invalid badge type or already awarded
    """
    # Mock data
    user_anonymous_id = "abc123"
    circle_id = 1

    badge_award = moderation_service.award_compassion_badge(
        user_anonymous_id, badge_type, circle_id
    )

    return {
        'success': True,
        'badge': badge_award
    }


# ============================================================================
# Crisis Support Endpoints
# ============================================================================

@router.get("/crisis-resources", response_model=List[CrisisResource])
async def get_crisis_resources():
    """
    Get crisis support resources

    Returns:
        List of crisis hotlines and resources
    """
    return [
        CrisisResource(
            name="National Suicide Prevention Lifeline (US)",
            phone="988",
            url="https://988lifeline.org",
            description="24/7 free and confidential support for people in distress",
            availability="24/7"
        ),
        CrisisResource(
            name="Crisis Text Line",
            phone="Text HOME to 741741",
            url="https://www.crisistextline.org",
            description="Free 24/7 text support for those in crisis",
            availability="24/7"
        ),
        CrisisResource(
            name="International Association for Suicide Prevention",
            phone="Varies by country",
            url="https://www.iasp.info/resources/Crisis_Centres",
            description="Directory of crisis centers worldwide",
            availability="24/7"
        ),
        CrisisResource(
            name="NAMI Helpline",
            phone="1-800-950-6264",
            url="https://www.nami.org",
            description="Mental health support and resources",
            availability="Mon-Fri 10am-10pm ET"
        )
    ]


# ============================================================================
# User Stats Endpoints (Anonymous)
# ============================================================================

@router.get("/users/{anonymous_id}/stats")
async def get_user_stats_in_circle(anonymous_id: str, circle_id: int):
    """
    Get anonymous user stats within a specific circle

    Shows only circle-specific engagement, not cross-circle data.

    Args:
        anonymous_id: Anonymous user ID
        circle_id: Circle ID

    Returns:
        Circle-specific user stats

    Raises:
        404: User or circle not found
    """
    return {
        'anonymous_id': anonymous_id,
        'circle_id': circle_id,
        'posts_count': 12,
        'reactions_received': 47,
        'compassion_badges': ['heart', 'wisdom', 'strength'],
        'member_since': datetime.now() - timedelta(days=30),
        'most_active_day': 'Tuesday'
    }
