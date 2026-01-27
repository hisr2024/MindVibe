# Wisdom Journeys Deep Audit Report

**Date:** January 27, 2026
**Auditor:** Claude Code (Opus 4.5)
**Files Scanned:** 70+ files across frontend, backend, services, models, and tests

---

## Executive Summary

A comprehensive security and code quality audit of the Wisdom Journeys feature identified **17 issues** across the codebase:

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | Requires immediate attention |
| High | 4 | Fix within current sprint |
| Medium | 6 | Add to backlog |
| Low | 4 | Nice to have |

---

## Critical Issues

### 1. SECURITY: Unencrypted User Reflections

**Location:** `backend/services/journey_engine_enhanced.py:776-781`

```python
if reflection_response:
    step_state.reflection_encrypted = {
        "content": reflection_response,  # ← PLAINTEXT - Should be encrypted
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
    }
```

**Issue:** User reflections containing sensitive mental health information are stored in plaintext JSON despite the field being named `reflection_encrypted`. This violates HIPAA-grade security requirements.

**Impact:**
- Data breach would expose highly sensitive mental health data
- Potential regulatory compliance issues
- User trust violation

**Remediation:**
1. Integrate with existing journal encryption system (Fernet/AES-256)
2. Store encrypted content with key reference
3. Add decryption at display time only

---

### 2. ARCHITECTURE: Duplicate Journey Systems

**Issue:** Two parallel journey systems exist creating confusion and maintenance overhead:

| System | API Routes | Service | Models |
|--------|------------|---------|--------|
| Legacy | `/api/wisdom-journey/*` | `wisdom_journey_service.py` | `WisdomJourney`, `JourneyStep` |
| Enhanced | `/api/journeys/*` | `journey_engine_enhanced.py` | `UserJourney`, `UserJourneyStepState` |

**Files Affected:**
- `backend/routes/wisdom_journey.py` (legacy)
- `backend/routes/journeys_enhanced.py` (enhanced)
- `backend/services/wisdom_journey_service.py` (legacy)
- `backend/services/journey_engine_enhanced.py` (enhanced)
- `services/wisdomJourneyService.ts` (legacy frontend)
- `services/journeysEnhancedService.ts` (enhanced frontend)

**Impact:**
- Code duplication (~2000 lines)
- Inconsistent API contracts
- Potential data inconsistencies between systems
- Developer confusion

**Remediation:**
1. Document which system is current/preferred (enhanced)
2. Create migration path for legacy data
3. Deprecate legacy endpoints with sunset date
4. Consolidate frontend services

---

### 3. BUG: Incorrect Progress Calculation

**Location:** `backend/services/journey_engine_enhanced.py:664`

```python
"progress_percentage": int((j.current_day_index / total_days) * 100),
```

**Issue:** Progress calculation uses `current_day_index` instead of counting actually completed steps. If a user is on day 5 but only completed 2 steps, progress shows 36% instead of 14%.

**Impact:**
- Users see misleading progress information
- Analytics data is inaccurate
- Completion predictions are wrong

**Remediation:**
```python
# Correct calculation
completed_count = len([s for s in j.step_states if s.completed_at])
"progress_percentage": int((completed_count / total_days) * 100),
```

---

## High Priority Issues

### 4. RACE CONDITION: Step Completion

**Location:** `backend/services/journey_engine_enhanced.py:726-804`

**Issue:** No database-level locking when completing steps. Two concurrent requests could both succeed, causing double-completion.

**Remediation:** Add `SELECT FOR UPDATE` or use atomic increment.

---

### 5. SECURITY: Missing Authorization in TodayAgenda

**Location:** `backend/services/journey_engine_enhanced.py:443-536`

**Issue:** The service layer trusts the `user_id` parameter without verification. If API layer passes incorrect user_id, unauthorized access occurs.

**Remediation:** Add explicit ownership check or ensure all callers validate JWT claims match user_id.

---

### 6. ERROR HANDLING: Silent Failures in Frontend

**Location:** `services/wisdomJourneyService.ts:246-286`

**Issue:** `markStepComplete()` silently swallows errors. Users don't know their progress failed to save.

**Remediation:** Return error state and show user-friendly message with retry option.

---

### 7. CACHING: No Protection Against Stale Demo Data

**Location:** `services/journeysEnhancedService.ts`

**Issue:** Demo/fallback templates are cached without markers. After database seeding, stale data persists.

**Remediation:** Check `X-MindVibe-Fallback` header and skip caching for fallback responses.

---

## Medium Priority Issues

### 8. NO INPUT VALIDATION: Provider Preference

**Location:** `app/journeys/JourneysCatalogClient.tsx:209`

