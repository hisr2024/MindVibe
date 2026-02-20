# MindVibe Security & Scalability Review

**Date:** 2026-02-06
**Scope:** Full-stack security audit + scalability assessment
**Stack:** Next.js 16 + FastAPI + PostgreSQL + Redis + OpenAI

---

## Executive Summary

MindVibe has a solid security foundation with multiple middleware layers (DDoS, threat detection, input sanitization, CSRF, RBAC), bcrypt password hashing, JWT authentication with refresh token rotation, 2FA support, and Pydantic input validation. However, several **critical and high-severity issues** exist that must be addressed before scaling to production users handling sensitive spiritual wellness data.

**Critical findings:** 5 | **High severity:** 8 | **Medium severity:** 9 | **Low severity:** 6

---

## CRITICAL FINDINGS (Fix Immediately)

### C1. Authentication Bypass via `X-Auth-UID` Header

**Files:**
- `backend/deps.py:234-248` (`get_current_user_or_create`)
- `backend/deps.py:306-318` (`get_current_user_flexible`)

**Issue:** The `X-Auth-UID` header is accepted as a standalone authentication mechanism. Any HTTP client can set this header to impersonate any user by passing a valid user ID.

```python
# deps.py:234 - Anyone can set this header
x_auth_uid = request.headers.get("X-Auth-UID")
auth_uid = (x_auth_uid or "").strip()
if auth_uid and auth_uid not in {"undefined", "null"}:
    stmt = select(User).where(User.auth_uid == auth_uid, ...)
    # Auto-creates user if doesn't exist!
```

In `get_current_user_or_create`, a user is **automatically created** if the `X-Auth-UID` doesn't match an existing user. In `get_current_user_flexible`, it looks up by `User.id` directly, meaning any attacker who knows (or guesses) a UUID can access another user's account.

**Impact:** Full account takeover. Any attacker can access any user's spiritual wellness data.

**Remediation:**
1. Remove `X-Auth-UID` as an authentication method entirely
2. If needed for internal service-to-service calls, restrict it to requests from trusted IPs or require a shared secret header alongside it
3. Replace all `Depends(get_current_user_or_create)` and `Depends(get_current_user_flexible)` with `Depends(get_current_user)` which only accepts JWT tokens
4. Audit every route to identify which ones use the weaker auth dependencies

### C2. Automatic Anonymous User Creation in Production

**File:** `backend/deps.py:250-261`

**Issue:** `get_current_user_or_create` creates a "dev-anon" user as a fallback when no authentication is provided. This was designed for development but runs in production.

```python
# Fallback to dev-anon user for local/dev workflows
stmt = select(User).where(User.auth_uid == "dev-anon", ...)
user = result.scalar_one_or_none()
if not user:
    user = User(auth_uid="dev-anon", locale="en")
    db.add(user)
    await db.commit()
```

**Impact:** Unauthenticated users get database access. All requests without tokens share the same "dev-anon" account, meaning unauthenticated users can read each other's data through this shared account.

**Remediation:**
1. Guard this path with `if os.getenv("ENVIRONMENT") != "production"`
2. In production, always raise `401 Unauthorized` when no valid token is provided
3. Better yet: remove this function entirely and use `get_current_user` everywhere

### C3. Access Tokens Stored in localStorage (XSS Vulnerable)

**Files:**
- `hooks/useAuth.ts:47-49` (stores tokens)
- `lib/api.ts:44-57` (reads and sends tokens)
- Multiple page components read from localStorage

**Issue:** Access tokens and session IDs are stored in `localStorage`, which is accessible to any JavaScript running on the page. The code even has deprecation warnings acknowledging this risk:

```typescript
// lib/api.ts:40-57
// DEPRECATED: localStorage token storage - migrate to httpOnly cookies
// Security Risk: Tokens in localStorage are vulnerable to XSS attacks.
const accessToken = localStorage.getItem('mindvibe_access_token')
```

The backend already sets httpOnly cookies (`backend/routes/auth.py:313-320`), but the frontend hasn't been migrated to use them exclusively.

**Impact:** Any XSS vulnerability (even via a third-party script) allows complete token theft and account takeover.

