# MindVibe Capacity Limits Report

## Full Multi-User Capacity Analysis (Web App + Mobile App)

**Date:** 2026-02-21
**Analyzed By:** AI Architecture Audit
**Codebase Version:** 1.0.0

---

## 1. Architecture Overview

```
                    USERS (Web + Mobile + PWA)
                              |
                    +---------+---------+
                    |                   |
              [Vercel CDN]      [Mobile App]
              Next.js 16.1      Android (Kotlin/Compose)
              (Serverless)      iOS (Swift)
                    |                   |
                    +------- API -------+
                              |
                    [Render: FastAPI]
                    1-3 instances (auto)
                    Standard Plan
                              |
              +-------+-------+-------+
              |       |       |       |
          [PostgreSQL] [Redis]  [OpenAI] [TTS Providers]
          Render Std   Optional  gpt-4o-mini  Sarvam/ElevenLabs
```

---

## 2. Layer-by-Layer Capacity Limits

### 2.1 Frontend (Vercel - Next.js 16.1)

| Metric | Current Limit | Notes |
|--------|--------------|-------|
| **Concurrent Serverless Functions** | 10-1000 (plan-dependent) | Hobby=10, Pro=1000 |
| **Function Timeout** | 10s (Hobby) / 60s (Pro) | AI streaming calls may timeout on Hobby |
| **Bandwidth** | 100GB/mo (Hobby) / 1TB (Pro) | Audio/voice features consume bandwidth fast |
| **Edge Network** | Global CDN | Static assets served from edge |
| **API Route Concurrency** | Shared with function limit | Each `/app/api/*` route = 1 serverless function |
| **Build Size Limit** | 250MB compressed | Standalone output configured |

**Capacity Estimate (Frontend):**
- **Hobby Plan:** ~50-100 concurrent users (serverless function bottleneck)
- **Pro Plan:** ~500-2,000 concurrent users (before function limits hit)
- **Enterprise:** ~10,000+ concurrent users

**Key Bottleneck:** Vercel API routes that proxy to the backend (`/api/*` fallback rewrites) each consume a serverless function execution. With 40+ API routes, heavy usage saturates function limits quickly.

---

### 2.2 Backend API (Render - FastAPI/Uvicorn)

| Metric | Current Limit | Notes |
|--------|--------------|-------|
| **Instances** | 1-3 (autoscaling) | Triggers at 80% CPU/memory |
| **Plan** | Standard | 1 CPU, 2GB RAM per instance |
| **Uvicorn Workers** | 1 (single worker) | No `--workers` flag in start command |
| **Max Connections per Instance** | 20 | Set in `render.yaml` |
| **DDoS: Requests/minute/IP** | 100 | In-memory tracking |
| **DDoS: Concurrent connections/IP** | 10 | Per-IP limit |
| **DDoS: Max request size** | 10MB | Per-request limit |
| **Rate Limit: Default** | 100/minute/user | slowapi (in-memory) |
| **Rate Limit: Auth** | 5/minute/user | Brute-force protection |
| **Rate Limit: Chat/AI** | 30/minute/user | KIAAN conversations |
| **Rate Limit: Wisdom (read)** | 60/minute/user | Read-heavy endpoints |
| **Cold Start** | 10-30 seconds | Render spins down on free/starter |

**Capacity Estimate (Backend):**

| Users | Instances | Requests/sec | Status |
|-------|-----------|-------------|--------|
| 1-20 | 1 | ~10 RPS | Comfortable |
| 20-50 | 1-2 | ~30 RPS | Moderate load |
| 50-100 | 2-3 | ~60 RPS | Near capacity |
| 100-200 | 3 (max) | ~100 RPS | At capacity limit |
| 200+ | 3 (max) | Degraded | Requests queue/timeout |

**Critical Issue - Single Uvicorn Worker:**
The start command `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` runs only 1 worker process. On a Standard plan with 1 CPU, this means:
- **Only 1 process handles all requests** per instance
- Async I/O helps with I/O-bound tasks (DB queries, OpenAI calls)
- But CPU-bound operations (encryption, JSON serialization) block the event loop
- **Fix:** Add `--workers 2` or use Gunicorn with uvicorn workers

