# Database readiness checklist

This checklist keeps deployments pointed at the right PostgreSQL instance with
permissions and TLS configured for schema changes and migrations.

## Connection environment variables

- **Render (`render.yaml`)**: `DATABASE_URL` comes from the managed database
  resource (`mindvibe-db`). `DB_SSLMODE` is set to `require` so TLS is enforced
  even if the generated URL omits it.
- **Fly.io (`fly.toml`)**: set `DATABASE_URL` via `fly secrets set DATABASE_URL=...`
  to the intended Fly Postgres cluster connection string. `DB_SSLMODE` is set to
  `require` so the app negotiates TLS when the provider demands it.
- **Docker Compose (`docker-compose.yml`)**: defaults to the local
  `postgresql+asyncpg://navi:navi@db:5432/navi` service for development.

The backend normalizes legacy `postgres://` URLs and appends TLS options from
`DB_SSLMODE` / `DB_SSLROOTCERT` automatically.

## Schema-altering permissions

Ensure the application role can manage schema changes:

1. Connect as an admin/superuser to the target database.
2. Grant the app role the ability to create and alter objects in the target
   schema (replace `app_user` and `public` as needed):

   ```sql
   ALTER ROLE app_user CREATEDB;
   GRANT CONNECT ON DATABASE mindvibe TO app_user;
   GRANT USAGE, CREATE ON SCHEMA public TO app_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
   ```

These privileges allow the startup migration runner to create tables and
metadata (including the `schema_migrations` ledger).

## TLS options for managed databases

Set the following environment variables when a managed database enforces SSL:

- `DB_SSLMODE`: typically `require` (already applied in Render and Fly configs).
- `DB_SSLROOTCERT`: absolute path to a CA bundle if the provider uses a custom
  certificate chain.

The backend injects these options into the connection string so asyncpg can
negotiate TLS without additional code changes.

## One-time manual migration / re-initialization

If an existing schema cannot be reconciled with the current migrations:

1. Back up the database (`pg_dump`) before making changes.
2. Option A: reset to a fresh schema
   ```bash
   psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```
3. Option B: apply migrations manually
   ```bash
   python -m backend.core.migrations
   ```
   The runner will create the `schema_migrations` table and apply pending SQL
   files from `migrations/` in order.
4. Verify the app can start and apply migrations automatically on the next boot.