**Remediation:**
1. Complete the migration to httpOnly cookies (the backend already sets them)
2. Remove all `localStorage.setItem(ACCESS_TOKEN_KEY, ...)` calls
3. Remove `Authorization: Bearer` header injection from `apiFetch()`
4. The backend already reads `access_token` from cookies - rely on this exclusively
5. For auth state in the frontend, call `/api/auth/me` on mount instead of reading localStorage

### C4. CSRF Protection Bypassed for Most Endpoints

**File:** `backend/middleware/csrf.py:30-92`

**Issue:** The CSRF exempt list is so extensive that most state-changing endpoints skip CSRF validation entirely:

```python
CSRF_EXEMPT_PATHS: Set[str] = {
    "/api/auth/login",
    "/api/auth/signup",
    "/api/chat/message",          # State-changing!
    "/api/journeys/access",       # State-changing!
    "/api/journeys/start",        # State-changing!
    "/api/journey-engine/journeys", # State-changing!
    "/kiaan/divine-chat",         # State-changing!
    "/kiaan/synthesize",          # State-changing!
    "/kiaan/soul-reading",        # State-changing!
    "/api/karmic-tree/progress",  # State-changing!
    "/api/profile",               # State-changing!
    "/api/subscriptions/current", # State-changing!
    # ... 40+ exempt paths
}
```

Additionally, at `csrf.py:194`, CSRF is skipped entirely when `Authorization` or `X-Auth-UID` headers are present:

```python
if request.headers.get("Authorization") or request.headers.get("X-Auth-UID"):
    return await call_next(request)
```

Since the frontend sends `Authorization: Bearer` on every request (from localStorage), CSRF protection is effectively **never enforced**.

**Impact:** Cross-site request forgery attacks can perform any action on behalf of authenticated users.

**Remediation:**
1. Remove the Authorization/X-Auth-UID bypass in CSRF middleware (line 194)
2. Once you migrate to httpOnly cookies (C3), CSRF protection becomes essential
3. Reduce the exempt list to only: health checks, webhooks (which have their own signature verification), and login/signup
4. For cross-origin API calls from Next.js server components, use a server-side API key instead of exempting paths

### C5. Journey Error Handler Returns 200 for 500 Errors

**File:** `backend/main.py:234-244`

**Issue:** The global exception handler returns HTTP 200 for journey endpoints when a server error occurs:

```python
if "/journeys/" in request.url.path or "/journey-engine/" in request.url.path:
    return JSONResponse(
        status_code=200,  # Return 200 to allow frontend fallback
        content={"error": "server_error", ...},
    )
```

**Impact:** This masks real errors from monitoring, breaks HTTP semantics, and could cause the frontend to process error responses as success. Retry logic and circuit breakers won't work correctly.

**Remediation:**
1. Return proper HTTP status codes (503 for service unavailable)
2. Handle graceful degradation in the frontend by checking the response body, not the status code
3. Use a dedicated error response schema that the frontend can handle uniformly

---

## HIGH SEVERITY FINDINGS

### H1. Monitoring Endpoints Expose System Internals Without Authentication

**File:** `backend/monitoring/health.py:17-143`

**Issue:** Three endpoints are publicly accessible without any authentication:

| Endpoint | Data Exposed |
|----------|-------------|
| `/api/monitoring/health/detailed` | Database latency, CPU/memory/disk usage, OpenAI key presence |
| `/api/monitoring/metrics` | Total users, active users, message volume |
| `/api/monitoring/security/status` | DDoS config, rate limits, circuit breaker states |

**Remediation:**
1. Add `Depends(get_current_user)` with admin role check to all monitoring endpoints
2. Or create a separate monitoring API key for external monitoring services
3. The basic `/health` endpoint can remain unauthenticated for load balancer checks, but should only return `{"status": "ok"}`

### H2. Debug Endpoints in Production

**File:** `backend/routes/journey_engine.py:868-955`

**Issue:** Two debug endpoints are accessible in production:
- `GET /api/journey-engine/debug/my-journeys` - Exposes raw database records including soft-deleted data
- `DELETE /api/journey-engine/debug/clear-all-journeys` - Allows mass data deletion

