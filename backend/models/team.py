"""Team and collaboration models: Team, TeamMember, TeamInvitation.

Enables multi-user team access with role-based permissions,
invitation workflows, and shared resource management.
"""

from __future__ import annotations

import datetime
import enum
import uuid

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, SoftDeleteMixin


class TeamRole(str, enum.Enum):
    """Roles within a team, ordered by access level."""

    OWNER = "owner"  # Full team control, billing, delete team
    ADMIN = "admin"  # Manage members, settings, all content access
    DEVELOPER = "developer"  # Full feature access, API keys, integrations
    MEMBER = "member"  # Standard access to shared resources
    VIEWER = "viewer"  # Read-only access to shared content


class TeamPermission(str, enum.Enum):
    """Granular permissions for team-level RBAC."""

    # Team Management
    TEAM_SETTINGS_VIEW = "team:settings:view"
    TEAM_SETTINGS_EDIT = "team:settings:edit"
    TEAM_DELETE = "team:delete"

    # Member Management
    MEMBERS_VIEW = "team:members:view"
    MEMBERS_INVITE = "team:members:invite"
    MEMBERS_REMOVE = "team:members:remove"
    MEMBERS_EDIT_ROLE = "team:members:edit_role"

    # Content Access
    JOURNEYS_VIEW = "team:journeys:view"
    JOURNEYS_CREATE = "team:journeys:create"
    JOURNEYS_EDIT = "team:journeys:edit"
    JOURNEYS_DELETE = "team:journeys:delete"

    # Analytics & Insights
    ANALYTICS_VIEW = "team:analytics:view"
    ANALYTICS_EXPORT = "team:analytics:export"

    # KIAAN / AI Access
    KIAAN_ACCESS = "team:kiaan:access"
    KIAAN_ADMIN = "team:kiaan:admin"

    # Billing & Subscription
    BILLING_VIEW = "team:billing:view"
    BILLING_MANAGE = "team:billing:manage"

    # API & Integrations
    API_KEYS_VIEW = "team:api_keys:view"
    API_KEYS_MANAGE = "team:api_keys:manage"
    INTEGRATIONS_MANAGE = "team:integrations:manage"


# Role to permission mapping for teams
TEAM_ROLE_PERMISSIONS: dict[TeamRole, list[TeamPermission]] = {
    TeamRole.OWNER: list(TeamPermission),  # All permissions
    TeamRole.ADMIN: [
        TeamPermission.TEAM_SETTINGS_VIEW,
        TeamPermission.TEAM_SETTINGS_EDIT,
        TeamPermission.MEMBERS_VIEW,
        TeamPermission.MEMBERS_INVITE,
        TeamPermission.MEMBERS_REMOVE,
        TeamPermission.MEMBERS_EDIT_ROLE,
        TeamPermission.JOURNEYS_VIEW,
        TeamPermission.JOURNEYS_CREATE,
        TeamPermission.JOURNEYS_EDIT,
        TeamPermission.JOURNEYS_DELETE,
        TeamPermission.ANALYTICS_VIEW,
        TeamPermission.ANALYTICS_EXPORT,
        TeamPermission.KIAAN_ACCESS,
        TeamPermission.KIAAN_ADMIN,
        TeamPermission.BILLING_VIEW,
        TeamPermission.API_KEYS_VIEW,
        TeamPermission.API_KEYS_MANAGE,
        TeamPermission.INTEGRATIONS_MANAGE,
    ],
    TeamRole.DEVELOPER: [
        TeamPermission.TEAM_SETTINGS_VIEW,
        TeamPermission.MEMBERS_VIEW,
        TeamPermission.JOURNEYS_VIEW,
        TeamPermission.JOURNEYS_CREATE,
        TeamPermission.JOURNEYS_EDIT,
        TeamPermission.JOURNEYS_DELETE,
        TeamPermission.ANALYTICS_VIEW,
        TeamPermission.ANALYTICS_EXPORT,
        TeamPermission.KIAAN_ACCESS,
        TeamPermission.KIAAN_ADMIN,
        TeamPermission.API_KEYS_VIEW,
        TeamPermission.API_KEYS_MANAGE,
        TeamPermission.INTEGRATIONS_MANAGE,
    ],
    TeamRole.MEMBER: [
        TeamPermission.TEAM_SETTINGS_VIEW,
        TeamPermission.MEMBERS_VIEW,
        TeamPermission.JOURNEYS_VIEW,
        TeamPermission.JOURNEYS_CREATE,
        TeamPermission.JOURNEYS_EDIT,
        TeamPermission.ANALYTICS_VIEW,
        TeamPermission.KIAAN_ACCESS,
    ],
    TeamRole.VIEWER: [
        TeamPermission.TEAM_SETTINGS_VIEW,
        TeamPermission.MEMBERS_VIEW,
        TeamPermission.JOURNEYS_VIEW,
        TeamPermission.ANALYTICS_VIEW,
    ],
}