**Critical Issue - In-Memory Rate Limiting:**
Rate limiting uses `slowapi` with in-memory storage. With 3 instances behind a load balancer, each instance tracks limits independently. A user could send `100 * 3 = 300 requests/minute` by hitting different instances.
- **Fix:** Enable Redis-backed rate limiting (`RATE_LIMIT_STORAGE=redis`)

---

### 2.3 Database (PostgreSQL on Render)

| Metric | Current Limit | Notes |
|--------|--------------|-------|
| **Plan** | Standard | Render managed PostgreSQL |
| **Max Connections** | ~97 (Render Standard) | Render reserves some for maintenance |
| **Connection Pool per Instance** | 30 base + 10 overflow = 40 | Configurable via env vars |
| **Total Pool (3 instances)** | 120 connections | Exceeds Render limit of ~97! |
| **Pool Recycle** | 3600s (1 hour) | Stale connection cleanup |
| **Pool Timeout** | 30s | Wait time for free connection |
| **SSL** | Required (self-signed on Render) | cert verification disabled |
| **Storage** | 50GB (Standard) | |

**Critical Issue - Connection Pool Overflow:**
With default settings (pool_size=30, max_overflow=10), each instance can open up to 40 DB connections. With 3 autoscaled instances, that's **120 potential connections** against Render Standard's **~97 connection limit**. This will cause `connection refused` errors under load.

**Capacity Estimate (Database):**

| Concurrent Users | Queries/sec | Pool Usage | Status |
|-----------------|------------|------------|--------|
| 1-30 | ~50 | ~15 connections | Healthy |
| 30-60 | ~150 | ~30 connections | Moderate |
| 60-100 | ~300 | ~50 connections | High, pool contention |
| 100-150 | ~500 | ~70 connections | Near max, timeouts possible |
| 150+ | ~700+ | 97+ connections | Connection errors |

**Recommendation:**
- Reduce pool_size to 15 and max_overflow to 5 per instance (15+5=20, 20*3=60 < 97)
- Or use PgBouncer for external connection pooling
- Add read replicas for read-heavy queries (Gita verses, journey catalogs)

---

### 2.4 Redis Cache (Optional)

| Metric | Current Limit | Notes |
|--------|--------------|-------|
| **Status** | Optional (env-configured) | Graceful fallback when unavailable |
| **Max Connections** | 50 | Configurable |
| **KIAAN Response Cache TTL** | 1 hour | Reduces OpenAI API costs by 50-70% |
| **Verse Cache TTL** | 24 hours | Gita verses rarely change |
| **Translation Cache TTL** | 2 hours | |
| **Max Cache Size** | 512MB | In-memory limit |
| **Session Storage** | 24-hour expiry | Per-session |

**Impact on Capacity:**
- **Without Redis:** Each AI request hits OpenAI API ($$), in-memory rate limits don't work across instances
- **With Redis:** Cached responses serve in <5ms vs 1-3s for OpenAI. Effectively **3-5x more users** at same cost

---

### 2.5 OpenAI API (AI Features)

| Feature | Model | Calls/Request | Estimated Tokens |
|---------|-------|---------------|-----------------|
| KIAAN Chat | gpt-4o-mini | 1 | ~500-2000 |
| Voice Companion | gpt-4o-mini | 1-2 | ~1000-3000 |
| Karma Footprint | gpt-4o-mini | 1 | ~500-1500 |
| Relationship Compass | gpt-4o-mini | 1-2 | ~1000-3000 |
| Emotional Reset | gpt-4o-mini | 1 | ~500-1500 |
| Ardha Reframe | gpt-4o-mini | 1 | ~500-1500 |
| Viyoga Detach | gpt-4o-mini | 1 | ~500-1500 |
| Gita AI Analysis | gpt-4o-mini | 1 | ~1000-3000 |
| Quantum Dive | gpt-4o-mini | 1-3 | ~2000-5000 |
| Daily Wisdom | gpt-4o-mini | 1 | ~300-800 |
| Mood Check | gpt-4o-mini | 1 | ~300-1000 |

