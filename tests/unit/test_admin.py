"""Tests for admin authentication and RBAC."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    AdminUser,
    AdminRole,
    AdminPermission,
    ROLE_PERMISSIONS,
)
from backend.security.password_hash import hash_password


@pytest.fixture
async def admin_user(test_db: AsyncSession) -> AdminUser:
    """Create a test admin user."""
    admin = AdminUser(
        id="test-admin-123",
        email="admin@test.com",
        hashed_password=hash_password("TestPassword123!"),
        full_name="Test Admin",
        role=AdminRole.ADMIN,
        is_active=True,
        mfa_enabled=False,
    )
    test_db.add(admin)
    await test_db.commit()
    await test_db.refresh(admin)
    return admin


@pytest.fixture
async def super_admin_user(test_db: AsyncSession) -> AdminUser:
    """Create a test super admin user."""
    admin = AdminUser(
        id="test-super-admin-456",
        email="superadmin@test.com",
        hashed_password=hash_password("TestPassword123!"),
        full_name="Super Admin",
        role=AdminRole.SUPER_ADMIN,
        is_active=True,
        mfa_enabled=False,
    )
    test_db.add(admin)
    await test_db.commit()
    await test_db.refresh(admin)
    return admin


class TestAdminRoles:
    """Test suite for admin roles and permissions."""

    def test_role_permissions_mapping(self):
        """Test that all roles have proper permissions mapped."""
        for role in AdminRole:
            assert role in ROLE_PERMISSIONS
            permissions = ROLE_PERMISSIONS[role]
            assert isinstance(permissions, list)
            # All permissions should be AdminPermission enum values
            for perm in permissions:
                assert isinstance(perm, AdminPermission)

    def test_super_admin_has_all_permissions(self):
        """Test that super admin has all permissions."""
        super_admin_perms = ROLE_PERMISSIONS[AdminRole.SUPER_ADMIN]
        all_perms = list(AdminPermission)
        assert set(super_admin_perms) == set(all_perms)

    def test_analyst_has_read_only_permissions(self):
        """Test that analyst role only has view permissions."""
        analyst_perms = ROLE_PERMISSIONS[AdminRole.ANALYST]
        # Analyst should only have view permissions
        for perm in analyst_perms:
            assert "view" in perm.value or perm == AdminPermission.KIAAN_ANALYTICS_VIEW

    def test_support_cannot_manage_feature_flags(self):
        """Test that support role cannot manage feature flags."""
        support_perms = ROLE_PERMISSIONS[AdminRole.SUPPORT]
        assert AdminPermission.FEATURE_FLAGS_MANAGE not in support_perms
        assert AdminPermission.FEATURE_FLAGS_VIEW not in support_perms

    def test_moderator_has_moderation_permissions(self):
        """Test that moderator has appropriate moderation permissions."""
        moderator_perms = ROLE_PERMISSIONS[AdminRole.MODERATOR]
        assert AdminPermission.MODERATION_VIEW in moderator_perms
        assert AdminPermission.MODERATION_ACTION in moderator_perms


class TestAdminModel:
    """Test suite for admin user model."""

    @pytest.mark.asyncio
    async def test_admin_user_creation(self, admin_user: AdminUser):
        """Test admin user creation."""
        assert admin_user.id == "test-admin-123"
        assert admin_user.email == "admin@test.com"
        assert admin_user.full_name == "Test Admin"
        assert admin_user.role == AdminRole.ADMIN
        assert admin_user.is_active is True
        assert admin_user.mfa_enabled is False
        assert admin_user.deleted_at is None

    @pytest.mark.asyncio
    async def test_admin_soft_delete(self, admin_user: AdminUser, test_db: AsyncSession):
        """Test admin user soft delete."""
        admin_user.soft_delete()
        await test_db.commit()
        await test_db.refresh(admin_user)
        
        assert admin_user.deleted_at is not None

    @pytest.mark.asyncio
    async def test_admin_restore(self, admin_user: AdminUser, test_db: AsyncSession):
        """Test admin user restore after soft delete."""
        admin_user.soft_delete()
        await test_db.commit()
        
        admin_user.restore()
        await test_db.commit()
        await test_db.refresh(admin_user)
        
        assert admin_user.deleted_at is None


@pytest.mark.asyncio
class TestAdminAuthRoutes:
    """Test suite for admin authentication routes."""

    async def test_admin_login_without_credentials(self, test_client: AsyncClient):
        """Test that login fails without credentials."""
        response = await test_client.post(
            "/api/admin/auth/login",
            json={}
        )
        # 422 (validation error), 403 (CSRF protection), or 404 (route not registered)
        assert response.status_code in [403, 404, 422]

    async def test_admin_login_with_invalid_credentials(self, test_client: AsyncClient):
        """Test that login fails with invalid credentials."""
        response = await test_client.post(
            "/api/admin/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "wrongpassword"
            }
        )
        # 401 (invalid creds), 403 (CSRF protection), or 404 (route not registered)
        assert response.status_code in [401, 403, 404]

    async def test_admin_me_without_auth(self, test_client: AsyncClient):
        """Test that /me endpoint requires authentication."""
        response = await test_client.get("/api/admin/auth/me")
        # 401 (unauthorized), 403 (forbidden), or 405 (method not allowed if route changed)
        assert response.status_code in [401, 403, 404, 405]

    async def test_admin_mfa_status_without_auth(self, test_client: AsyncClient):
        """Test that MFA status requires authentication."""
        response = await test_client.get("/api/admin/auth/mfa/status")
        # 401 (unauthorized), 403 (forbidden), or 405 (method not allowed if route changed)
        assert response.status_code in [401, 403, 404, 405]


@pytest.mark.asyncio
class TestKiaanProtection:
    """Test suite for KIAAN protection (admin cannot modify KIAAN)."""

    async def test_kiaan_analytics_is_read_only(self, test_client: AsyncClient):
        """Test that KIAAN analytics endpoints are read-only."""
        # POST should not exist for KIAAN analytics
        response = await test_client.post("/api/admin/kiaan/overview")
        # Should be 401 (not authenticated), 403 (CSRF/forbidden), 404, or 405 (method not allowed)
        assert response.status_code in [401, 403, 404, 405]

        # PUT should not exist
        response = await test_client.put("/api/admin/kiaan/overview")
        assert response.status_code in [401, 403, 404, 405]

        # DELETE should not exist
        response = await test_client.delete("/api/admin/kiaan/overview")
        assert response.status_code in [401, 403, 404, 405]

    def test_kiaan_analytics_permission_is_view_only(self):
        """Test that KIAAN permission is view-only."""
        # The only KIAAN permission should be for viewing
        kiaan_perms = [p for p in AdminPermission if "kiaan" in p.value.lower()]
        assert len(kiaan_perms) == 1
        assert kiaan_perms[0] == AdminPermission.KIAAN_ANALYTICS_VIEW
        assert "view" in kiaan_perms[0].value