class InvitationStatus(str, enum.Enum):
    """Status of a team invitation."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Team(SoftDeleteMixin, Base):
    """Team/workspace for collaborative access to MindVibe features."""

    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(256), index=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Owner (the user who created the team)
    owner_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Team settings
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    max_members: Mapped[int] = mapped_column(Integer, default=50)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Feature access flags
    kiaan_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    journeys_shared: Mapped[bool] = mapped_column(Boolean, default=True)
    analytics_shared: Mapped[bool] = mapped_column(Boolean, default=True)
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Subscription link (team-level subscription)
    subscription_tier: Mapped[str | None] = mapped_column(
        String(32), nullable=True, default="free"
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    members: Mapped[list[TeamMember]] = relationship(
        "TeamMember", back_populates="team", lazy="selectin"
    )
    invitations: Mapped[list[TeamInvitation]] = relationship(
        "TeamInvitation", back_populates="team", lazy="selectin"
    )


class TeamMember(SoftDeleteMixin, Base):
    """Membership record linking a user to a team with a specific role."""

    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_member"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    team_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("teams.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[TeamRole] = mapped_column(
        Enum(TeamRole, native_enum=False, length=32),
        default=TeamRole.MEMBER,
        index=True,
    )

    # Custom permissions beyond role defaults (grant or revoke)
    custom_permissions: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Member metadata
    display_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    joined_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_active_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    invited_by: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )

    # Relationships
    team: Mapped[Team] = relationship("Team", back_populates="members")


class TeamInvitation(SoftDeleteMixin, Base):
    """Invitation to join a team, sent by email or user ID."""

    __tablename__ = "team_invitations"

    id: Mapped[str] = mapped_column(
        String(255), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    team_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("teams.id", ondelete="CASCADE"), index=True
    )
    # Invitee can be identified by email or user_id
    invitee_email: Mapped[str | None] = mapped_column(
        String(256), nullable=True, index=True
    )
    invitee_user_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    # The role the invitee will receive upon acceptance
    role: Mapped[TeamRole] = mapped_column(
        Enum(TeamRole, native_enum=False, length=32),
        default=TeamRole.MEMBER,
    )
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus, native_enum=False, length=32),
        default=InvitationStatus.PENDING,
        index=True,
    )

    # Invitation token for email-based invites
    token: Mapped[str] = mapped_column(
        String(128), unique=True, index=True,
        default=lambda: str(uuid.uuid4()),
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Who sent the invitation
    invited_by: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    expires_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(timezone=True))
    accepted_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    declined_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    # Relationships
    team: Mapped[Team] = relationship("Team", back_populates="invitations")


class TeamAuditLog(Base):
    """Immutable audit log for team actions."""

    __tablename__ = "team_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    team_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("teams.id", ondelete="CASCADE"), index=True
    )
    actor_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    action: Mapped[str] = mapped_column(String(64), index=True)
    resource_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), index=True
    )