While these require authentication, they expose internal database structure and allow destructive operations.

**Remediation:**
1. Remove debug endpoints entirely, or
2. Gate behind `ENVIRONMENT != "production"` check
3. If needed for admin troubleshooting, move to admin routes with admin role verification

### H3. Weak Content Security Policy

**File:** `backend/middleware/security.py:51-61`

**Issue:** CSP includes `'unsafe-inline'` for both scripts and styles:

```python
"script-src 'self' 'unsafe-inline'; "
"style-src 'self' 'unsafe-inline'; "
```

`'unsafe-inline'` for `script-src` effectively negates XSS protection from CSP, since injected inline scripts will execute.

**Remediation:**
1. Remove `'unsafe-inline'` from `script-src`
2. Use nonce-based CSP: generate a random nonce per request, add it to the CSP header and to `<script nonce="...">` tags
3. For styles, `'unsafe-inline'` is less critical but can be replaced with hash-based CSP
4. Next.js has built-in CSP nonce support via `next.config.js`

### H4. Information Disclosure in Auth Error Messages

**File:** `backend/routes/auth.py`

**Issue:** Error messages reveal internal state:

| Line | Message | Leaks |
|------|---------|-------|
| 241 | `"Account locked. Try again in {remaining} minutes."` | Account existence + lock status |
| 206 | `"Email already registered"` | Account enumeration |
| 282 | `"Two-factor secret missing"` | Internal config state |
| 277 | `"Two-factor code required"` | 2FA is enabled (confirms account exists) |

**Remediation:**
1. Use a single generic message for all login failures: `"Invalid email or password"`
2. For signup, use `"If this email is available, a confirmation will be sent"` pattern
3. Return 2FA requirement only after validating credentials (currently correct), but use a generic `"additional_verification_required"` code without specifying the method

### H5. Database SSL Certificate Verification Disabled

**Files:**
- `backend/deps.py:47-54` (Render environment)
- `backend/deps.py:67-71` (default `require` mode)

**Issue:** SSL certificate verification is disabled in multiple paths:

```python
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl_module.CERT_NONE
```

The default SSL mode is `require` which uses SSL encryption but doesn't verify the server's certificate. This applies to ALL environments, not just Render.

**Impact:** Man-in-the-middle attacks on the database connection. An attacker on the network path could intercept all database traffic.

**Remediation:**
1. For Render: Use Render's CA certificate and set `verify-full` mode
2. For other environments: Default to `verify-full` instead of `require`
3. Make `CERT_NONE` an explicit opt-in that requires both `DB_SSL_MODE=require-no-verify` AND `ENVIRONMENT=development`
4. Log a critical warning (not just info) when certificate verification is disabled in production

### H6. WebSocket Authentication via Query Parameters

**File:** `backend/routes/chat_rooms.py:271-279`

**Issue:** WebSocket authentication accepts tokens via query parameters as a deprecated fallback:

```python
token = websocket.query_params.get("token")
if token:
    ws_logger.warning("WebSocket auth via query param (DEPRECATED)...")
```

**Impact:** Tokens in query parameters are logged in server access logs, browser history, proxy logs, and Referer headers.

**Remediation:**
1. Remove the query parameter fallback entirely
2. The `Sec-WebSocket-Protocol` header method is already implemented and should be the only method

### H7. Backup Codes Stored in Plaintext

**File:** `backend/routes/auth.py:492-497`

**Issue:** MFA backup codes are stored as plaintext in the database:

```python
backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
await db.execute(
    update(User).where(User.id == user.id)
    .values(mfa_backup_codes=backup_codes)  # Plaintext!
)
```

**Impact:** If the database is compromised, backup codes are immediately usable to bypass 2FA.

**Remediation:**
1. Hash each backup code with bcrypt before storage
2. When validating, check each stored hash against the provided code
3. Mark used codes by removing their hash from the list

### H8. JWT Uses HS256 with Shared Secret

**File:** `backend/security/jwt.py:20-25`

**Issue:** JWT tokens use HS256 (symmetric) algorithm:

```python
jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
```