**OpenAI Rate Limits (depend on tier):**

| Tier | RPM (Requests/Min) | TPM (Tokens/Min) | Monthly Cost Cap |
|------|-------|------|----------|
| Tier 1 (Free/$5) | 500 | 200,000 | N/A |
| Tier 2 ($50+) | 5,000 | 2,000,000 | ~$100/mo |
| Tier 3 ($100+) | 5,000 | 4,000,000 | ~$500/mo |
| Tier 4 ($250+) | 10,000 | 10,000,000 | ~$1000/mo |

**Capacity Estimate (AI Features):**

| Concurrent AI Users | OpenAI RPM | Tier Required | Est. Monthly Cost |
|---------------------|-----------|--------------|------------------|
| 5-10 | ~50-100 | Tier 1 | $5-20 |
| 10-30 | ~100-300 | Tier 2 | $20-100 |
| 30-100 | ~300-1000 | Tier 3 | $100-500 |
| 100-300 | ~1000-3000 | Tier 4 | $500-2000 |
| 300+ | 3000+ | Tier 5 | $2000+ |

**With Redis caching enabled:** Reduce costs by 50-70% for repeated queries.

---

### 2.6 Voice/TTS Services

| Provider | Usage | Estimated Limit |
|----------|-------|----------------|
| OpenAI TTS | Voice synthesis | Same rate limits as above |
| Sarvam AI Bulbul | Hindi/Indian TTS | API plan dependent |
| Bhashini AI | Government TTS API | Rate limited |
| ElevenLabs | Premium voices | 10K-100K chars/mo (plan dependent) |
| Web Speech API | Browser-native TTS | No server load |

**Bottleneck:** Voice features generate significant bandwidth. A single TTS response can be 50KB-500KB of audio data. 100 concurrent voice users = 5-50MB/sec bandwidth.

---

### 2.7 Mobile App (Android/iOS)

| Metric | Value | Notes |
|--------|-------|-------|
| **Local DB** | Room (SQLite) | Offline-first with local persistence |
| **Background Sync** | WorkManager | Batched sync when online |
| **Pagination** | Paging 3 | Efficient list loading |
| **Image Loading** | Coil (memory-efficient) | Auto-caching and downsizing |
| **Min SDK** | Android API 24 (7.0) | ~95% of Android devices |
| **API Calls** | Retrofit + OkHttp | Connection pooling, request queuing |
| **Encrypted Storage** | EncryptedSharedPreferences | Key material in Android Keystore |

**Mobile Advantage:** The native app offloads significant work to the device (Room DB, local caching, background sync via WorkManager), which reduces server load per mobile user by approximately **40-60%** compared to web users.

---

### 2.8 Service Worker (PWA - Offline)

| Cache | Max Entries | TTL | Strategy |
|-------|------------|-----|----------|
| Static Assets | 3 critical | 30 days | Cache-first |
| Dynamic Pages | 50 | 7 days | Network-first, cache fallback |
| API Responses | 100 | 1 hour (verses: 1 year) | Stale-while-revalidate |
| Images | 100 | 30 days | Cache-first |

**Impact:** The Service Worker reduces server load for returning users by caching static assets, pages, and API responses. Gita verses (most-accessed data) are cached for **1 year**. Estimated **30-50% reduction** in API calls for returning users.

---

## 3. Aggregate Capacity Summary

### Maximum Concurrent Users by Bottleneck

```
Layer                    | Max Concurrent Users | Bottleneck
-------------------------|---------------------|--------------------
Vercel (Hobby)           | ~50-100             | Serverless function limit
Vercel (Pro)             | ~2,000              | Function concurrency
Render API (1 instance)  | ~30-50              | Single uvicorn worker
Render API (3 instances) | ~100-200            | Max instance count
PostgreSQL (Render Std)  | ~100-150            | Connection limit (~97)
OpenAI (Tier 1)          | ~10-20              | 500 RPM
OpenAI (Tier 3)          | ~100-200            | 5,000 RPM
Redis Cache              | ~1,000+             | Rarely the bottleneck
Voice/TTS                | ~50-100             | Bandwidth + API limits
```

