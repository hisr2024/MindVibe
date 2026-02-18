"""Team management API routes.

Provides endpoints for team CRUD, member management, invitations,
and permission checking. All endpoints require JWT authentication.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user, get_db
from backend.models.team import (
    InvitationStatus,
    TeamPermission,
    TeamRole,
)
from backend.services import team_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/teams", tags=["teams"])


# --- Request/Response Schemas ---


class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    description: str | None = Field(None, max_length=2000)
    settings: dict | None = None


class UpdateTeamRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=256)
    description: str | None = Field(None, max_length=2000)
    avatar_url: str | None = Field(None, max_length=512)
    max_members: int | None = Field(None, ge=1, le=1000)
    kiaan_enabled: bool | None = None
    journeys_shared: bool | None = None
    analytics_shared: bool | None = None
    voice_enabled: bool | None = None


class InviteMemberRequest(BaseModel):
    email: str | None = Field(None, max_length=256)
    user_id: str | None = Field(None, max_length=255)
    role: TeamRole = TeamRole.MEMBER
    message: str | None = Field(None, max_length=1000)


class UpdateMemberRoleRequest(BaseModel):
    role: TeamRole


class TransferOwnershipRequest(BaseModel):
    new_owner_id: str = Field(..., min_length=1, max_length=255)


class AcceptInvitationRequest(BaseModel):
    token: str | None = None
    invitation_id: str | None = None


class TeamResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    avatar_url: str | None = None
    owner_id: str
    max_members: int
    is_active: bool
    kiaan_enabled: bool
    journeys_shared: bool
    analytics_shared: bool
    voice_enabled: bool
    subscription_tier: str | None = None
    member_count: int = 0
    created_at: str


class MemberResponse(BaseModel):
    id: int
    team_id: str
    user_id: str
    role: str
    display_name: str | None = None
    is_active: bool
    joined_at: str
    last_active_at: str | None = None


class InvitationResponse(BaseModel):
    id: str
    team_id: str
    invitee_email: str | None = None
    invitee_user_id: str | None = None
    role: str
    status: str
    message: str | None = None
    invited_by: str
    expires_at: str
    created_at: str


# --- Helper ---


async def _require_team_permission(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    permission: TeamPermission,
) -> None:
    """Raise 403 if user lacks the required team permission."""
    has_perm = await team_service.check_team_permission(db, team_id, user_id, permission)
    if not has_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing team permission: {permission.value}",
        )


def _team_to_response(team, member_count: int = 0) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "description": team.description,
        "avatar_url": team.avatar_url,
        "owner_id": team.owner_id,
        "max_members": team.max_members,
        "is_active": team.is_active,
        "kiaan_enabled": team.kiaan_enabled,
        "journeys_shared": team.journeys_shared,
        "analytics_shared": team.analytics_shared,
        "voice_enabled": team.voice_enabled,
        "subscription_tier": team.subscription_tier,
        "member_count": member_count,
        "created_at": team.created_at.isoformat() if team.created_at else "",
    }


def _member_to_response(member) -> dict:
    return {
        "id": member.id,
        "team_id": member.team_id,
        "user_id": member.user_id,
        "role": member.role.value if hasattr(member.role, "value") else member.role,
        "display_name": member.display_name,
        "is_active": member.is_active,
        "joined_at": member.joined_at.isoformat() if member.joined_at else "",
        "last_active_at": (
            member.last_active_at.isoformat() if member.last_active_at else None
        ),
    }


def _invitation_to_response(inv) -> dict:
    return {
        "id": inv.id,
        "team_id": inv.team_id,
        "invitee_email": inv.invitee_email,
        "invitee_user_id": inv.invitee_user_id,
        "role": inv.role.value if hasattr(inv.role, "value") else inv.role,
        "status": inv.status.value if hasattr(inv.status, "value") else inv.status,
        "message": inv.message,
        "invited_by": inv.invited_by,
        "expires_at": inv.expires_at.isoformat() if inv.expires_at else "",
        "created_at": inv.created_at.isoformat() if inv.created_at else "",
    }


# --- Team CRUD ---


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new team. The creator becomes the owner."""
    team = await team_service.create_team(
        db,
        owner_id=user_id,
        name=request.name,
        description=request.description,
        settings=request.settings,
    )
    members = await team_service.get_team_members(db, team.id)
    return {"success": True, "team": _team_to_response(team, len(members))}


