-- Migration: Convert native PostgreSQL ENUM columns to VARCHAR
-- Purpose: SQLAlchemy models use native_enum=False (VARCHAR storage) but
--          some columns were created as native PostgreSQL ENUM types by
--          either Base.metadata.create_all or explicit CREATE TYPE statements.
--          This causes "invalid input value for enum" errors because
--          SQLAlchemy sends plain strings but PostgreSQL expects enum casts.
--
-- Idempotent: Safe to run multiple times. Checks column type before altering.

-- Helper function to convert a column from native enum to varchar
-- only if it's currently using a native enum type.
DO $$
DECLARE
    col_type text;
BEGIN
    -- ============================================================
    -- 1. subscription_plans.tier
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'tier';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE subscription_plans
            ALTER COLUMN tier TYPE VARCHAR(32) USING tier::text;
        RAISE NOTICE 'Converted subscription_plans.tier to VARCHAR';
    END IF;

    -- ============================================================
    -- 2. user_subscriptions.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE user_subscriptions
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted user_subscriptions.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 3. payments.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE payments
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted payments.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 4. subscription_links.plan_tier
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'subscription_links' AND column_name = 'plan_tier';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE subscription_links
            ALTER COLUMN plan_tier TYPE VARCHAR(32) USING plan_tier::text;
        RAISE NOTICE 'Converted subscription_links.plan_tier to VARCHAR';
    END IF;

    -- ============================================================
    -- 5. subscription_links.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'subscription_links' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE subscription_links
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted subscription_links.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 6. admin_users.role
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'role';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE admin_users
            ALTER COLUMN role TYPE VARCHAR(32) USING role::text;
        RAISE NOTICE 'Converted admin_users.role to VARCHAR';
    END IF;

    -- ============================================================
    -- 7. admin_permission_assignments.permission
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'admin_permission_assignments' AND column_name = 'permission';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE admin_permission_assignments
            ALTER COLUMN permission TYPE VARCHAR(64) USING permission::text;
        RAISE NOTICE 'Converted admin_permission_assignments.permission to VARCHAR';
    END IF;

    -- ============================================================
    -- 8. admin_audit_logs.action
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'admin_audit_logs' AND column_name = 'action';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE admin_audit_logs
            ALTER COLUMN action TYPE VARCHAR(64) USING action::text;
        RAISE NOTICE 'Converted admin_audit_logs.action to VARCHAR';
    END IF;

    -- ============================================================
    -- 9. announcements.type
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'type';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE announcements
            ALTER COLUMN type TYPE VARCHAR(32) USING type::text;
        RAISE NOTICE 'Converted announcements.type to VARCHAR';
    END IF;

    -- ============================================================
    -- 10. ab_tests.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'ab_tests' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE ab_tests
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted ab_tests.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 11. flagged_content.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'flagged_content' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE flagged_content
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted flagged_content.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 12. team_members.role
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'role';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE team_members
            ALTER COLUMN role TYPE VARCHAR(32) USING role::text;
        RAISE NOTICE 'Converted team_members.role to VARCHAR';
    END IF;

    -- ============================================================
    -- 13. team_invitations.role
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'team_invitations' AND column_name = 'role';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE team_invitations
            ALTER COLUMN role TYPE VARCHAR(32) USING role::text;
        RAISE NOTICE 'Converted team_invitations.role to VARCHAR';
    END IF;

    -- ============================================================
    -- 14. team_invitations.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'team_invitations' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE team_invitations
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted team_invitations.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 15. user_consents.consent_type
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'user_consents' AND column_name = 'consent_type';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE user_consents
            ALTER COLUMN consent_type TYPE VARCHAR(64) USING consent_type::text;
        RAISE NOTICE 'Converted user_consents.consent_type to VARCHAR';
    END IF;

    -- ============================================================
    -- 16. data_export_requests.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'data_export_requests' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE data_export_requests
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted data_export_requests.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 17. deletion_requests.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'deletion_requests' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE deletion_requests
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted deletion_requests.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 18. wisdom_journeys.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'wisdom_journeys' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE wisdom_journeys
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted wisdom_journeys.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 19. user_journeys.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'user_journeys' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE user_journeys
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted user_journeys.status to VARCHAR';
    END IF;

    -- ============================================================
    -- 20. personal_journeys.status
    -- ============================================================
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'personal_journeys' AND column_name = 'status';

    IF col_type = 'USER-DEFINED' THEN
        ALTER TABLE personal_journeys
            ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
        RAISE NOTICE 'Converted personal_journeys.status to VARCHAR';
    END IF;

END $$;

-- ============================================================
-- Drop orphaned native enum types (no longer used by any column)
-- ============================================================
DROP TYPE IF EXISTS subscriptiontier CASCADE;
DROP TYPE IF EXISTS subscriptionstatus CASCADE;
DROP TYPE IF EXISTS subscriptionlinkstatus CASCADE;
DROP TYPE IF EXISTS paymentstatus CASCADE;
DROP TYPE IF EXISTS adminrole CASCADE;
DROP TYPE IF EXISTS adminpermission CASCADE;
DROP TYPE IF EXISTS adminauditaction CASCADE;
DROP TYPE IF EXISTS announcementtype CASCADE;
DROP TYPE IF EXISTS abteststatus CASCADE;
DROP TYPE IF EXISTS moderationstatus CASCADE;
DROP TYPE IF EXISTS teamrole CASCADE;
DROP TYPE IF EXISTS invitationstatus CASCADE;
DROP TYPE IF EXISTS consenttype CASCADE;
DROP TYPE IF EXISTS dataexportstatus CASCADE;
DROP TYPE IF EXISTS deletionrequeststatus CASCADE;
DROP TYPE IF EXISTS journeystatus CASCADE;
DROP TYPE IF EXISTS userjourneystatus CASCADE;
DROP TYPE IF EXISTS personaljourneystatus CASCADE;