The same `SECRET_KEY` is used for both signing and verification. If this key leaks (environment variable exposure, log leak, backup), anyone can mint valid tokens for any user.

**Remediation:**
1. Migrate to RS256 or EdDSA (asymmetric) - the codebase already has EdDSA support infrastructure (`keyset_eddsa/` directory, `EDDSA_ENABLED` env var)
2. Enable EdDSA dual-sign mode first, then migrate fully
3. With asymmetric keys: the signing key stays on the server, verification keys can be distributed

---

## MEDIUM SEVERITY FINDINGS

### M1. Password Policy Missing Special Character Requirement

**File:** `backend/security/password_policy.py:18-34`

**Issue:** Password policy requires uppercase, lowercase, and digit, but no special characters. No maximum length enforcement. No common password check.

**Remediation:**
1. Require at least one special character
2. Check against a list of common passwords (e.g., top 10,000)
3. Set a maximum length (e.g., 128 chars) to prevent bcrypt DoS (bcrypt truncates at 72 bytes)

### M2. Rate Limits Too Permissive for Sensitive Endpoints

**File:** `backend/main.py:164` and `backend/middleware/rate_limiter.py`

**Issue:** DDoS protection allows 100 requests/minute globally. Auth endpoints use the `AUTH_RATE_LIMIT` but should be more restrictive for:
- Password reset
- 2FA verification (brute-forceable with 6-digit codes)
- Account enumeration via signup

**Remediation:**
1. Auth endpoints: 5 requests/minute per IP
2. 2FA verification: 3 attempts/minute per user (already rate limited, but verify the limit)
3. Signup/password reset: 3 requests/minute per IP
4. Chat/AI endpoints: 30 requests/minute per user (not per IP)

### M3. CORS Allows HTTP Localhost in All Environments

**File:** `backend/main.py:53-58`

**Issue:** Default CORS origins include `http://localhost:3000` and `http://localhost:3001`. If `CORS_ALLOWED_ORIGINS` is not set in production, these are included.

**Remediation:**
1. Set `CORS_ALLOWED_ORIGINS` explicitly in production environment variables
2. Never include HTTP origins in production CORS config
3. Add a startup check: if `ENVIRONMENT == "production"` and any origin starts with `http://`, log a critical warning

### M4. Insecure Cookie Settings in Development

**File:** `backend/main.py:194`

**Issue:** CSRF cookies and access token cookies set `secure=False` in development:

```python
cookie_secure=os.getenv("ENVIRONMENT", "development") == "production",
```