### Overall System Capacity (Current Configuration)

| Scenario | Max Users | Limiting Factor |
|----------|-----------|----------------|
| **Current (as-is)** | **~50-80 concurrent** | Single uvicorn worker + DB pool |
| **With multi-worker fix** | **~100-150 concurrent** | DB connection limit (97) |
| **With DB pool tuning** | **~150-200 concurrent** | Render 3-instance max |
| **With Pro Vercel + Tier 3 OpenAI** | **~200-500 concurrent** | Backend scaling limit |
| **With dedicated infrastructure** | **~1,000-5,000 concurrent** | Requires architectural changes |
| **Full enterprise setup** | **~10,000+ concurrent** | Microservices + auto-scaling |

---

## 4. Cost Estimation per User Tier

| Monthly Active Users | Vercel | Render API | Render DB | OpenAI | Redis | Total/Month |
|---------------------|--------|-----------|-----------|--------|-------|-------------|
| 100 | $0 (Hobby) | $25 (Standard) | $20 (Standard) | $10-30 | $0 (disabled) | **~$55-75** |
| 500 | $20 (Pro) | $25 (Standard) | $20 (Standard) | $50-150 | $15 | **~$130-230** |
| 1,000 | $20 (Pro) | $85 (3x Standard) | $50 (Plus) | $100-300 | $30 | **~$285-485** |
| 5,000 | $20 (Pro) | $250+ (custom) | $100+ (Pro) | $300-1000 | $50 | **~$720-1,420** |
| 10,000+ | $100+ (Enterprise) | $500+ | $200+ | $1000-3000 | $100+ | **~$1,900-3,900** |

---

## 5. Critical Issues Found

### P0 (Fix Immediately)

1. **Single Uvicorn Worker**
   - **File:** `render.yaml:10`
   - **Issue:** `startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT` runs 1 worker
   - **Impact:** Cannot utilize multi-core, blocks on CPU-bound operations
   - **Fix:** Use `gunicorn -w 2 -k uvicorn.workers.UvicornWorker backend.main:app`

2. **DB Connection Pool Overflow**
   - **File:** `backend/deps.py:97-100`
   - **Issue:** 40 connections/instance * 3 instances = 120 > Render's ~97 limit
   - **Impact:** Connection refused errors under autoscaling
   - **Fix:** Set `DB_POOL_SIZE=15`, `DB_MAX_OVERFLOW=5`

3. **In-Memory Rate Limiting with Multiple Instances**
   - **File:** `backend/middleware/rate_limiter.py:76-80`
   - **Issue:** slowapi uses in-memory storage, not shared across instances
   - **Impact:** Rate limits multiply by instance count (3x bypass possible)
   - **Fix:** Configure Redis-backed storage for slowapi

### P1 (Fix Before Scale)

4. **In-Memory DDoS Tracking Not Shared**
   - **File:** `backend/middleware/ddos_protection.py:91-103`
   - **Issue:** All DDoS tracking (request history, violations, blocked IPs) is in-memory
   - **Impact:** Attackers can bypass by hitting different instances

5. **No OpenAI API Retry/Circuit Breaker**
   - **Issue:** 11+ endpoints call OpenAI directly
   - **Impact:** OpenAI outage cascades to all AI features simultaneously
   - **Fix:** Add circuit breaker pattern, fallback responses

6. **No Database Read Replicas**
   - **Issue:** All reads and writes go to single PostgreSQL instance
   - **Impact:** Read-heavy queries (Gita verses, journey catalogs) compete with writes

### P2 (Optimize for Growth)

7. **Large Backend Main Module**
   - **File:** `backend/main.py` (1284 lines)
   - **Issue:** 40+ routers loaded synchronously at startup
   - **Impact:** Slow cold starts (10-30s), monolithic deployment

8. **No CDN for Audio/Voice Assets**
   - **Issue:** Audio files served through API instances
   - **Impact:** Bandwidth consumed on compute instances, not CDN edge

