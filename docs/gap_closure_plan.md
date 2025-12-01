# Comprehensive Gap Closure Plan

This plan turns the missing components list into an actionable, end-to-end implementation guide. It covers backend, frontend, infrastructure, security, and documentation so each gap can be delivered with production-grade quality.

## Core Backend

### Rate Limiting
- **Approach:** Use a middleware-based limiter (e.g., `slowapi` with Redis backend) to enforce per-IP and per-user quotas.
- **Policy matrix:**
  - Public unauthenticated: 30 req/minute, burst 10.
  - Authenticated free plan: 60 req/minute, burst 20.
  - Paid plans: 300–1200 req/minute tiers aligned to subscription.
- **Implementation steps:**
  1. Add Redis connection helper and fallback in-memory store for dev.
  2. Create `RateLimitMiddleware` with decorators for routes and global protection on `/api/*`.
  3. Expose headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.
  4. Emit structured events for breaches to observability pipeline.

### Background Jobs
- **Approach:** Celery with Redis/Redis-Cluster; FastAPI `lifespan` verifies broker connectivity on startup.
- **Job categories:**
  - Report generation, email notifications, subscription sync, metrics export.
  - Long-running AI tasks queued via Celery + AsyncResult polling API.
- **Implementation steps:**
  1. Add `worker/` package with Celery app, beat schedule, and task modules.
  2. Provide `/api/jobs/status/{task_id}` endpoint for tracking.
  3. Use durable queues and exponential backoff retries; dead-letter queue for poison messages.
  4. Add health check for broker/worker to `/api/health`.

### Feature Gates (Plans)
- **Approach:** Central `PlanGateMiddleware` already exists; extend with plan registry and feature flags.
- **Implementation steps:**
  1. Define `plans.yml` describing limits and enabled features.
  2. Add helper `has_feature(user, feature_key)` used in routers and services.
  3. Return `402 Payment Required` for blocked features with upgrade metadata.
  4. Cache plan lookups with Redis to minimize DB load.

### API Versioning
- **Approach:** Namespace routers (`/api/v1`, `/api/v2`) with compatibility shims.
- **Implementation steps:**
  1. Add `APIRouter(prefix="/api/v1")` wrappers around existing routers.
  2. Introduce deprecation headers `Sunset`, `Deprecation`, and changelog links.
  3. Maintain contract tests per version to prevent breaking changes.

## Subscriptions & Billing

### Stripe Integration
- **Approach:** Stripe Checkout + Billing Portal; webhook handler with signature verification.
- **Implementation steps:**
  1. Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_IDS` env vars.
  2. Create `/api/billing/webhook` to process `checkout.session.completed`, `customer.subscription.updated/deleted`.
  3. Persist `customer_id`, `subscription_id`, `status`, `current_period_end` on user profile.
  4. Implement idempotency with `request-id` headers and webhook event replay protection.

### Subscription Middleware & Feature Gating
- Extend `PlanGateMiddleware` to inspect subscription status; cache state; short-circuit unauthorized access with JSON error payloads.

## Frontend & UX

### i18n Setup
- **Approach:** Next.js `app/` with `next-intl` or `@lingui`. Locale switcher, translation JSONs per namespace.
- **Implementation steps:**
  1. Create `locales/{en,es,fr,hi}/common.json` with existing copy migrated.
  2. Wrap layout with `NextIntlClientProvider` and `getTranslator` in server routes.
  3. Add language selector in nav; persist preference in cookie.

### Accessibility Fixes
- Run automated audits (axe/lighthouse) and patch:
  - Ensure all form controls have labels, color contrast meets WCAG AA, focus outlines restored.
  - Add `aria-live` regions for chat responses and loading states.
  - Provide keyboard traps prevention in dialogs and skip-to-content link.

### `/health` Endpoint
- **Approach:** Simple JSON route in `app/api/health/route.ts` that reports version, uptime, database, queue, and Stripe connectivity.
- **Frontend surfacing:** Add `/health` link in `README` and monitoring docs; optional status badge.

## Testing & CI/CD
- **Unified Test Coverage:**
  - Backend: pytest with async support; coverage thresholds (85%).
  - Frontend: Vitest/Playwright for components + e2e; axe accessibility tests in CI.
- **CI Pipeline:**
  - Lint (`ruff`, `mypy`, `eslint`, `prettier --check`), tests, coverage upload.
  - Build artifacts (Next.js static export, Docker images) and vulnerability scan (Trivy/Bandit).

## Observability
- **Prometheus:** Expose `/metrics` via `prometheus-fastapi-instrumentator`; scrape config in `infra/`.
- **Tracing:** OpenTelemetry SDK with OTLP exporter; instrument FastAPI, Celery, HTTP clients, PostgreSQL.
- **Sentry:** DSN from env; release + environment tags; PII scrubbing enabled by default.
- **Structured Logging:** Use `structlog` with JSON output, correlation IDs, and request span IDs propagated to workers.

## Security
- **Advanced Secrets Management:**
  - Source secrets from Vault/Parameter Store; prohibit plaintext .env in production.
  - Rotate keys via CI workflows; enforce secrets scanning (Trufflehog/Gitleaks) in pipeline.
- **Crisis Trigger Redirection:**
  - Add crisis phrases list; middleware redirects/chatbot responds with crisis resources and bypasses normal flow.
  - Log anonymized event for safety metrics without storing conversation text.

## Compliance
- **Data Export/Delete Lifecycle:**
  - Implement GDPR endpoints: `/api/me/export` (async job to bundle user data) and `/api/me/delete` (soft-delete -> delayed purge job).
  - Track audit trails for requests; verify email ownership before processing.
- **Backup/Disaster Recovery:**
  - Daily encrypted backups (database + uploads) with retention policy; document restore runbook; quarterly restore drills.

## Documentation
- **Centralized Index:** Create `docs/index.md` linking onboarding, architecture, operations, and runbooks.
- **Architecture Diagram:** Maintain in `docs/architecture/` with source (e.g., Mermaid) plus rendered PNG; cover data flow, queues, monitoring stack.

## Delivery Checklist
- [ ] Add rate limiting middleware and config.
- [ ] Stand up Celery worker + broker health checks.
- [ ] Integrate Stripe and subscription persistence.
- [ ] Ship `/api/health` endpoint and monitoring hooks.
- [ ] Add i18n scaffolding and accessibility fixes.
- [ ] Implement CI workflow covering lint/test/build/scan.
- [ ] Add Prometheus metrics, tracing, Sentry, and structured logs.
- [ ] Harden secrets management and crisis response.
- [ ] Provide export/delete workflows and backup SOP.
- [ ] Publish docs index and architecture diagram.