**Remediation:** For local development this is expected (localhost doesn't support HTTPS), but add a startup warning if `ENVIRONMENT` is not explicitly set and defaults to development.

### M5. Global Exception Handler Leaks Error Details in Debug Mode

**File:** `backend/main.py:251`

**Issue:**
```python
"message": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An unexpected error occurred",
```

If `DEBUG=true` is accidentally set in production, full exception details (including stack traces, query text, internal paths) leak to clients.

**Remediation:**
1. Never return `str(exc)` to clients, even in debug mode
2. Instead, log the full exception server-side and return a correlation ID
3. Add guardrail: if `ENVIRONMENT == "production"`, ignore `DEBUG` flag for error responses

### M6. No Account Lockout Notification

**File:** `backend/routes/auth.py:252-253`

**Issue:** When an account is locked after 5 failed attempts, the user is not notified (e.g., via email). An attacker could lock out a legitimate user without the user knowing.

**Remediation:**
1. Send an email notification when an account is locked
2. Include the IP address that triggered the lockout
3. Provide a secure unlock mechanism (email link) that doesn't require waiting 30 minutes

### M7. Session Not Bound to IP or User-Agent

**File:** `backend/routes/auth.py:293`

**Issue:**
```python
session = await create_session(db, user_id=user.id, ip=None, ua=None)
```

Sessions are created without binding to IP address or user agent, even though the function accepts these parameters. A stolen token can be used from any IP or device.

**Remediation:**
1. Capture and store `request.client.host` and `request.headers.get("User-Agent")`
2. Optionally validate these on subsequent requests (or at least flag session anomalies)
3. At minimum, log session IP/UA for audit purposes

### M8. No Content-Length Limit on Request Bodies

**Issue:** While DDoS middleware limits total request size to 10MB, there's no specific limit on JSON body parsing. Large JSON payloads could cause memory issues or slowdowns.

**Remediation:**
1. Set explicit `max_content_length` on the FastAPI app
2. Add Pydantic `max_length` constraints on all string fields
3. The 10MB DDoS limit is reasonable for file uploads but too generous for JSON API calls (1MB should be the limit)

### M9. `connect-src 'self'` in CSP Blocks Required External APIs

**File:** `backend/middleware/security.py:57`

**Issue:** `connect-src 'self'` restricts fetch/XHR requests to the same origin only. This would block connections to external APIs (OpenAI, Sarvam, etc.) if the CSP header is actually enforced on frontend pages. Currently, since the frontend is served by Next.js and the backend CSP only applies to API responses, this may not be an issue - but it indicates the CSP isn't tuned for the actual frontend.

**Remediation:**
1. Set CSP headers on the Next.js frontend (in `next.config.js`) instead of or in addition to the backend
2. Add required external domains to `connect-src`
3. Use `Content-Security-Policy-Report-Only` first to identify violations

---

## LOW SEVERITY FINDINGS

### L1. Subprocess Usage Without Full Input Sanitization

**Files:**
- `backend/services/speech_modules/providers/festival.py:71`
- `backend/services/speech_modules/providers/espeak.py:75`
- `backend/services/kiaan_extended_tools.py` (multiple locations)

**Issue:** Uses `asyncio.create_subprocess_exec` for TTS providers. While `subprocess_exec` is safer than `subprocess_shell`, inputs should still be validated.

**Remediation:** Validate that text inputs to TTS don't contain shell metacharacters. Use allowlists for voice/language parameters.

### L2. Missing `__all__` Exports in Security Modules

**Issue:** Security modules don't restrict their public API, making it easy to accidentally import internal functions.

**Remediation:** Add `__all__` to all security module `__init__.py` files.

### L3. Docker Compose Exposes Database Port

**File:** `docker-compose.yml:14-15`

**Issue:** PostgreSQL port 5432 is mapped to the host, making the database accessible from outside the container network.

**Remediation:**
1. Remove the `ports` mapping for the `db` service in production compose files
2. Only expose in development with an explicit `docker-compose.dev.yml` override

### L4. No Structured Logging Format

**Issue:** Logging uses basic `%(message)s` format without structured fields (JSON). This makes log aggregation and security event correlation difficult at scale.

**Remediation:** Use `python-json-logger` or `structlog` for JSON-formatted logs with consistent fields (timestamp, level, request_id, user_id, etc.)

### L5. Frontend API URL Hardcoded as Fallback

**File:** `next.config.js:20`

**Issue:**
```javascript
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com',
```

The production API URL is hardcoded as a fallback. If the environment variable is accidentally unset, the frontend silently uses the hardcoded URL.

**Remediation:** Fail loudly if `NEXT_PUBLIC_API_URL` is not set in production.

### L6. OpenAI API Key Length Logged at Startup

**File:** `backend/main.py:27`

```python
startup_logger.info(f"   Length: {len(OPENAI_API_KEY) if OPENAI_API_KEY else 0}")
```

**Issue:** Logging the key length provides an attacker with information to narrow down the key space.

**Remediation:** Only log `"OPENAI_API_KEY: configured"` or `"OPENAI_API_KEY: missing"`.

---

## SCALABILITY ASSESSMENT

### Current Architecture

```
[Browser] → [Vercel/CDN] → [Next.js Frontend]
                                   │
                                   ▼ (proxy rewrite)
                            [FastAPI Backend] → [PostgreSQL]
                                   │                │
                                   ▼                ▼
                              [Redis Cache]   [OpenAI API]
```

### Bottleneck Analysis

| Component | Current Limit | Bottleneck At | Solution |
|-----------|--------------|---------------|----------|
| FastAPI (single instance) | ~1K RPS | 500 concurrent users | Horizontal scaling (Render/Fly auto-scale) |
| PostgreSQL (single) | ~10K QPS | 2K concurrent users | Read replicas + connection pooling |
| DB Connection Pool | 30 + 10 overflow | 40 concurrent DB operations | Increase pool or add PgBouncer |
| Redis (single) | ~50K ops/sec | 10K concurrent users | Redis Cluster |
| OpenAI API | Rate-limited by OpenAI | Depends on tier | Queue + batch + local LLM fallback (already built!) |
| In-memory DDoS tracking | All in process memory | Multiple instances don't share state | Move to Redis-backed rate limiting |

### What's Good (Keep)

1. **Async throughout** - FastAPI + asyncpg + aiohttp means the backend can handle many concurrent connections efficiently
2. **Connection pool tuning via env vars** - `DB_POOL_SIZE`, `DB_MAX_OVERFLOW` are configurable without code changes
3. **Local LLM fallback** - Ollama/LM Studio support means the app works when OpenAI is down
4. **Offline-first design** - IndexedDB + Service Worker means the frontend works without connectivity
5. **Redis caching layer** - Already built and configurable
6. **Circuit breaker middleware** - Prevents cascade failures to downstream services

### What Needs Work (Fix for Scale)

#### S1. In-Memory Rate Limiting Doesn't Scale Horizontally

**Files:**
- `backend/middleware/ddos_protection.py` (uses `defaultdict`, `deque` in process memory)
- `backend/middleware/rate_limiter.py` (uses `slowapi` with in-memory storage)

**Issue:** Rate limiting state is stored in process memory. When you scale to multiple API instances behind a load balancer, each instance tracks limits independently. An attacker can bypass rate limits by having their requests distributed across instances.

**Fix:**
1. Use Redis-backed storage for slowapi: `Limiter(storage_uri="redis://...")`
2. Move DDoS tracking to Redis with atomic increments
3. The `RATE_LIMIT_STORAGE` env var exists but needs to be wired up

#### S2. No Database Migration Lock

**File:** `backend/main.py:335-336`

**Issue:** Migrations run on startup (`RUN_MIGRATIONS_ON_STARTUP=true`). With multiple instances starting simultaneously, migration race conditions can occur.

**Fix:**
1. Use advisory locks in PostgreSQL before running migrations
2. Or run migrations as a separate one-time job, not on app startup
3. Set `RUN_MIGRATIONS_ON_STARTUP=false` in production and use a deploy hook

#### S3. WebSocket Scaling

**File:** `backend/routes/chat_rooms.py`

**Issue:** WebSocket connections are managed in-process. With multiple instances, users in the same chat room but connected to different instances won't see each other's messages.

**Fix:**
1. Use Redis pub/sub as a WebSocket message broker
2. Each instance subscribes to room channels and broadcasts to its local connections
3. Libraries like `broadcaster` can handle this

#### S4. No Database Indexing Strategy Documented

**Issue:** While the ORM models define relationships, there's no evidence of explicit index creation for common query patterns (e.g., `user_journeys.user_id + status`, `chat_messages.user_id + created_at`).

**Fix:**
1. Audit slow queries with `pg_stat_statements`
2. Add composite indexes for common WHERE + ORDER BY patterns
3. Add partial indexes for soft-delete queries (`WHERE deleted_at IS NULL`)

#### S5. Large Model Files (128KB+ single files)

**Files:**
- `backend/models/base.py` (128KB - 50+ models in one file)
- `backend/services/kiaan_core.py` (78KB)
- `backend/services/kiaan_divine_voice.py` (109KB)
- `backend/services/wellness_model.py` (120KB)

**Issue:** These files are too large for efficient code review, testing, and modification. Changes to any model require loading the entire 128KB file.

**Fix:**
1. Split `models/base.py` into domain-specific model files (e.g., `models/user.py`, `models/journey.py`, `models/chat.py`)
2. Split large service files into focused modules
3. This improves developer velocity and reduces merge conflicts at scale

---

## ACTIONABLE REMEDIATION PLAN

### Phase 1: Critical Security (Week 1)

| # | Action | File(s) | Effort |
|---|--------|---------|--------|
| 1 | Remove `X-Auth-UID` authentication fallback | `deps.py` | Small |
| 2 | Remove `dev-anon` user creation in production | `deps.py` | Small |
| 3 | Complete localStorage→httpOnly cookie migration | `useAuth.ts`, `api.ts`, page components | Medium |
| 4 | Fix CSRF middleware to actually enforce protection | `csrf.py` | Medium |
| 5 | Return proper HTTP status codes for errors | `main.py` | Small |

### Phase 2: High Severity (Week 2)

| # | Action | File(s) | Effort |
|---|--------|---------|--------|
| 6 | Add auth to monitoring endpoints | `monitoring/health.py` | Small |
| 7 | Remove or gate debug endpoints | `journey_engine.py` | Small |
| 8 | Strengthen CSP (remove unsafe-inline) | `security.py`, `next.config.js` | Medium |
| 9 | Genericize auth error messages | `auth.py` | Small |
| 10 | Enable DB SSL certificate verification | `deps.py` | Small |
| 11 | Remove WebSocket query param auth | `chat_rooms.py` | Small |
| 12 | Hash MFA backup codes | `auth.py` | Small |
| 13 | Enable EdDSA JWT signing | `jwt.py`, env config | Medium |

### Phase 3: Scalability (Week 3-4)

| # | Action | File(s) | Effort |
|---|--------|---------|--------|
| 14 | Move rate limiting to Redis | `ddos_protection.py`, `rate_limiter.py` | Medium |
| 15 | Add database advisory lock for migrations | `main.py`, `migrations.py` | Small |
| 16 | Add Redis pub/sub for WebSocket scaling | `chat_rooms.py` | Large |
| 17 | Audit and add database indexes | migrations | Medium |
| 18 | Split large model/service files | `models/base.py`, services | Large |

### Phase 4: Hardening (Ongoing)

| # | Action | File(s) | Effort |
|---|--------|---------|--------|
| 19 | Add structured JSON logging | `main.py`, all loggers | Medium |
| 20 | Strengthen password policy | `password_policy.py` | Small |
| 21 | Bind sessions to IP/UA | `auth.py`, `session_service.py` | Small |
| 22 | Add security scanning to CI/CD | `.github/workflows/` | Medium |
| 23 | Implement CSP nonce-based policy | Next.js config + middleware | Medium |

---

## WHAT'S ALREADY DONE WELL

These are genuine strengths of the codebase that should be preserved:

1. **Layered middleware architecture** - DDoS → Threat Detection → Input Sanitization → Security Headers → CSRF → Rate Limiting
2. **bcrypt password hashing** with proper salt generation (`backend/security/password_hash.py`)
3. **Refresh token rotation** with reuse detection (`backend/services/refresh_service.py`)
4. **2FA support** with TOTP and backup codes (`backend/routes/auth.py`)
5. **Session management** with expiry, revocation, and multi-session listing
6. **Soft deletes** throughout (data recovery, audit trail)
7. **Pydantic validation** on request schemas
8. **HSTS, X-Frame-Options, X-Content-Type-Options** security headers
9. **Brute force protection** with account lockout after 5 failed attempts
10. **Secret key validation** that fails hard in production with weak keys (`backend/core/settings.py:49-59`)
11. **Offline-first architecture** with local LLM fallback (excellent for resilience)
12. **Circuit breaker pattern** for external service calls
13. **GDPR compliance routes** for data export and deletion
14. **Encryption support** for sensitive reflection data (`MINDVIBE_REFLECTION_KEY`)

---

## SECURITY CHECKLIST FOR DEVELOPERS

Use this checklist before every PR:

```
[ ] No secrets in code or logs
[ ] No localStorage for authentication tokens
[ ] All new endpoints use Depends(get_current_user) - not flexible/or_create variants
[ ] All state-changing endpoints have CSRF protection
[ ] Input validated with Pydantic (max_length on strings, ranges on numbers)
[ ] Error messages don't reveal internal state
[ ] No raw SQL without parameterized queries
[ ] Sensitive data never logged (user content, tokens, passwords)
[ ] New database queries use existing indexes (check with EXPLAIN)
[ ] Tests cover both happy path and error cases
[ ] No debug/dev-only code paths reachable in production
```
