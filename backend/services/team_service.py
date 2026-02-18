"""Team service: business logic for team management, invitations, and access control.

Handles team CRUD, member management, invitation workflows, and
permission resolution for team-level RBAC.
"""

from __future__ import annotations

import datetime
import logging
import re
import uuid
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.team import (
    InvitationStatus,
    Team,
    TeamAuditLog,
    TeamInvitation,
    TeamMember,
    TeamPermission,
    TeamRole,
    TEAM_ROLE_PERMISSIONS,
)
from backend.models.user import User

logger = logging.getLogger(__name__)

# Invitation expiry: 7 days
INVITATION_EXPIRY_DAYS = 7


def _slugify(name: str) -> str:
    """Convert team name to URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:128]


def get_member_permissions(member: TeamMember) -> set[TeamPermission]:
    """Resolve all permissions for a team member (role-based + custom)."""
    role_perms = set(TEAM_ROLE_PERMISSIONS.get(member.role, []))

    if member.custom_permissions:
        granted = member.custom_permissions.get("granted", [])
        revoked = member.custom_permissions.get("revoked", [])

        for perm_value in granted:
            try:
                role_perms.add(TeamPermission(perm_value))
            except ValueError:
                pass

        for perm_value in revoked:
            try:
                role_perms.discard(TeamPermission(perm_value))
            except ValueError:
                pass

    return role_perms


async def create_team(
    db: AsyncSession,
    owner_id: str,
    name: str,
    description: str | None = None,
    settings: dict | None = None,
) -> Team:
    """Create a new team and add the creator as owner."""
    slug = _slugify(name)
    base_slug = slug

    # Ensure slug uniqueness
    counter = 1
    while True:
        existing = await db.execute(
            select(Team).where(Team.slug == slug, Team.deleted_at.is_(None))
        )
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    team = Team(
        id=str(uuid.uuid4()),
        name=name,
        slug=slug,
        description=description,
        owner_id=owner_id,
        settings=settings or {},
        is_active=True,
    )
    db.add(team)
    await db.flush()

    # Add creator as OWNER member
    owner_member = TeamMember(
        team_id=team.id,
        user_id=owner_id,
        role=TeamRole.OWNER,
        is_active=True,
    )
    db.add(owner_member)

    # Audit log
    audit = TeamAuditLog(
        team_id=team.id,
        actor_id=owner_id,
        action="team_created",
        resource_type="team",
        resource_id=team.id,
        details={"name": name, "slug": slug},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(team)

    logger.info(f"Team created: {team.id} ({team.name}) by user {owner_id}")
    return team


async def get_team_by_id(db: AsyncSession, team_id: str) -> Team | None:
    """Fetch a team by ID (excluding soft-deleted)."""
    result = await db.execute(
        select(Team).where(Team.id == team_id, Team.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def get_team_by_slug(db: AsyncSession, slug: str) -> Team | None:
    """Fetch a team by slug (excluding soft-deleted)."""
    result = await db.execute(
        select(Team).where(Team.slug == slug, Team.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def get_user_teams(
    db: AsyncSession,
    user_id: str,
    include_inactive: bool = False,
) -> list[Team]:
    """List all teams a user belongs to."""
    conditions = [
        TeamMember.user_id == user_id,
        TeamMember.deleted_at.is_(None),
        Team.deleted_at.is_(None),
    ]
    if not include_inactive:
        conditions.append(TeamMember.is_active.is_(True))
        conditions.append(Team.is_active.is_(True))

    result = await db.execute(
        select(Team).join(TeamMember, TeamMember.team_id == Team.id).where(
            and_(*conditions)
        )
    )
    return list(result.scalars().all())


async def get_team_member(
    db: AsyncSession,
    team_id: str,
    user_id: str,
) -> TeamMember | None:
    """Get a specific team member record."""
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def get_team_members(
    db: AsyncSession,
    team_id: str,
    include_inactive: bool = False,
) -> list[TeamMember]:
    """List all members of a team."""
    conditions = [
        TeamMember.team_id == team_id,
        TeamMember.deleted_at.is_(None),
    ]
    if not include_inactive:
        conditions.append(TeamMember.is_active.is_(True))

    result = await db.execute(
        select(TeamMember).where(and_(*conditions)).order_by(TeamMember.joined_at)
    )
    return list(result.scalars().all())


async def update_team(
    db: AsyncSession,
    team_id: str,
    actor_id: str,
    **updates: dict,
) -> Team | None:
    """Update team details. Only allowed fields are applied."""
    team = await get_team_by_id(db, team_id)
    if not team:
        return None

    allowed_fields = {
        "name", "description", "avatar_url", "settings",
        "max_members", "is_active", "kiaan_enabled",
        "journeys_shared", "analytics_shared", "voice_enabled",
    }

    applied = {}
    for key, value in updates.items():
        if key in allowed_fields:
            setattr(team, key, value)
            applied[key] = value

    if applied:
        audit = TeamAuditLog(
            team_id=team_id,
            actor_id=actor_id,
            action="team_updated",
            resource_type="team",
            resource_id=team_id,
            details=applied,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(team)

    return team


async def delete_team(
    db: AsyncSession,
    team_id: str,
    actor_id: str,
) -> bool:
    """Soft-delete a team (preserves data for recovery)."""
    team = await get_team_by_id(db, team_id)
    if not team:
        return False

    team.soft_delete()
    team.is_active = False

    audit = TeamAuditLog(
        team_id=team_id,
        actor_id=actor_id,
        action="team_deleted",
        resource_type="team",
        resource_id=team_id,
    )
    db.add(audit)
    await db.commit()

    logger.info(f"Team soft-deleted: {team_id} by user {actor_id}")
    return True


async def add_team_member(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    role: TeamRole = TeamRole.MEMBER,
    invited_by: str | None = None,
) -> TeamMember | None:
    """Add a user to a team. Returns None if already a member."""
    existing = await get_team_member(db, team_id, user_id)
    if existing:
        return None

    team = await get_team_by_id(db, team_id)
    if not team:
        return None

    # Check member limit
    current_count = await db.execute(
        select(func.count(TeamMember.id)).where(
            TeamMember.team_id == team_id,
            TeamMember.deleted_at.is_(None),
            TeamMember.is_active.is_(True),
        )
    )
    if current_count.scalar() >= team.max_members:
        logger.warning(f"Team {team_id} has reached max members ({team.max_members})")
        return None

    member = TeamMember(
        team_id=team_id,
        user_id=user_id,
        role=role,
        is_active=True,
        invited_by=invited_by,
    )
    db.add(member)

    audit = TeamAuditLog(
        team_id=team_id,
        actor_id=invited_by or user_id,
        action="member_added",
        resource_type="team_member",
        resource_id=user_id,
        details={"role": role.value},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(member)

    logger.info(f"User {user_id} added to team {team_id} as {role.value}")
    return member


async def remove_team_member(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    actor_id: str,
) -> bool:
    """Remove a user from a team (soft-delete membership)."""
    member = await get_team_member(db, team_id, user_id)
    if not member:
        return False

    # Cannot remove the team owner
    if member.role == TeamRole.OWNER:
        logger.warning(f"Cannot remove owner {user_id} from team {team_id}")
        return False

    member.soft_delete()
    member.is_active = False

    audit = TeamAuditLog(
        team_id=team_id,
        actor_id=actor_id,
        action="member_removed",
        resource_type="team_member",
        resource_id=user_id,
    )
    db.add(audit)

    await db.commit()
    logger.info(f"User {user_id} removed from team {team_id} by {actor_id}")
    return True


async def update_member_role(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    new_role: TeamRole,
    actor_id: str,
) -> TeamMember | None:
    """Update a team member's role."""
    member = await get_team_member(db, team_id, user_id)
    if not member:
        return None

    old_role = member.role
    member.role = new_role

    audit = TeamAuditLog(
        team_id=team_id,
        actor_id=actor_id,
        action="member_role_changed",
        resource_type="team_member",
        resource_id=user_id,
        details={"old_role": old_role.value, "new_role": new_role.value},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(member)

    logger.info(
        f"User {user_id} role changed from {old_role.value} to "
        f"{new_role.value} in team {team_id}"
    )
    return member


async def create_invitation(
    db: AsyncSession,
    team_id: str,
    invited_by: str,
    role: TeamRole = TeamRole.MEMBER,
    invitee_email: str | None = None,
    invitee_user_id: str | None = None,
    message: str | None = None,
) -> TeamInvitation | None:
    """Create an invitation for a user to join a team."""
    if not invitee_email and not invitee_user_id:
        return None

    team = await get_team_by_id(db, team_id)
    if not team:
        return None

    # Check for duplicate pending invitation
    conditions = [
        TeamInvitation.team_id == team_id,
        TeamInvitation.status == InvitationStatus.PENDING,
        TeamInvitation.deleted_at.is_(None),
    ]
    if invitee_email:
        conditions.append(TeamInvitation.invitee_email == invitee_email)
    if invitee_user_id:
        conditions.append(TeamInvitation.invitee_user_id == invitee_user_id)

    existing = await db.execute(select(TeamInvitation).where(and_(*conditions)))
    if existing.scalar_one_or_none():
        logger.warning(f"Duplicate invitation for team {team_id}")
        return None

    # Check if user is already a member
    if invitee_user_id:
        existing_member = await get_team_member(db, team_id, invitee_user_id)
        if existing_member:
            return None

    invitation = TeamInvitation(
        id=str(uuid.uuid4()),
        team_id=team_id,
        invitee_email=invitee_email,
        invitee_user_id=invitee_user_id,
        role=role,
        status=InvitationStatus.PENDING,
        token=str(uuid.uuid4()),
        message=message,
        invited_by=invited_by,
        expires_at=datetime.datetime.now(datetime.UTC)
        + datetime.timedelta(days=INVITATION_EXPIRY_DAYS),
    )
    db.add(invitation)

    audit = TeamAuditLog(
        team_id=team_id,
        actor_id=invited_by,
        action="invitation_sent",
        resource_type="team_invitation",
        resource_id=invitation.id,
        details={
            "invitee_email": invitee_email,
            "invitee_user_id": invitee_user_id,
            "role": role.value,
        },
    )
    db.add(audit)

    await db.commit()
    await db.refresh(invitation)

    logger.info(f"Invitation created for team {team_id} by {invited_by}")
    return invitation


async def accept_invitation(
    db: AsyncSession,
    invitation_id: str,
    user_id: str,
) -> TeamMember | None:
    """Accept a team invitation and add user as member."""
    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.id == invitation_id,
            TeamInvitation.status == InvitationStatus.PENDING,
            TeamInvitation.deleted_at.is_(None),
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        return None

    # Check expiry
    if invitation.expires_at < datetime.datetime.now(datetime.UTC):
        invitation.status = InvitationStatus.EXPIRED
        await db.commit()
        return None

    # Verify the accepting user matches the invitation
    if invitation.invitee_user_id and invitation.invitee_user_id != user_id:
        return None

    # Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = datetime.datetime.now(datetime.UTC)

    # Add as team member
    member = await add_team_member(
        db,
        team_id=invitation.team_id,
        user_id=user_id,
        role=invitation.role,
        invited_by=invitation.invited_by,
    )

    if not member:
        # Could happen if already a member or team is full
        invitation.status = InvitationStatus.PENDING
        await db.commit()
        return None

    await db.commit()
    return member


async def accept_invitation_by_token(
    db: AsyncSession,
    token: str,
    user_id: str,
) -> TeamMember | None:
    """Accept a team invitation using the invitation token."""
    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.token == token,
            TeamInvitation.status == InvitationStatus.PENDING,
            TeamInvitation.deleted_at.is_(None),
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        return None

    return await accept_invitation(db, invitation.id, user_id)


async def decline_invitation(
    db: AsyncSession,
    invitation_id: str,
    user_id: str,
) -> bool:
    """Decline a team invitation."""
    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.id == invitation_id,
            TeamInvitation.status == InvitationStatus.PENDING,
            TeamInvitation.deleted_at.is_(None),
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        return False

    invitation.status = InvitationStatus.DECLINED
    invitation.declined_at = datetime.datetime.now(datetime.UTC)

    audit = TeamAuditLog(
        team_id=invitation.team_id,
        actor_id=user_id,
        action="invitation_declined",
        resource_type="team_invitation",
        resource_id=invitation.id,
    )
    db.add(audit)

    await db.commit()
    return True


async def revoke_invitation(
    db: AsyncSession,
    invitation_id: str,
    actor_id: str,
) -> bool:
    """Revoke a pending team invitation."""
    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.id == invitation_id,
            TeamInvitation.status == InvitationStatus.PENDING,
            TeamInvitation.deleted_at.is_(None),
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        return False

    invitation.status = InvitationStatus.REVOKED
    invitation.revoked_at = datetime.datetime.now(datetime.UTC)

    audit = TeamAuditLog(
        team_id=invitation.team_id,
        actor_id=actor_id,
        action="invitation_revoked",
        resource_type="team_invitation",
        resource_id=invitation.id,
    )
    db.add(audit)

    await db.commit()
    return True


async def get_team_invitations(
    db: AsyncSession,
    team_id: str,
    status_filter: InvitationStatus | None = None,
) -> list[TeamInvitation]:
    """List invitations for a team."""
    conditions = [
        TeamInvitation.team_id == team_id,
        TeamInvitation.deleted_at.is_(None),
    ]
    if status_filter:
        conditions.append(TeamInvitation.status == status_filter)

    result = await db.execute(
        select(TeamInvitation)
        .where(and_(*conditions))
        .order_by(TeamInvitation.created_at.desc())
    )
    return list(result.scalars().all())


async def get_user_pending_invitations(
    db: AsyncSession,
    user_id: str,
    user_email: str | None = None,
) -> list[TeamInvitation]:
    """Get all pending invitations for a user (by user_id or email)."""
    from sqlalchemy import or_

    conditions = [
        TeamInvitation.status == InvitationStatus.PENDING,
        TeamInvitation.deleted_at.is_(None),
    ]

    identity_conditions = [TeamInvitation.invitee_user_id == user_id]
    if user_email:
        identity_conditions.append(TeamInvitation.invitee_email == user_email)

    conditions.append(or_(*identity_conditions))

    result = await db.execute(
        select(TeamInvitation)
        .where(and_(*conditions))
        .order_by(TeamInvitation.created_at.desc())
    )
    return list(result.scalars().all())


async def get_team_audit_logs(
    db: AsyncSession,
    team_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list[TeamAuditLog]:
    """Fetch audit logs for a team."""
    result = await db.execute(
        select(TeamAuditLog)
        .where(TeamAuditLog.team_id == team_id)
        .order_by(TeamAuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def check_team_permission(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    permission: TeamPermission,
) -> bool:
    """Check if a user has a specific permission in a team."""
    member = await get_team_member(db, team_id, user_id)
    if not member or not member.is_active:
        return False

    permissions = get_member_permissions(member)
    return permission in permissions


async def get_all_teams(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    include_inactive: bool = False,
) -> tuple[list[Team], int]:
    """Admin: list all teams with count."""
    conditions = [Team.deleted_at.is_(None)]
    if not include_inactive:
        conditions.append(Team.is_active.is_(True))

    count_result = await db.execute(
        select(func.count(Team.id)).where(and_(*conditions))
    )
    total = count_result.scalar()

    result = await db.execute(
        select(Team)
        .where(and_(*conditions))
        .order_by(Team.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    teams = list(result.scalars().all())

    return teams, total or 0


async def transfer_ownership(
    db: AsyncSession,
    team_id: str,
    current_owner_id: str,
    new_owner_id: str,
) -> bool:
    """Transfer team ownership to another member."""
    current_owner = await get_team_member(db, team_id, current_owner_id)
    if not current_owner or current_owner.role != TeamRole.OWNER:
        return False

    new_owner = await get_team_member(db, team_id, new_owner_id)
    if not new_owner:
        return False

    # Transfer ownership
    current_owner.role = TeamRole.ADMIN
    new_owner.role = TeamRole.OWNER

    team = await get_team_by_id(db, team_id)
    if team:
        team.owner_id = new_owner_id

    audit = TeamAuditLog(
        team_id=team_id,
        actor_id=current_owner_id,
        action="ownership_transferred",
        resource_type="team",
        resource_id=team_id,
        details={
            "from_user": current_owner_id,
            "to_user": new_owner_id,
        },
    )
    db.add(audit)

    await db.commit()
    logger.info(
        f"Team {team_id} ownership transferred from "
        f"{current_owner_id} to {new_owner_id}"
    )
    return True
