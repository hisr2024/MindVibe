"""Admin team management routes.

Provides admin-level endpoints for overseeing all teams,
managing team members, and viewing team analytics.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db
from backend.middleware.rbac import AdminContext, get_current_admin, require_permission
from backend.models.admin import AdminPermission
from backend.models.team import TeamRole
from backend.services import team_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/teams", tags=["admin-teams"])


class AdminUpdateTeamRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=256)
    description: str | None = Field(None, max_length=2000)
    max_members: int | None = Field(None, ge=1, le=10000)
    is_active: bool | None = None
    kiaan_enabled: bool | None = None
    journeys_shared: bool | None = None
    analytics_shared: bool | None = None
    voice_enabled: bool | None = None
    subscription_tier: str | None = None


class AdminAddMemberRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=255)
    role: TeamRole = TeamRole.MEMBER


class AdminUpdateMemberRoleRequest(BaseModel):
    role: TeamRole


@router.get("")
@require_permission(AdminPermission.USERS_VIEW)
async def list_all_teams(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    include_inactive: bool = Query(False),
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all teams across the platform."""
    teams, total = await team_service.get_all_teams(
        db, limit=limit, offset=offset, include_inactive=include_inactive
    )

    results = []
    for team in teams:
        members = await team_service.get_team_members(db, team.id, include_inactive=True)
        results.append({
            "id": team.id,
            "name": team.name,
            "slug": team.slug,
            "description": team.description,
            "owner_id": team.owner_id,
            "max_members": team.max_members,
            "is_active": team.is_active,
            "subscription_tier": team.subscription_tier,
            "member_count": len(members),
            "kiaan_enabled": team.kiaan_enabled,
            "journeys_shared": team.journeys_shared,
            "analytics_shared": team.analytics_shared,
            "voice_enabled": team.voice_enabled,
            "created_at": team.created_at.isoformat() if team.created_at else "",
        })

    return {"teams": results, "total": total, "limit": limit, "offset": offset}


@router.get("/{team_id}")
@require_permission(AdminPermission.USERS_VIEW)
async def get_team_details(
    team_id: str,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: get detailed information about a specific team."""
    team = await team_service.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members = await team_service.get_team_members(db, team_id, include_inactive=True)
    invitations = await team_service.get_team_invitations(db, team_id)
    audit_logs = await team_service.get_team_audit_logs(db, team_id, limit=20)

    return {
        "team": {
            "id": team.id,
            "name": team.name,
            "slug": team.slug,
            "description": team.description,
            "owner_id": team.owner_id,
            "max_members": team.max_members,
            "is_active": team.is_active,
            "subscription_tier": team.subscription_tier,
            "settings": team.settings,
            "kiaan_enabled": team.kiaan_enabled,
            "journeys_shared": team.journeys_shared,
            "analytics_shared": team.analytics_shared,
            "voice_enabled": team.voice_enabled,
            "created_at": team.created_at.isoformat() if team.created_at else "",
            "updated_at": team.updated_at.isoformat() if team.updated_at else None,
        },
        "members": [
            {
                "id": m.id,
                "user_id": m.user_id,
                "role": m.role.value if hasattr(m.role, "value") else m.role,
                "is_active": m.is_active,
                "display_name": m.display_name,
                "joined_at": m.joined_at.isoformat() if m.joined_at else "",
            }
            for m in members
        ],
        "invitations": [
            {
                "id": inv.id,
                "invitee_email": inv.invitee_email,
                "invitee_user_id": inv.invitee_user_id,
                "role": inv.role.value if hasattr(inv.role, "value") else inv.role,
                "status": inv.status.value if hasattr(inv.status, "value") else inv.status,
                "expires_at": inv.expires_at.isoformat() if inv.expires_at else "",
            }
            for inv in invitations
        ],
        "recent_audit_logs": [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else "",
            }
            for log in audit_logs
        ],
        "member_count": len([m for m in members if m.is_active]),
        "invitation_count": len([i for i in invitations if i.status.value == "pending"]),
    }


@router.patch("/{team_id}")
@require_permission(AdminPermission.USERS_EDIT)
async def admin_update_team(
    team_id: str,
    request: AdminUpdateTeamRequest,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: update any team's settings."""
    updates = request.model_dump(exclude_none=True)
    team = await team_service.update_team(db, team_id, admin.admin.id, **updates)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return {"success": True, "message": "Team updated"}


@router.delete("/{team_id}")
@require_permission(AdminPermission.USERS_DELETE)
async def admin_delete_team(
    team_id: str,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: soft-delete a team."""
    success = await team_service.delete_team(db, team_id, admin.admin.id)
    if not success:
        raise HTTPException(status_code=404, detail="Team not found")

    return {"success": True, "message": "Team deleted"}


@router.post("/{team_id}/members")
@require_permission(AdminPermission.USERS_EDIT)
async def admin_add_member(
    team_id: str,
    request: AdminAddMemberRequest,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: directly add a user to a team (bypasses invitation)."""
    member = await team_service.add_team_member(
        db,
        team_id=team_id,
        user_id=request.user_id,
        role=request.role,
        invited_by=admin.admin.id,
    )
    if not member:
        raise HTTPException(
            status_code=400,
            detail="Could not add member (already member, team full, or not found)",
        )

    return {"success": True, "message": f"User {request.user_id} added to team"}


@router.patch("/{team_id}/members/{user_id}/role")
@require_permission(AdminPermission.USERS_EDIT)
async def admin_update_member_role(
    team_id: str,
    user_id: str,
    request: AdminUpdateMemberRoleRequest,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: change a team member's role."""
    member = await team_service.update_member_role(
        db, team_id, user_id, request.role, admin.admin.id
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    return {"success": True, "message": "Member role updated"}


@router.delete("/{team_id}/members/{user_id}")
@require_permission(AdminPermission.USERS_EDIT)
async def admin_remove_member(
    team_id: str,
    user_id: str,
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: remove a user from a team."""
    success = await team_service.remove_team_member(
        db, team_id, user_id, admin.admin.id
    )
    if not success:
        raise HTTPException(status_code=400, detail="Could not remove member")

    return {"success": True, "message": "Member removed"}


@router.get("/{team_id}/audit-logs")
@require_permission(AdminPermission.AUDIT_LOGS_VIEW)
async def admin_team_audit_logs(
    team_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin: AdminContext = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: view full audit logs for a team."""
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
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else "",
            }
            for log in logs
        ],
        "count": len(logs),
    }