**Issue:** UI allows selecting only `auto | openai | sarvam` but backend supports `oai_compat` too. Type mismatch.

---

### 9. MISSING INDEX: Composite Query Performance

**Location:** `backend/models.py:2931-2932`

**Issue:** Need separate index on `user_journey_id` for single-column queries.

---

### 10. HARDCODED DEMO TEMPLATES: Sync Risk

**Locations:**
- Backend: `backend/routes/journeys_enhanced.py:240-325` (7 templates)
- Frontend: `services/journeysEnhancedService.ts:360-409` (4 templates)

**Issue:** Demo templates differ between frontend and backend.

---

### 11. NO RATE LIMITING: AI Step Generation

**Location:** `backend/services/journey_engine_enhanced.py:254-357`

**Issue:** AI calls in `StepGenerator` lack internal rate limiting.

---

### 12. MEMORY LEAK: Unbounded Cache

**Location:** `backend/services/gita_corpus_adapter.py:142`

**Issue:** `self._cache` dict can grow indefinitely with 700+ verses.

**Remediation:** Use `functools.lru_cache` or TTL cache with max size.

---

### 13. DEPRECATED API: Pydantic v2

**Location:** `backend/services/journey_coach.py:81-86`

**Issue:** `@validator` is deprecated, use `@field_validator` in Pydantic v2.

---

## Low Priority Issues

### 14. INCONSISTENT: Missing Soft Delete

`UserJourneyStepState` doesn't extend `SoftDeleteMixin` unlike related models.

### 15. INCOMPLETE: Localization

Journey catalog shows English-only despite 15+ language files existing.

### 16. NO RETRY: Database Operations

Engine DB operations lack retry logic for transient failures.

### 17. INCONSISTENT: Type Definitions

`VerseReference` defined differently in Python (TypedDict) and TypeScript (interface).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│ Pages:                                                          │
│   /journeys/           → JourneysCatalogClient.tsx              │
│   /journeys/today      → TodayAgendaClient.tsx                  │
│   /wisdom-journey/     → WisdomJourneyClient.tsx (legacy)       │
├─────────────────────────────────────────────────────────────────┤
│ Services:                                                       │
│   journeysEnhancedService.ts  ← PREFERRED (enhanced system)     │
│   wisdomJourneyService.ts     ← LEGACY (to deprecate)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│ Routes:                                                         │
│   /api/journeys/*      → journeys_enhanced.py  ← PREFERRED      │
│   /api/wisdom-journey/* → wisdom_journey.py    ← LEGACY         │
├─────────────────────────────────────────────────────────────────┤
│ Services:                                                       │
│   journey_engine_enhanced.py  ← PREFERRED                       │
│   │  ├─ JourneyScheduler                                        │
│   │  ├─ VersePicker                                             │
│   │  ├─ StepGenerator                                           │
│   │  └─ TodayAgenda                                             │
│   │                                                             │
│   journey_coach.py (KIAAN AI)                                   │
│   gita_corpus_adapter.py (700+ verses)                          │
│   wisdom_journey_service.py  ← LEGACY                           │
├─────────────────────────────────────────────────────────────────┤
│ Models:                                                         │
│   JourneyTemplate      → Admin-defined journey blueprints       │
│   JourneyTemplateStep  → Day-by-day skeleton                    │
│   UserJourney          → User's journey instance                │
│   UserJourneyStepState → AI-generated content & progress        │
│   WisdomJourney        → LEGACY model                           │
│   JourneyStep          → LEGACY model                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recommended Fix Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Encryption (#1) | Medium | Critical security |
| 2 | Progress calculation (#3) | Low | User experience |
| 3 | Race condition (#4) | Low | Data integrity |
| 4 | Error handling (#6) | Low | User experience |
| 5 | Architecture consolidation (#2) | High | Maintainability |

---

## Test Coverage Notes

The following test files exist:
- `tests/unit/test_journeys_enhanced.py` (14,307 bytes)
- `tests/unit/test_wisdom_journey_service.py` (14,873 bytes)
- `tests/integration/test_journeys_enhanced_api.py` (9,921 bytes)

**Gaps identified:**
- No tests for race condition scenarios
- No tests for encryption/decryption
- No tests for cache invalidation
- No load tests for AI step generation

---

## Conclusion

The Wisdom Journeys feature is architecturally sound but has critical security gaps that must be addressed before production use with real user data. The duplicate system architecture creates unnecessary complexity and should be consolidated.

**Next Steps:**
1. Create security fix PR for encryption issue
2. Fix progress calculation
3. Add database locking
4. Create deprecation plan for legacy system