9. **No WebSocket for Real-Time Features**
   - **Issue:** Chat rooms imported but no WebSocket evidence in deployment
   - **Impact:** Polling fallback wastes server resources

---

## 6. Scaling Roadmap

### Phase 1: Quick Wins (0-500 users)
- [ ] Add `--workers 2` to uvicorn (or switch to gunicorn)
- [ ] Reduce DB pool to 15+5 per instance
- [ ] Enable Redis for rate limiting and session storage
- [ ] Enable KIAAN response caching in Redis
- [ ] Upgrade Vercel to Pro plan

### Phase 2: Growth Mode (500-2,000 users)
- [ ] Add PgBouncer for connection pooling
- [ ] Add database read replica
- [ ] Implement circuit breaker for OpenAI calls
- [ ] Add CDN for audio/voice file delivery
- [ ] Upgrade OpenAI to Tier 3+
- [ ] Move DDoS tracking to Redis

### Phase 3: Scale Mode (2,000-10,000 users)
- [ ] Move backend to dedicated container orchestration (ECS/k8s)
- [ ] Implement auto-scaling beyond 3 instances
- [ ] Add message queue (Redis/Celery) for async AI processing
- [ ] Implement database sharding by user_id
- [ ] Add multi-region deployment
- [ ] Consider splitting monolith into microservices

### Phase 4: Enterprise Mode (10,000+ users)
- [ ] Full microservices architecture
- [ ] Multi-region database with read replicas
- [ ] Dedicated Redis cluster
- [ ] Event-driven architecture (Kafka/SQS)
- [ ] Custom AI model hosting (reduces OpenAI dependency)
- [ ] Global CDN with edge computing

---

## 7. Testing Recommendations

### Load Test Scenarios

```python
# Scenario 1: Normal usage (browsing + reading)
# 100 users, 60s ramp-up
# Actions: Browse journeys, read Gita verses, view dashboard
# Expected: P95 < 500ms, 0% errors

# Scenario 2: AI-heavy usage (chat + voice)
# 50 users, 60s ramp-up
# Actions: KIAAN chat, voice companion, emotional reset
# Expected: P95 < 3s (AI latency), <1% errors

# Scenario 3: Spike test (sudden traffic)
# 0 -> 200 users in 10s
# Actions: Mixed (browse + chat + voice)
# Expected: Graceful degradation, no crashes

# Scenario 4: Endurance test
# 50 constant users for 2 hours
# Actions: Mixed usage pattern
# Expected: No memory leaks, stable latency
```

### Recommended Tools
- **k6** or **Locust** for HTTP load testing
- **Artillery** for WebSocket and streaming tests
- **Lighthouse** for frontend performance audits
- **pgbench** for database stress testing

---

## 8. Security at Scale

| Concern | Current Status | Recommendation |
|---------|---------------|----------------|
| DDoS Protection | In-memory per-instance | Move to Redis/WAF |
| Rate Limiting | In-memory per-instance | Redis-backed distributed |
| JWT Validation | Per-request DB lookup | Cache user existence in Redis |
| Input Sanitization | Middleware (detect-only) | Enable blocking mode |
| CSRF Protection | Cookie-based | Verified |
| Data Encryption | Fernet at-rest | Verified |
| Audit Logging | Database-backed | Verified |

---

## 9. Conclusion

**MindVibe can currently support approximately 50-80 concurrent users** in its current configuration. With the P0 fixes (multi-worker uvicorn, DB pool tuning, Redis rate limiting), this increases to **150-200 concurrent users**. The architecture is fundamentally sound with async I/O, proper caching strategies, and offline-first mobile design. The main scaling constraints are:

1. Render's 3-instance autoscaling limit
2. PostgreSQL connection limits
3. OpenAI API rate limits and costs
4. Single-process uvicorn workers

The mobile app's offline-first architecture (Room DB, WorkManager, encrypted local storage) significantly reduces per-user server load, making it the more scalable client platform. The PWA service worker similarly reduces repeated API calls for web users.

For growth beyond 500 users, the recommended path is: Redis caching (immediate) -> PgBouncer + read replicas (growth) -> container orchestration (scale) -> microservices (enterprise).
