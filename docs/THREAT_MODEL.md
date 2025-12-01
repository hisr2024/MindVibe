# Threat Modeling and Vulnerability Management

This document captures a STRIDE-inspired threat model for the MindVibe platform and establishes security scanning expectations for code and dependencies.

## System overview
- **Frontend**: Next.js web client communicating with the API over HTTPS.
- **Backend**: FastAPI service with JWT/EdDSA authentication, rate limits, and role-aware endpoints.
- **Data plane**: PostgreSQL database storing user content; optional LLM provider integrations (e.g., OpenAI).
- **Delivery**: CI/CD pipelines building Docker images and deploying to Fly.io/Vercel or equivalent targets.

## STRIDE analysis
| Component | Spoofing | Tampering | Repudiation | Information disclosure | Denial of service | Elevation of privilege |
| --- | --- | --- | --- | --- | --- | --- |
| Auth & session | Enforce JWT + EdDSA validation; require HTTPS and secure cookies for browser flows. | Sign payloads and validate claims; store signing keys in KMS/secret manager. | Audit login/logout, MFA, and token issuance events with request metadata. | Avoid exposing PII in tokens; minimize JWT claims. | Rate-limit login, token refresh, and password reset. | Role-based checks on admin/service endpoints; avoid wildcard scope grants. |
| API layer | Enforce API keys for privileged routes; mutual TLS for internal calls. | Input validation and request schema enforcement; prefer idempotent endpoints. | Structured request/response logging with request IDs. | Use allowlists for CORS and headers; redact secrets in logs. | Apply WAF + rate limits; short circuit expensive LLM calls when thresholds exceeded. | Service accounts scoped to the minimum permissions; verify caller identity on cross-service hops. |
| Data storage | Strong auth for DB connections (rotated passwords or IAM roles). | Use parameterized queries and migrations; integrity checks on critical tables. | Retain audit trails for schema changes and admin actions. | Encrypt data at rest; field-level encryption for sensitive columns; protect backups. | Connection pooling with resource caps; autoscaling with alerts on saturation. | Separate admin and application roles; least-privilege for maintenance jobs. |
| CI/CD & supply chain | Sign images and artifacts; enforce branch protections. | Protect pipelines from untrusted inputs; pin build tool versions. | Preserve build logs with tamper-evident storage and PR attribution. | Scan artifacts for secrets; restrict access to signing keys. | Concurrency limits and retry budgets for builds; isolate runners. | Scoped deploy tokens; approval gates for production and secrets rotation. |

## Bandit findings triage
- Run `bandit -r backend -f json -o bandit-report.json` in CI to refresh findings on every PR.
- Triage each finding with one of: **fix immediately**, **accepted risk** (with justification), or **false positive** (with evidence such as code path or sanitizer).
- Capture triage outcomes as PR comments and add suppression only with in-code justification (`# nosec`) referencing the issue ID.
- Keep `bandit-report.json` checked in for auditability; update it when findings change and document rationale in the PR description.

## Dependency vulnerability scanning
- **Python**: Run `pip-audit -r requirements.txt -r requirements-dev.txt --strict` or `safety check` in CI. Fail the pipeline on critical/high issues unless explicitly waived with an expiration date.
- **JavaScript/TypeScript**: Run `npm audit --audit-level=high` (or `pnpm audit`) and triage advisories; prefer automated Dependabot updates.
- **Containers**: Scan built images with `trivy image` before promotion; block releases with unpatched critical CVEs.
- Track waivers in issues labeled `security-waiver` with owners and review dates.

## Required controls
- Treat secrets as environment variables injected per-environment (see `docs/ENV_VARS.md`); never commit keys or tokens.
- Install pre-commit hooks with `pre-commit install --hook-type pre-commit --hook-type pre-push` so `gitleaks` and formatters run locally before commits and pushes.
- Ensure CI runs `pre-commit run --all-files` and security scanners (Bandit, dependency audits) on every PR and scheduled security sweeps.
