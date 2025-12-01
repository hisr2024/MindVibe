# Environment Variables and Secrets Management

Use environment variables for all configuration across environments. Do not commit secrets or credentials to the repository; only non-sensitive defaults belong in `.env.example`.

## Environment-specific files

| Environment | File | Purpose |
| --- | --- | --- |
| Local development | `.env.development` | Developer-specific values; can load via `docker-compose` or `uvicorn --env-file`. |
| Automated tests | `.env.test` | Isolated credentials/seeds for integration tests; never reused for dev/prod. |
| Staging/preview | `.env.staging` or platform-specific secrets | Rotated secrets for pre-production systems; mirror production feature flags but with non-production data. |
| Production | Injected via host/CI secret manager (no committed file) | Secrets provided by the hosting platform (e.g., Fly.io, Vercel, Kubernetes, GitHub Actions) or a vault provider. |

### Loading order
- Runtime should prioritize the environment-specific file or injected variables, falling back to `.env.example` **only** for placeholder defaults.
- CI jobs must fail if required variables are missing; do not silently default to unsafe values.

## Required variables

Backend and frontend services rely on the following keys. Use distinct values per environment and rotate regularly.

- `DATABASE_URL` – PostgreSQL connection string for the target environment.
- `JWT_SECRET` – HS256 signing key for **development only**. In production prefer EdDSA keys or HSM/KMS-backed signing.
- `EDDSA_ENABLED` / `EDDSA_DUAL_SIGN` – Feature toggles controlling EdDSA signing and dual-signing behavior.
- `EDDSA_KEYSET_DIR` – Path to local key material for development; production should reference mounted secrets or KMS URIs.
- `API_URL` / `FRONTEND_URL` – Base URLs for API and web clients.
- `NEXT_PUBLIC_API_URL` – Browser-visible API endpoint; never expose secrets without the `NEXT_PUBLIC_` prefix.
- `OPENAI_API_KEY` – Optional LLM provider key; inject via secret manager only.

## Secrets handling rules
- Use `.env.example` strictly for non-secret placeholders to document required keys.
- For production/staging, source secrets from a dedicated manager (e.g., GitHub Actions secrets, Fly.io/Vercel environment variables, AWS/GCP/Azure secret stores). Avoid baking secrets into Docker images or code.
- Store development secrets in `.env.development` **excluded** from Git (see `.gitignore`).
- Rotate secrets when staff changes, on suspected compromise, or at least quarterly. Document rotations in change management tickets.
- Prefer KMS-managed keys for signing and database credentials over static files. If files are unavoidable, mount them as read-only volumes with restrictive permissions.

## Validation and linting
- Run `pre-commit install --hook-type pre-commit --hook-type pre-push` to ensure gitleaks executes before commits and pushes.
- CI should run `pre-commit run --all-files` to ensure secrets scanning, linting, and formatting across the repository.
- For containerized deployments, verify that the orchestrator injects required variables at startup and fails fast when variables are missing.