@router.get("")
async def list_my_teams(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all teams the current user belongs to."""
    teams = await team_service.get_user_teams(db, user_id)
    result = []
    for team in teams:
        members = await team_service.get_team_members(db, team.id)
        result.append(_team_to_response(team, len(members)))
    return {"teams": result, "count": len(result)}


@router.get("/{team_id}")
async def get_team(
    team_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get team details. Must be a member to view."""
    member = await team_service.get_team_member(db, team_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team not found or not a member")

    team = await team_service.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members = await team_service.get_team_members(db, team.id)
    return {"team": _team_to_response(team, len(members))}


@router.patch("/{team_id}")
async def update_team(
    team_id: str,
    request: UpdateTeamRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update team details. Requires team:settings:edit permission."""
    await _require_team_permission(
        db, team_id, user_id, TeamPermission.TEAM_SETTINGS_EDIT
    )

    updates = request.model_dump(exclude_none=True)
    team = await team_service.update_team(db, team_id, user_id, **updates)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members = await team_service.get_team_members(db, team.id)
    return {"success": True, "team": _team_to_response(team, len(members))}


@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a team. Requires team:delete permission (owner only)."""
    await _require_team_permission(db, team_id, user_id, TeamPermission.TEAM_DELETE)

    success = await team_service.delete_team(db, team_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Team not found")

    return {"success": True, "message": "Team deleted"}


# --- Member Management ---


@router.get("/{team_id}/members")
async def list_team_members(
    team_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a team. Requires team:members:view permission."""
    await _require_team_permission(db, team_id, user_id, TeamPermission.MEMBERS_VIEW)

    members = await team_service.get_team_members(db, team_id)
    return {
        "members": [_member_to_response(m) for m in members],
        "count": len(members),
    }


@router.patch("/{team_id}/members/{member_user_id}/role")
async def update_member_role(
    team_id: str,
    member_user_id: str,
    request: UpdateMemberRoleRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role. Requires team:members:edit_role permission."""
    await _require_team_permission(
        db, team_id, user_id, TeamPermission.MEMBERS_EDIT_ROLE
    )

    member = await team_service.update_member_role(
        db, team_id, member_user_id, request.role, user_id
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    return {"success": True, "member": _member_to_response(member)}


@router.delete("/{team_id}/members/{member_user_id}")
async def remove_team_member(
    team_id: str,
    member_user_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the team. Requires team:members:remove permission."""
    await _require_team_permission(
        db, team_id, user_id, TeamPermission.MEMBERS_REMOVE
    )

    success = await team_service.remove_team_member(
        db, team_id, member_user_id, user_id
    )
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove member (may be owner or not found)",
        )

    return {"success": True, "message": "Member removed"}


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave a team voluntarily. Owners must transfer ownership first."""
    member = await team_service.get_team_member(db, team_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Not a member of this team")

    if member.role == TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Owners must transfer ownership before leaving",
        )

    success = await team_service.remove_team_member(db, team_id, user_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not leave team")

    return {"success": True, "message": "Left team successfully"}


@router.post("/{team_id}/transfer-ownership")
async def transfer_ownership(
    team_id: str,
    request: TransferOwnershipRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Transfer team ownership to another member. Only the current owner can do this."""
    success = await team_service.transfer_ownership(
        db, team_id, user_id, request.new_owner_id
    )
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Transfer failed (not owner, or target not a member)",
        )

    return {"success": True, "message": "Ownership transferred"}


# --- Invitations ---


@router.post("/{team_id}/invitations")
async def invite_member(
    team_id: str,
    request: InviteMemberRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send an invitation to join the team. Requires team:members:invite."""
    await _require_team_permission(
        db, team_id, user_id, TeamPermission.MEMBERS_INVITE
    )

    if not request.email and not request.user_id:
        raise HTTPException(
            status_code=400,
            detail="Either email or user_id is required",
        )

    invitation = await team_service.create_invitation(
        db,
        team_id=team_id,
        invited_by=user_id,
        role=request.role,
        invitee_email=request.email,
        invitee_user_id=request.user_id,
        message=request.message,
    )
    if not invitation:
        raise HTTPException(
            status_code=400,
            detail="Invitation failed (duplicate or user already member)",
        )

    return {
        "success": True,
        "invitation": _invitation_to_response(invitation),
    }


@router.get("/{team_id}/invitations")
async def list_invitations(
    team_id: str,
    status_filter: str | None = Query(None, alias="status"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List team invitations. Requires team:members:view permission."""
    await _require_team_permission(db, team_id, user_id, TeamPermission.MEMBERS_VIEW)

    inv_status = None
    if status_filter:
        try:
            inv_status = InvitationStatus(status_filter)
        except ValueError:
            pass

    invitations = await team_service.get_team_invitations(db, team_id, inv_status)
    return {
        "invitations": [_invitation_to_response(i) for i in invitations],
        "count": len(invitations),
    }


@router.delete("/{team_id}/invitations/{invitation_id}")
async def revoke_invitation(
    team_id: str,
    invitation_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a pending invitation. Requires team:members:invite permission."""
    await _require_team_permission(
        db, team_id, user_id, TeamPermission.MEMBERS_INVITE
    )

    success = await team_service.revoke_invitation(db, invitation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invitation not found or not pending")

    return {"success": True, "message": "Invitation revoked"}


# --- User-facing invitation actions ---


@router.get("/invitations/pending")
async def my_pending_invitations(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all pending invitations for the current user."""
    invitations = await team_service.get_user_pending_invitations(db, user_id)
    return {
        "invitations": [_invitation_to_response(i) for i in invitations],
        "count": len(invitations),
    }


@router.post("/invitations/accept")
async def accept_invitation(
    request: AcceptInvitationRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a team invitation by token or invitation ID."""
    member = None
    if request.token:
        member = await team_service.accept_invitation_by_token(
            db, request.token, user_id
        )
    elif request.invitation_id:
        member = await team_service.accept_invitation(
            db, request.invitation_id, user_id
        )

    if not member:
        raise HTTPException(
            status_code=400,
            detail="Invitation not found, expired, or already processed",
        )

    return {"success": True, "member": _member_to_response(member)}


@router.post("/invitations/{invitation_id}/decline")
async def decline_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Decline a team invitation."""
    success = await team_service.decline_invitation(db, invitation_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invitation not found or not pending")

    return {"success": True, "message": "Invitation declined"}


# --- Audit Logs ---


@router.get("/{team_id}/audit-logs")
async def get_team_audit_logs(
    team_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch audit logs for a team. Requires team:settings:view permission."""
    await _require_team_permission(
        db, team_id, user_id, TeamPermission.TEAM_SETTINGS_VIEW
    )

    logs = await team_service.get_team_audit_logs(db, team_id, limit, offset)
    return {
        "logs": [
            {
                "id": log.id,
                "team_id": log.team_id,
                "actor_id": log.actor_id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else "",
            }
            for log in logs
        ],
        "count": len(logs),
    }


# --- Permission Check ---


@router.get("/{team_id}/permissions")
async def get_my_permissions(
    team_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's permissions in a team."""
    member = await team_service.get_team_member(db, team_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Not a member of this team")

    permissions = team_service.get_member_permissions(member)
    return {
        "team_id": team_id,
        "user_id": user_id,
        "role": member.role.value if hasattr(member.role, "value") else member.role,
        "permissions": [p.value for p in permissions],
    }
